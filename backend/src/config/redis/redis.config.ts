import { envConfig } from "../env/env.config";
import Redis, { RedisOptions } from "ioredis";
import { RedisConnectionState } from "./interfaces/Redis";
import { logger } from "../../shared/utils/logger.utils";

/**
 * Cliente Redis opcional.
 *
 * O Redis e tratado como acelerador, nunca como dependencia obrigatoria: se ele
 * estiver desabilitado, indisponivel ou cair em runtime, o servidor continua
 * operando contra o PostgreSQL. Por isso:
 *
 * - `enableOfflineQueue: false` — comandos falham imediatamente em vez de
 *   acumularem em memoria esperando uma reconexao que pode nunca vir.
 * - `retryStrategy` limitado — apos `maxReconnectionAttempts` o cliente para de
 *   tentar, evitando log-spam e churn de socket indefinidos.
 * - Erros de conexao sao logados, nunca propagados: derrubar o processo por
 *   causa do cache anularia o proposito do fallback.
 */
class RedisClient {
    private static instance: RedisClient;
    private client: Redis | null = null;
    private connectionState: RedisConnectionState = {
        isConnected: false,
        hasConnectedOnce: false,
        reconnectAttempts: 0,
    };

    private constructor() {
        this.initialize();
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    private buildOptions(): RedisOptions {
        const {
            redisHost,
            redisPort,
            redisPassword,
            maxReconnectionAttempts,
            reconnectBaseDelay,
            reconnectMaxDelay,
            connectTimeout,
            maxRetriesPerRequest,
        } = envConfig.redis;

        return {
            host: redisHost,
            port: Number(redisPort),
            password: redisPassword,
            connectTimeout,
            maxRetriesPerRequest,
            enableReadyCheck: true,
            // Sem fila offline: comando emitido com Redis fora falha na hora e o
            // chamador cai no PostgreSQL, em vez de ficar pendurado.
            enableOfflineQueue: false,
            lazyConnect: false,
            retryStrategy: (attempt: number): number | null => {
                this.connectionState.reconnectAttempts = attempt;

                if (attempt > maxReconnectionAttempts) {
                    logger.error(
                        `Redis unreachable after ${maxReconnectionAttempts} attempts. ` +
                        `Giving up — application continues without cache.`
                    );
                    return null;
                }

                const delay = Math.min(
                    reconnectBaseDelay * 2 ** (attempt - 1),
                    reconnectMaxDelay
                );

                logger.warn(
                    `Redis reconnection attempt ${attempt}/${maxReconnectionAttempts} in ${delay}ms`
                );

                return delay;
            },
        };
    }

    private initialize(): void {
        if (!envConfig.redis.redisEnabled) {
            logger.warn("Redis is disabled via configuration. Using PostgreSQL only.");
            return;
        }

        if (!envConfig.redis.redisHost || !envConfig.redis.redisPort) {
            logger.error("Redis configuration is incomplete. Using PostgreSQL only.");
            return;
        }

        try {
            this.client = new Redis(this.buildOptions());

            this.client.on("ready", () => {
                this.connectionState.isConnected = true;
                this.connectionState.hasConnectedOnce = true;
                this.connectionState.reconnectAttempts = 0;
                logger.info(`Redis connected on port ${envConfig.redis.redisPort}...`);
            });

            // Sem listener de "error" o ioredis emite um unhandled 'error' event,
            // que derruba o processo Node inteiro quando o Redis cai.
            this.client.on("error", (error: Error) => {
                this.connectionState.isConnected = false;
                logger.error(`Redis error: ${error.message}`);
            });

            this.client.on("close", () => {
                this.connectionState.isConnected = false;
            });

            this.client.on("end", () => {
                this.connectionState.isConnected = false;
                logger.warn("Redis connection ended. Operating without cache.");
            });

        } catch (error) {
            this.client = null;
            logger.error(`Failed to create Redis client: ${error}. Using PostgreSQL only.`);
        }
    }

    public isEnabled(): boolean {
        return this.client !== null;
    }

    public isConnected(): boolean {
        return this.client !== null && this.connectionState.isConnected;
    }

    public getClient(): Redis | null {
        return this.client;
    }

    /**
     * Espera a conexao ficar pronta, com timeout.
     *
     * `isEnabled()` apenas informa que o objeto cliente foi criado — nao que
     * ele conectou. Quem precisa do Redis de fato (BullMQ) tem que aguardar
     * este sinal, senao emite comandos contra uma conexao que nunca sobe e
     * fica pendurado indefinidamente.
     */
    public waitForReady(timeoutMs: number): Promise<boolean> {
        if (!this.client) {
            return Promise.resolve(false);
        }

        if (this.connectionState.isConnected) {
            return Promise.resolve(true);
        }

        const client = this.client;

        return new Promise<boolean>((resolve) => {
            const finish = (value: boolean) => {
                clearTimeout(timer);
                client.off("ready", onReady);
                client.off("end", onEnd);
                resolve(value);
            };

            const onReady = () => finish(true);
            const onEnd = () => finish(false);

            const timer = setTimeout(() => finish(false), timeoutMs);

            client.once("ready", onReady);
            client.once("end", onEnd);
        });
    }

    public async healthCheck(): Promise<boolean> {
        if (!this.client || !this.connectionState.isConnected) {
            return false;
        }

        try {
            await this.client.ping();
            return true;
        } catch {
            return false;
        }
    }

    public async shutdown(): Promise<void> {
        if (this.client) {
            try {
                await this.client.quit();
                logger.info("Redis connection closed");
            } catch (error) {
                logger.error(`Redis shutdown error: ${error}`);
                this.client.disconnect();
            }
            this.client = null;
            this.connectionState.isConnected = false;
        }
    }
}

const redisClient = RedisClient.getInstance();

export const getRedisClient = (): Redis | null => redisClient.getClient();
export const isRedisEnabled = (): boolean => redisClient.isEnabled();
export const isRedisConnected = (): boolean => redisClient.isConnected();
export const redisHealthCheck = (): Promise<boolean> => redisClient.healthCheck();
export const waitForRedis = (timeoutMs = 5000): Promise<boolean> =>
    redisClient.waitForReady(timeoutMs);
export const shutdownRedis = (): Promise<void> => redisClient.shutdown();
