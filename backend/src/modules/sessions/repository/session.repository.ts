import { eq } from "drizzle-orm";
import { Service, Inject } from "typedi";
import { db } from "../../../config/db/db.config";
import { sessionsTable } from "../../../config/db/db.schema";
import { Session } from "../interfaces/Session";
import { envConfig } from "../../../config/env/env.config";
import { ISessionRepository } from "./ISessionRepository";
import { parseTimeToSeconds } from "../../../shared/utils/date.utils";
import { logger } from "../../../shared/utils/logger.utils";
import CacheService from "../../../shared/services/cache.service";
import { UserSession } from "../session.types";

@Service()
export default class SessionRepository implements ISessionRepository {
    private readonly CACHE_PREFIX = {
        SESSION: 'session',
        USER_SESSION: 'user_session',
    };

    constructor(
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }


    private getSessionTTL(): number {
        const sessionExpiresIn = envConfig.auth.sessionExpiresIn || '12h';
        return parseTimeToSeconds(sessionExpiresIn.toString());
    }

    async store(session: UserSession): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

                if (ttl <= 0) {
                    logger.warn(`Session TTL expired for userId: ${session.userId}`);
                    return;
                }

                const sessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.SESSION,
                    session.refreshToken
                );
                const userSessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.USER_SESSION,
                    session.userId
                );

                await Promise.all([
                    this.cacheService.set(sessionKey, session.userId, ttl),
                    this.cacheService.set(userSessionKey, session.refreshToken, ttl),
                ]);

                logger.info(`Session stored in Redis for userId: ${session.userId} (TTL: ${ttl}s)`);
                return;
            } catch (error) {
                logger.error(`Failed to store session in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            await db.insert(sessionsTable).values({
                userId: session.userId,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger.info(`Session stored in database for userId: ${session.userId}`);
        } catch (error) {
            logger.error(`Failed to store session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async update(userId: number, session: UserSession): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

                if (ttl <= 0) {
                    logger.warn(`Session TTL expired for userId: ${userId}`);
                    return;
                }

                const userSessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.USER_SESSION,
                    userId
                );

                // Remove token antigo
                const oldRefreshToken = await this.cacheService.get<string>(userSessionKey);
                if (oldRefreshToken) {
                    const oldSessionKey = this.cacheService.generateKey(
                        this.CACHE_PREFIX.SESSION,
                        oldRefreshToken
                    );
                    await this.cacheService.delete(oldSessionKey);
                }

                const sessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.SESSION,
                    session.refreshToken
                );

                await Promise.all([
                    this.cacheService.set(sessionKey, session.userId, ttl),
                    this.cacheService.set(userSessionKey, session.refreshToken, ttl),
                ]);

                logger.info(`Session updated in Redis for userId: ${userId} (TTL: ${ttl}s)`);
                return;
            } catch (error) {
                logger.error(`Failed to update session in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            await db
                .update(sessionsTable)
                .set({
                    refreshToken: session.refreshToken,
                    expiresAt: session.expiresAt,
                    updatedAt: new Date(),
                })
                .where(eq(sessionsTable.userId, userId));

            logger.info(`Session updated in database for userId: ${userId}`);
        } catch (error) {
            logger.error(`Failed to update session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async findByUserId(userId: number): Promise<Session | null> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const userSessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.USER_SESSION,
                    userId
                );

                const refreshToken = await this.cacheService.get<string>(userSessionKey);

                if (!refreshToken) {
                    logger.debug(`Session not found in Redis for userId: ${userId}`);
                    return null;
                }

                // Calcula expiresAt baseado na configuração SESSION_EXPIRES_IN
                const sessionTTL = this.getSessionTTL();
                const expiresAt = new Date(Date.now() + sessionTTL * 1000);

                logger.debug(`Session found in Redis for userId: ${userId}`);
                return {
                    id: '',
                    userId,
                    refreshToken,
                    expiresAt,
                };
            } catch (error) {
                logger.error(`Failed to find session in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            const [session] = await db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.userId, userId))
                .limit(1);

            if (session) {
                logger.debug(`Session found in database for userId: ${userId}`);
            } else {
                logger.debug(`Session not found in database for userId: ${userId}`);
            }

            return session ?? null;
        } catch (error) {
            logger.error(`Failed to find session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async findByRefreshToken(refreshToken: string): Promise<Session | null> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const sessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.SESSION,
                    refreshToken
                );

                const userId = await this.cacheService.get<number>(sessionKey);

                if (!userId) {
                    logger.debug(`Session not found in Redis for refreshToken`);
                    return null;
                }

                if (typeof userId !== 'number') {
                    logger.error(`Invalid userId type in Redis: ${typeof userId}`);
                    return null;
                }

                // Calcula expiresAt baseado na configuração SESSION_EXPIRES_IN
                const sessionTTL = this.getSessionTTL();
                const expiresAt = new Date(Date.now() + sessionTTL * 1000);

                logger.debug(`Session found in Redis for userId: ${userId}`);
                return {
                    id: '',
                    userId,
                    refreshToken,
                    expiresAt,
                };
            } catch (error) {
                logger.error(`Failed to find session by refreshToken in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            const [session] = await db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.refreshToken, refreshToken))
                .limit(1);

            if (session) {
                logger.debug(`Session found in database`);
            } else {
                logger.debug(`Session not found in database`);
            }

            return session ?? null;
        } catch (error) {
            logger.error(`Failed to find session by refreshToken in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async removeByRefreshToken(refreshToken: string): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const sessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.SESSION,
                    refreshToken
                );

                const userId = await this.cacheService.get<number>(sessionKey);

                const deletionPromises = [
                    this.cacheService.delete(sessionKey)
                ];

                if (userId) {
                    const userSessionKey = this.cacheService.generateKey(
                        this.CACHE_PREFIX.USER_SESSION,
                        userId
                    );
                    deletionPromises.push(this.cacheService.delete(userSessionKey));
                }

                await Promise.all(deletionPromises);

                logger.info(`Session removed from Redis${userId ? ` for userId: ${userId}` : ''}`);
                return;
            } catch (error) {
                logger.error(`Failed to remove session from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            await db
                .delete(sessionsTable)
                .where(eq(sessionsTable.refreshToken, refreshToken));

            logger.info(`Session removed from database`);
        } catch (error) {
            logger.error(`Failed to remove session from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async removeAllByUserId(userId: number): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const userSessionKey = this.cacheService.generateKey(
                    this.CACHE_PREFIX.USER_SESSION,
                    userId
                );

                const refreshToken = await this.cacheService.get<string>(userSessionKey);

                const deletionPromises = [
                    this.cacheService.delete(userSessionKey)
                ];

                if (refreshToken) {
                    const sessionKey = this.cacheService.generateKey(
                        this.CACHE_PREFIX.SESSION,
                        refreshToken
                    );
                    deletionPromises.push(this.cacheService.delete(sessionKey));
                }

                await Promise.all(deletionPromises);

                logger.info(`All sessions removed from Redis for userId: ${userId}`);
                return;
            } catch (error) {
                logger.error(`Failed to remove all sessions from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        try {
            await db
                .delete(sessionsTable)
                .where(eq(sessionsTable.userId, userId));

            logger.info(`All sessions removed from database for userId: ${userId}`);
        } catch (error) {
            logger.error(`Failed to remove all sessions from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async removeByPattern(pattern: string): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            try {
                const fullPattern = this.cacheService.generateKey(pattern);
                await this.cacheService.deletePattern(fullPattern);
                logger.info(`Sessions removed from Redis by pattern: ${pattern}`);
                return;
            } catch (error) {
                logger.error(`Failed to remove sessions by pattern from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    async cleanExpiredSessions(): Promise<void> {
        if (envConfig.auth.sessionStorageMethod === 'redis') {
            const sessionExpiresIn = envConfig.auth.sessionExpiresIn || '12h';
            logger.info(`Redis handles expiration automatically (${sessionExpiresIn}), skipping manual cleanup`);
            return;
        }

        try {
            await db
                .delete(sessionsTable)
                .where(eq(sessionsTable.expiresAt, new Date()));

            logger.info(`Expired sessions cleaned from database`);
        } catch (error) {
            logger.error(`Failed to clean expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}