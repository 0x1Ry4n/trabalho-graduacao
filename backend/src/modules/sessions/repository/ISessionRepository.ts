import { UserSession as UserSessionDTO } from "../session.types";
import { Session } from "../interfaces/Session";

export interface ISessionRepository {
    store(session: UserSessionDTO): Promise<void>;
    update(userId: number, session: UserSessionDTO): Promise<void>;
    findByUserId(userId: number): Promise<Session | null>;
    findByRefreshToken(refreshToken: string): Promise<Session | null>;
    removeByRefreshToken(refreshToken: string): Promise<void>;
    removeAllByUserId(userId: number): Promise<void>;
    removeByPattern(pattern: string): Promise<void>;
    cleanExpiredSessions(): Promise<void>;
}