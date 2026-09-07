import { eq, lt } from "drizzle-orm";
import { Service, Inject } from "typedi";
import { db } from "../../../config/db/db.config";
import { sessionsTable } from "../../../config/db/db.schema";
import { Session } from "../interfaces/Session";
import { envConfig } from "../../../config/env/env.config";
import { ISessionRepository } from "./ISessionRepository";
import { logger } from "../../../shared/utils/logger.utils";
import CacheService from "../../../shared/services/cache.service";
import { UserSession } from "../session.types";

/**
 * Forma serializada da sessão no cache.
 *
 * `expiresAt` viaja como string ISO porque o CacheService faz JSON.stringify —
 * um `Date` voltaria como string e quebraria silenciosamente as comparações de
 * validade. A conversão acontece de volta em `reviveSession`.
 */
interface CachedSession {
    id: string;
    userId: number;
    refreshToken: string;
    expiresAt: string;
}

/**
 * Repositório de sessões.
 *
 * Contrato de resiliência: **o PostgreSQL é a fonte da verdade e o Redis é
 * apenas um acelerador de leitura.**
 *
 * - Toda escrita vai para o banco de forma síncrona. Se o banco falhar, o erro
 *   sobe — a sessão não pode ser dada como persistida.
 * - Toda escrita no cache é best-effort. Falha em cache nunca falha a operação.
 * - Toda leitura com cache indisponível, cache miss ou dado inválido cai no
 *   banco. Não existe caminho de leitura que dependa do Redis estar de pé.
 *
 * `SESSION_STORAGE_METHOD` seleciona se o cache é usado (`redis`) ou não
 * (`database`); em ambos os modos o banco é escrito e consultado.
 */
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

    /** O cache só é consultado/populado quando habilitado E conectado. */
    private isCacheEnabled(): boolean {
        return (
            envConfig.auth.sessionStorageMethod === 'redis' &&
            this.cacheService.isAvailable()
        );
    }

    private sessionKey(refreshToken: string): string {
        return this.cacheService.generateKey(this.CACHE_PREFIX.SESSION, refreshToken);
    }

    private userSessionKey(userId: number): string {
        return this.cacheService.generateKey(this.CACHE_PREFIX.USER_SESSION, userId);
    }

    /** TTL derivado da validade real da sessão, nunca da configuração global. */
    private ttlFor(expiresAt: Date): number {
        return Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    }

    private reviveSession(cached: CachedSession | null): Session | null {
        if (!cached || typeof cached.userId !== 'number' || !cached.refreshToken) {
            return null;
        }

        const expiresAt = new Date(cached.expiresAt);

        if (Number.isNaN(expiresAt.getTime())) {
            return null;
        }

        return {
            id: cached.id,
            userId: cached.userId,
            refreshToken: cached.refreshToken,
            expiresAt,
        };
    }

    /**
     * Popula o cache. Best-effort por definição: qualquer falha é engolida,
     * porque o dado já está seguro no banco.
     */
    private async populateCache(session: Session): Promise<void> {
        if (!this.isCacheEnabled()) return;

        const ttl = this.ttlFor(session.expiresAt);

        if (ttl <= 0) return;

        const payload: CachedSession = {
            id: session.id,
            userId: session.userId,
            refreshToken: session.refreshToken,
            expiresAt: session.expiresAt.toISOString(),
        };

        try {
            await Promise.all([
                this.cacheService.set(this.sessionKey(session.refreshToken), payload, ttl),
                this.cacheService.set(this.userSessionKey(session.userId), payload, ttl),
            ]);
        } catch (error) {
            logger.debug(`Cache populate skipped: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /** Invalida as duas chaves de uma sessão. Best-effort. */
    private async evictCache(userId?: number, refreshToken?: string): Promise<void> {
        if (!this.isCacheEnabled()) return;

        const keys: string[] = [];

        if (refreshToken) keys.push(this.sessionKey(refreshToken));
        if (typeof userId === 'number') keys.push(this.userSessionKey(userId));

        if (keys.length === 0) return;

        try {
            await Promise.all(keys.map((key) => this.cacheService.delete(key)));
        } catch (error) {
            logger.debug(`Cache evict skipped: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /** Lê do cache sem nunca lançar: um erro aqui equivale a um miss. */
    private async readCache(key: string): Promise<Session | null> {
        if (!this.isCacheEnabled()) return null;

        try {
            return this.reviveSession(await this.cacheService.get<CachedSession>(key));
        } catch (error) {
            logger.debug(`Cache read failed, falling back to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    async store(session: UserSession): Promise<void> {
        // Upsert: `userId` é unique na tabela. Faz a escrita idempotente e
        // elimina a corrida entre o findByUserId e o insert do createOrUpdate.
        try {
            const [stored] = await db
                .insert(sessionsTable)
                .values({
                    userId: session.userId,
                    refreshToken: session.refreshToken,
                    expiresAt: session.expiresAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: sessionsTable.userId,
                    set: {
                        refreshToken: session.refreshToken,
                        expiresAt: session.expiresAt,
                        updatedAt: new Date(),
                    },
                })
                .returning();

            logger.info(`Session stored in database for userId: ${session.userId}`);

            if (stored) {
                await this.populateCache(stored);
            }
        } catch (error) {
            logger.error(`Failed to store session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async update(userId: number, session: UserSession): Promise<void> {
        // O refresh token antigo precisa sair do cache antes da troca, senão a
        // chave `session:<token_antigo>` sobrevive até o TTL e continua
        // autenticando um token que já foi rotacionado.
        const previous = await this.readCache(this.userSessionKey(userId));

        try {
            const [updated] = await db
                .update(sessionsTable)
                .set({
                    refreshToken: session.refreshToken,
                    expiresAt: session.expiresAt,
                    updatedAt: new Date(),
                })
                .where(eq(sessionsTable.userId, userId))
                .returning();

            logger.info(`Session updated in database for userId: ${userId}`);

            await this.evictCache(userId, previous?.refreshToken);

            if (updated) {
                await this.populateCache(updated);
            }
        } catch (error) {
            logger.error(`Failed to update session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async findByUserId(userId: number): Promise<Session | null> {
        const cached = await this.readCache(this.userSessionKey(userId));

        if (cached && cached.userId === userId) {
            logger.debug(`Session found in cache for userId: ${userId}`);
            return cached;
        }

        try {
            const [session] = await db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.userId, userId))
                .limit(1);

            if (!session) {
                logger.debug(`Session not found for userId: ${userId}`);
                return null;
            }

            logger.debug(`Session found in database for userId: ${userId}`);
            await this.populateCache(session);

            return session;
        } catch (error) {
            logger.error(`Failed to find session in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async findByRefreshToken(refreshToken: string): Promise<Session | null> {
        const cached = await this.readCache(this.sessionKey(refreshToken));

        if (cached && cached.refreshToken === refreshToken) {
            logger.debug(`Session found in cache for userId: ${cached.userId}`);
            return cached;
        }

        try {
            const [session] = await db
                .select()
                .from(sessionsTable)
                .where(eq(sessionsTable.refreshToken, refreshToken))
                .limit(1);

            if (!session) {
                logger.debug(`Session not found for refreshToken`);
                return null;
            }

            logger.debug(`Session found in database`);
            await this.populateCache(session);

            return session;
        } catch (error) {
            logger.error(`Failed to find session by refreshToken in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async removeByRefreshToken(refreshToken: string): Promise<void> {
        try {
            const [removed] = await db
                .delete(sessionsTable)
                .where(eq(sessionsTable.refreshToken, refreshToken))
                .returning();

            logger.info(`Session removed from database`);

            await this.evictCache(removed?.userId, refreshToken);
        } catch (error) {
            logger.error(`Failed to remove session from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    async removeAllByUserId(userId: number): Promise<void> {
        try {
            const removed = await db
                .delete(sessionsTable)
                .where(eq(sessionsTable.userId, userId))
                .returning();

            logger.info(`All sessions removed from database for userId: ${userId}`);

            await Promise.all(
                removed.map((session) => this.evictCache(userId, session.refreshToken))
            );

            // Cobre o caso de o banco não ter linha mas o cache ainda ter a chave.
            await this.evictCache(userId);
        } catch (error) {
            logger.error(`Failed to remove all sessions from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Invalidação em massa por padrão de chave — operação exclusiva de cache
     * (o Postgres não tem semântica de glob sobre chaves). Com o cache fora,
     * vira no-op: as sessões no banco seguem válidas até expirarem.
     */
    async removeByPattern(pattern: string): Promise<void> {
        if (!this.isCacheEnabled()) {
            logger.debug(`Cache unavailable, skipping pattern removal: ${pattern}`);
            return;
        }

        try {
            await this.cacheService.deletePattern(this.cacheService.generateKey(pattern));
            logger.info(`Sessions removed from cache by pattern: ${pattern}`);
        } catch (error) {
            logger.error(`Failed to remove sessions by pattern from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Limpeza de sessões expiradas.
     *
     * Roda sempre contra o banco, inclusive em modo `redis`: o TTL do Redis
     * expira a chave do cache, nunca a linha do Postgres. A versão anterior
     * usava `eq(expiresAt, new Date())` — igualdade com o instante exato da
     * chamada, que praticamente nunca casa e deixava as linhas acumulando.
     */
    async cleanExpiredSessions(): Promise<void> {
        try {
            const removed = await db
                .delete(sessionsTable)
                .where(lt(sessionsTable.expiresAt, new Date()))
                .returning();

            logger.info(`Expired sessions cleaned from database: ${removed.length}`);

            await Promise.all(
                removed.map((session) => this.evictCache(session.userId, session.refreshToken))
            );
        } catch (error) {
            logger.error(`Failed to clean expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
