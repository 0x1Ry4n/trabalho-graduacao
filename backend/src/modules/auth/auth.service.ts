import { Inject, Service } from "typedi";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/errors/error";
import { compareHash } from "../../shared/utils/hash.utils";
import { hoursFromNow } from "../../shared/utils/date.utils";
import { envConfig } from "../../config/env/env.config";
import { LoginUserDTO } from "./dto/index.dto";
import { UserWithoutPassword } from "../users/interfaces/UserWithoutPassword";
import jwt from "jsonwebtoken";
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
    userId: number;
    refreshToken: string;
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

    async refresh(payload: RefreshTokenPayload): Promise<{
        accessToken: string;
        user: UserResponse;
    }> {
        await this.sessionService.validateRefreshToken(
            payload.userId,
            payload.refreshToken
        );

        const user = await this.userRepository.findById(payload.userId);

        if (!user) {
            throw new ApiError("Usuário não encontrado", StatusCodes.UNAUTHORIZED);
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