import { Queue } from 'bullmq';
import { createBullConnection } from '../bullmq.connection';
import { logger } from '../../shared/utils/logger.utils';

// A fila é criada sob demanda, não no import do módulo. A versão anterior fazia
// `const connection = getRedisClient()!` em escopo de módulo: com o Redis
// desabilitado isso era `null`, e o acesso a `.options` lançava um TypeError
// durante o import — antes de qualquer try/catch — impedindo o servidor de subir.
let queue: Queue | null = null;
let initialized = false;

/** Retorna a fila de mensalidades, ou `null` se o Redis não estiver disponível. */
export function getMonthlyFeeQueue(): Queue | null {
    if (initialized) {
        return queue;
    }

    initialized = true;

    const connection = createBullConnection('monthly-fee');

    if (!connection) {
        logger.warn('[Jobs] Redis unavailable — monthly-fee queue not created');
        return null;
    }

    queue = new Queue('monthly-fee', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        },
    });

    return queue;
}

// cronjob para agendar a geração de mensalidades no primeiro dia de cada mês às 8h da manhã
export async function scheduleMonthlyFeeJob(): Promise<void> {
    const monthlyFeeQueue = getMonthlyFeeQueue();

    if (!monthlyFeeQueue) {
        logger.warn('[Jobs] Skipping monthly-fee scheduling: no queue available');
        return;
    }

    await monthlyFeeQueue.upsertJobScheduler(
        'monthly-fee-scheduler',
        { pattern: '0 8 1 * *', tz: 'America/Sao_Paulo' },
        { name: 'generate-monthly-fees', data: {} },
    );
}
