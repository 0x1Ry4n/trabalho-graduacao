import { Inject, Service } from "typedi";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/errors/error";
import { compareHash } from "../../shared/utils/hash.utils";
import { hoursFromNow } from "../../shared/utils/date.utils";
import { envConfig } from "../../config/env/env.config";
import { LoginUserDTO } from "./dto/index.dto";
import { UserWithoutPassword } from "../users/interfaces/UserWithoutPassword";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import SessionService from "../sessions/session.service";
import UserRepository from "../users/repository/user.repository";

interface TokenPair {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        username: string;
        role: string;
    };
}

interface RefreshTokenPayload {
    refreshToken: string;
}

interface RefreshTokenClaims {
    sub: string | number;
    role: string;
}

interface UserResponse {
    id: number;
    username: string;
    email: string;
}

@Service()
export default class AuthService {
    constructor(
        @Inject(() => UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(() => SessionService)
        private readonly sessionService: SessionService
    ) { }

    async login(data: LoginUserDTO): Promise<TokenPair> {
        const user = await this.userRepository.findByEmail(data.email);

        if (!user?.password) {
            throw new ApiError("Credenciais inválidas", StatusCodes.UNAUTHORIZED);
        }

        const passwordMatches = await compareHash(data.password, user.password);

        if (!passwordMatches) {
            throw new ApiError("Credenciais inválidas", StatusCodes.UNAUTHORIZED);
        }

        if (user.active !== 1) {
            throw new ApiError("O usuário foi inativado", StatusCodes.BAD_REQUEST)
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await this.sessionService.createOrUpdate({
            userId: user.id,
            refreshToken,
            expiresAt: hoursFromNow(envConfig.auth.sessionExpiresIn),
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    }

    /**
     * Renova o access token a partir do refresh token.
     *
     * A identidade do usuário é derivada do próprio refresh token — a rota NÃO
     * exige um access token válido, já que o motivo de existir do refresh é
     * justamente o access token ter expirado.
     */
    async refresh(payload: RefreshTokenPayload): Promise<{
        accessToken: string;
        user: UserResponse;
    }> {
        const userId = this.verifyRefreshToken(payload.refreshToken);

        await this.sessionService.validateRefreshToken(
            userId,
            payload.refreshToken
        );

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ApiError("Usuário não encontrado", StatusCodes.UNAUTHORIZED);
        }

        if (user.active !== 1) {
            throw new ApiError("O usuário foi inativado", StatusCodes.UNAUTHORIZED);
        }

        const accessToken = this.generateAccessToken(user);

        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    async logout(refreshToken: string): Promise<void> {
        await this.sessionService.remove(refreshToken);
    }

    private verifyRefreshToken(refreshToken: string): number {
        try {
            const decoded = jwt.verify(
                refreshToken,
                envConfig.auth.refreshJwtSecret
            ) as RefreshTokenClaims;

            const userId = Number(decoded.sub);

            if (!Number.isInteger(userId) || userId <= 0) {
                throw new ApiError(
                    "Refresh token inválido",
                    StatusCodes.UNAUTHORIZED
                );
            }

            return userId;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof TokenExpiredError) {
                throw new ApiError(
                    "Refresh token expirado",
                    StatusCodes.UNAUTHORIZED
                );
            }

            throw new ApiError("Refresh token inválido", StatusCodes.UNAUTHORIZED);
        }
    }

    private generateAccessToken(user: UserWithoutPassword): string {
        return jwt.sign(
            { sub: user.id, role: user.role },
            envConfig.auth.jwtSecret,
            envConfig.auth.jwtSignOptions
        );
    }

    private generateRefreshToken(user: UserWithoutPassword): string {
        return jwt.sign(
            { sub: user.id, role: user.role },
            envConfig.auth.refreshJwtSecret,
            envConfig.auth.refreshJwtSignOptios
        );
    }
}
