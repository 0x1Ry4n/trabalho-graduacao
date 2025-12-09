import { Request, Response } from "express";
import { Service, Inject } from "typedi";
import { CookieOptions } from "express";
import { envConfig } from "../../config/env/env.config";
import AuthService from "./auth.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class AuthController {
    constructor(
        @Inject(() => AuthService)
        private readonly authService: AuthService
    ) { }


    async login(req: Request, res: Response): Promise<Response> {
        const result = await this.authService.login(req.body);
        this.setAuthCookies(res, result.accessToken, result.refreshToken);
        return SendResponse.success(res, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        }, "Login realizado com sucesso");
    }


    async refresh(req: Request, res: Response): Promise<Response> {
        // Aceita refresh token via cookie (web) ou body (mobile)
        const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

        if (!refreshToken) {
            return SendResponse.unauthorized(res, "Refresh token não fornecido");
        }

        const result = await this.authService.refresh({
            refreshToken,
            userId: req.user!.id,
        });

        this.setAccessCookie(res, result.accessToken);
        return SendResponse.success(res, { user: result.user }, "Token atualizado com sucesso");
    }


    async logout(req: Request, res: Response): Promise<Response> {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }

        this.clearAuthCookies(res);
        return SendResponse.success(res, null, "Logout realizado com sucesso");
    }

    private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
        this.setAccessCookie(res, accessToken);
        res.cookie("refreshToken", refreshToken, this.getRefreshCookieOptions());
    }

    private setAccessCookie(res: Response, token: string): void {
        res.cookie("accessToken", token, this.getAccessCookieOptions());
    }

    private clearAuthCookies(res: Response): void {
        res.clearCookie("accessToken", this.getAccessCookieOptions());
        res.clearCookie("refreshToken", this.getRefreshCookieOptions());
    }

    private getAccessCookieOptions(): CookieOptions {
        const cookieHours = parseInt(String(envConfig.auth.cookieExpiresIn).replace(/h/gi, '')) || 12;
        return {
            httpOnly: true,
            secure: envConfig.server.nodeEnv === "production",
            sameSite: "strict",
            maxAge: cookieHours * 60 * 60 * 1000,
            path: "/",
        };
    }

    private getRefreshCookieOptions(): CookieOptions {
        const sessionHours = parseInt(String(envConfig.auth.sessionExpiresIn).replace(/h/gi, '')) || 24;
        return {
            httpOnly: true,
            secure: envConfig.server.nodeEnv === "production",
            sameSite: "strict",
            maxAge: sessionHours * 60 * 60 * 1000,
            path: "/",
        };
    }
}