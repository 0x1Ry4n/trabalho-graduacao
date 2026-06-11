import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../../config/redis/redis.config';
import { logger } from '../../shared/utils/logger.utils';
import Container from 'typedi';
import EnrollmentService from '../../modules/enrollments/enrollment.service';

const connection = getRedisClient()!;
connection.options.maxRetriesPerRequest = null;
connection.options.enableReadyCheck = false;

// worker para processar os jobs de geração de mensalidades que gera as mensalidades para as matrículas ativas que ainda não possuem mensalidade gerada para o mês/ano especificado, e que possuem taxa de matrícula paga
export function createMonthlyFeeWorker() {
    const worker = new Worker(
        'monthly-fee',
        async (job: Job) => {
            const enrollmentService = Container.get(EnrollmentService);

            logger.info(`[MonthlyFeeJob] Starting to generate monthly fees... ${new Date().toISOString()}`);

            const accountReceivables = await enrollmentService.generateMonthlyFees();

            if (accountReceivables !== null) {
                logger.info(`[MonthlyFeeJob] ${accountReceivables.length} monthly fees generated`);
            } else {
                logger.info('[MonthlyFeeJob] No monthly fees to be generated');
            }

            return { count: accountReceivables?.length ?? 0 };
        },
        { connection, concurrency: 1 },
    );

    worker.on('completed', () => {
        logger.info(`[MonthlyFeeJob] Successfully completed ${new Date().toISOString()}`);
    });

    worker.on('failed', (job, error) => {
        logger.error(`[MonthlyFeeJob] Error generating monthly fees (attempt) ${job?.attemptsMade}): ${error}`);
    });

    return worker;
}