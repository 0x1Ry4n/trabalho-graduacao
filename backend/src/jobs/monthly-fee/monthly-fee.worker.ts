import { Worker, Job } from 'bullmq';
import { createBullConnection } from '../bullmq.connection';
import { logger } from '../../shared/utils/logger.utils';
import Container from 'typedi';
import EnrollmentService from '../../modules/enrollments/enrollment.service';

// worker para processar os jobs de geração de mensalidades que gera as mensalidades para as matrículas ativas que ainda não possuem mensalidade gerada para o mês/ano especificado, e que possuem taxa de matrícula paga
export function createMonthlyFeeWorker(): Worker | null {
    // Conexão obtida aqui, não no import: sem Redis o worker não é criado e o
    // servidor sobe normalmente, apenas sem processamento de fila.
    const connection = createBullConnection('monthly-fee-worker');

    if (!connection) {
        logger.warn('[Jobs] Redis unavailable — monthly-fee worker not started');
        return null;
    }

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

    worker.on('error', (error) => {
        logger.error(`[MonthlyFeeJob] Worker error: ${error}`);
    });

    return worker;
}
