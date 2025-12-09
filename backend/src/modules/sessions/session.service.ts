import { Inject, Service } from "typedi";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/errors/error";
import { UserSession } from "./session.types";
import SessionRepository from "./repository/session.repository";

@Service()
export default class SessionService {
    constructor(
        @Inject(() => SessionRepository)
        private readonly sessionRepository: SessionRepository
    ) { }

    async createOrUpdate(session: UserSession): Promise<void> {
        try {
            const sessionExists = await this.sessionRepository.findByUserId(
                session.userId
            );

            if (!sessionExists) {
                await this.sessionRepository.store(session);
            } else {
                await this.sessionRepository.update(session.userId, session);
            }
        } catch (error) {
            throw new ApiError(
                `Erro ao persistir sessão: ${error}`,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async validateRefreshToken(
        userId: number,
        refreshToken: string
    ): Promise<void> {
        try {
            const session =
                await this.sessionRepository.findByRefreshToken(refreshToken);

            if (!session || session.userId !== userId) {
                throw new ApiError(
                    "Refresh token inválido",
                    StatusCodes.UNAUTHORIZED
                );
            }

            if (session.expiresAt && session.expiresAt < new Date()) {
                await this.sessionRepository.removeByRefreshToken(refreshToken);

                throw new ApiError(
                    "Refresh token expirado",
                    StatusCodes.UNAUTHORIZED
                );
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(
                `Erro ao validar refresh token: ${error}`,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async remove(refreshToken: string): Promise<void> {
        try {
            await this.sessionRepository.removeByRefreshToken(refreshToken);
        } catch (error) {
            throw new ApiError(
                `Erro ao remover sessão: ${error}`,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
}
