import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../enums/user-role.enum';
import { envConfig } from '../../config/env/env.config';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import SendResponse from '../utils/response.utils';

export const AuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = req.cookies?.accessToken;
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined;
    const token = cookieToken ?? bearerToken;

    if (!token) {
        return SendResponse.unauthorized(res, 'Token de acesso não fornecido!');
    }

    try {
        const decoded = jwt.verify(
            token,
            envConfig.auth.jwtSecret,
        ) as any;

        req.user = {
            id: Number(decoded.sub),
            role: decoded.role,
        };

        return next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            return SendResponse.unauthorized(res, 'Token de acesso expirado!')
        }

        return SendResponse.unauthorized(res, 'Token de acesso inválido!')
    }
};

export const AuthorizeRolesMiddleware = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return SendResponse.unauthorized(res, 'Usuário não autenticado!');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return SendResponse.forbidden(res, 'Acesso ao recurso negado!')
        }

        next();
    };
};

