import { logger } from '../../shared/utils/logger.utils';
import { isRedisEnabled, waitForRedis } from '../../config/redis/redis.config';
import { scheduleMonthlyFeeJob } from './monthly-fee.job';
import { createMonthlyFeeWorker } from './monthly-fee.worker';

/** Tempo máximo de espera pela conexão com o Redis no boot. */
const REDIS_READY_TIMEOUT_MS = 5_000;

/** Tempo máximo para o agendamento concluir antes de ser abandonado. */
const SCHEDULE_TIMEOUT_MS = 10_000;

/**
 * Falha o await depois de `ms`, para que uma operação pendurada no Redis não
 * segure o boot indefinidamente.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ]);
}

/**
 * Inicializa as filas de mensalidades.
 *
 * O BullMQ não tem backend alternativo ao Redis: sem ele, a geração automática
 * de mensalidades fica indisponível. Isso é degradação consciente — a API
 * inteira continua no ar e as mensalidades podem ser geradas manualmente.
 *
 * A conectividade é verificada de fato antes de criar fila e worker.
 * `isRedisEnabled()` só informa que o objeto cliente existe; emitir comandos
 * sem conexão estabelecida deixava `upsertJobScheduler` pendurado para sempre
 * e as rejeições internas do BullMQ derrubavam o processo.
 */
export async function initMonthlyFeeJobs() {
    if (!isRedisEnabled()) {
        logger.warn(
            '[Jobs] Redis disabled — monthly-fee jobs will not run. ' +
            'The API remains fully functional; monthly fees must be generated manually.'
        );
        return;
    }

    const ready = await waitForRedis(REDIS_READY_TIMEOUT_MS);

    if (!ready) {
        logger.warn(
            `[Jobs] Redis not reachable within ${REDIS_READY_TIMEOUT_MS}ms — ` +
            'monthly-fee jobs will not run. The API remains fully functional; ' +
            'monthly fees must be generated manually.'
        );
        return;
    }

    try {
        createMonthlyFeeWorker();
        await withTimeout(
            scheduleMonthlyFeeJob(),
            SCHEDULE_TIMEOUT_MS,
            '[Jobs] monthly-fee scheduling'
        );
        logger.info('[Jobs] Monthly-fee jobs successfully initialized');
    } catch (error) {
        logger.error(`[Jobs] Error initializing Monthly-fee jobs: ${error}`);
    }
}
