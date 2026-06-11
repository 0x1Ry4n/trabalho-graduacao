import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis/redis.config';

const connection = getRedisClient()!;
connection.options.maxRetriesPerRequest = null;
connection.options.enableReadyCheck = false;


// fila de eventos do job de geração de mensalidades
export const monthlyFeeQueue = new Queue('monthly-fee', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
    },
});

// cronjob para agendar a geração de mensalidades no primeiro dia de cada mês às 8h da manhã
export async function scheduleMonthlyFeeJob() {
    await monthlyFeeQueue.upsertJobScheduler(
        'monthly-fee-scheduler',
        { pattern: '0 8 1 * *', tz: 'America/Sao_Paulo' },
        { name: 'generate-monthly-fees', data: {} },
    );
}