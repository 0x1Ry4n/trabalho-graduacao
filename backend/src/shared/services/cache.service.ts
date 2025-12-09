import { Service } from 'typedi';
import { getRedisClient, isRedisConnected } from '../../config/redis/redis.config';
import { logger } from '../utils/logger.utils';
import { Redis } from 'ioredis';

@Service()
export default class CacheService {
    private readonly DEFAULT_TTL = 300;

    private getClient(): Redis | null {
        return getRedisClient();
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const client = this.getClient();

            if (!client || !isRedisConnected()) {
                logger.warn('Redis not ready, skipping cache get');
                return null;
            }

            const data = await client.get(key);
            if (!data) return null;

            return JSON.parse(data) as T;
        } catch (error) {
            logger.error(`Cache get error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
        try {
            const client = this.getClient();

            if (!client || !isRedisConnected()) {
                logger.warn('Redis not ready, skipping cache set');
                return;
            }

            const validTTL = Math.max(1, Math.floor(ttl));

            if (!Number.isInteger(validTTL) || validTTL <= 0) {
                logger.error(`Invalid TTL value: ${ttl}, using default: ${this.DEFAULT_TTL}`);
                await client.setex(key, this.DEFAULT_TTL, JSON.stringify(value));
                return;
            }

            await client.setex(key, validTTL, JSON.stringify(value));
        } catch (error) {
            logger.error(`Cache set error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const client = this.getClient();

            if (!client || !isRedisConnected()) return;

            await client.del(key);
        } catch (error) {
            logger.error(`Cache delete error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        try {
            const client = this.getClient();

            if (!client || !isRedisConnected()) return;

            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        } catch (error) {
            logger.error(`Cache delete pattern error for ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    generateKey(...parts: (string | number)[]): string {
        return parts.join(':');
    }
}