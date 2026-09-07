import type { Redis } from 'ioredis';
import { getRedisClient } from '../config/redis/redis.config';
import { logger } from '../shared/utils/logger.utils';
import { envConfig } from '../config/env/env.config';

const MAX_ATTEMPTS = envConfig.redis.maxReconnectionAttempts;
const BASE_DELAY = envConfig.redis.reconnectBaseDelay;
const MAX_DELAY = envConfig.redis.reconnectMaxDelay;

/**
 * Conexão dedicada para BullMQ.
 *
 * Duas razões para não reaproveitar o cliente compartilhado:
 *
 * 1. O BullMQ exige `maxRetriesPerRequest: null` e `enableReadyCheck: false`
 *    por causa dos comandos bloqueantes (BRPOPLPUSH). A versão anterior obtinha
 *    esse comportamento mutando `getRedisClient()!.options` — o que alterava o
 *    mesmo objeto usado pelo CacheService, propagando a configuração de fila
 *    para todo o cache da aplicação.
 * 2. Comandos bloqueantes ocupam a conexão inteira. Compartilhá-la faria as
 *    leituras de cache esperarem atrás de um `BRPOPLPUSH`.
 *
 * Retorna `null` quando o Redis está desabilitado ou não pôde ser criado; nesse
 * caso as filas simplesmente não são inicializadas e o servidor sobe sem elas.
 */
export function createBullConnection(name: string): Redis | null {
    const client = getRedisClient();

    if (!client) {
        return null;
    }

    try {
        const connection = client.duplicate({
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            // BullMQ depende da fila offline para não perder comandos durante
            // uma reconexão — ao contrário do cache, onde ela é indesejada.
            enableOfflineQueue: true,
            // retryStrategy própria: `duplicate()` copiaria a do cliente
            // principal, que escreve no estado de conexão do singleton. Cada
            // conexão duplicada incrementaria o mesmo contador e emitiria seu
            // próprio log de "desistindo", multiplicando o ruído.
            retryStrategy: (attempt: number): number | null => {
                if (attempt > MAX_ATTEMPTS) {
                    logger.error(
                        `[BullMQ:${name}] Redis unreachable after ${MAX_ATTEMPTS} attempts. Queue disabled.`
                    );
                    return null;
                }

                return Math.min(BASE_DELAY * 2 ** (attempt - 1), MAX_DELAY);
            },
        });

        // Sem este listener um erro de conexão vira 'unhandled error event' e
        // derruba o processo Node inteiro.
        connection.on('error', (error: Error) => {
            logger.error(`[BullMQ:${name}] Redis connection error: ${error.message}`);
        });

        return connection;
    } catch (error) {
        logger.error(`[BullMQ:${name}] Failed to create Redis connection: ${error}`);
        return null;
    }
}
