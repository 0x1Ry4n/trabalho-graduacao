import { envConfig } from "../env/env.config";
import Redis, { RedisOptions } from "ioredis";
import { RedisConnectionState } from "./interfaces/Redis";
import { logger } from "../../shared/utils/logger.utils";

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

    private initialize(): void {
        if (!envConfig.redis.redisEnabled) {
            logger.warn("Redis is disabled via configuration.");
            return;
        }

        if (!envConfig.redis.redisHost || !envConfig.redis.redisPort) {
            logger.error("Redis configuration is incomplete");
            return;
        }

        try {
            this.client = new Redis({
                host: envConfig.redis.redisHost,
                port: Number(envConfig.redis.redisPort),
                password: envConfig.redis.redisPassword,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false,
            });

            this.client.on("ready", () => {
                this.connectionState.isConnected = true;
                this.connectionState.hasConnectedOnce = true;
                logger.info(`Redis connected on port ${envConfig.redis.redisPort}...`);
            });

            this.client.on("error", (error: Error) => {
                this.connectionState.isConnected = false;
                logger.error(`Redis error: ${error.message}`);
            });

            this.client.on("close", () => {
                this.connectionState.isConnected = false;
            });

        } catch (error) {
            logger.error(`Failed to create Redis client: ${error}`);
        }
    }

    public isEnabled(): boolean {
        return this.client !== null;
    }

    public isConnected(): boolean {
        return this.connectionState.isConnected;
    }

    public getClient(): Redis | null {
        return this.client;
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
        }
    }
}

const redisClient = RedisClient.getInstance();

export const getRedisClient = (): Redis | null => redisClient.getClient();
export const isRedisEnabled = (): boolean => redisClient.isEnabled();
export const isRedisConnected = (): boolean => redisClient.isConnected();
export const redisHealthCheck = (): Promise<boolean> => redisClient.healthCheck();