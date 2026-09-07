import { Router } from "express";
import { SchemaValidatorMiddleware, AuthMiddleware } from '../../shared/middlewares/index.middleware';
import { userLoginSchema } from "./auth.schema";
import Container from "typedi";
import AuthController from "./auth.controller";

const authRoutes = Router();
const authController = Container.get(AuthController);

authRoutes.post(
   '/auth/login',
   SchemaValidatorMiddleware(userLoginSchema, 'body'),
   authController.login.bind(authController)
);

// Sem AuthMiddleware por design: o refresh e autenticado pelo proprio refresh
// token (verificado no AuthService e validado contra o session store). Exigir um
// access token valido aqui tornaria a rota inutil, ja que ela so e chamada
// quando o access token expirou.
authRoutes.post(
   '/auth/refresh',
   authController.refresh.bind(authController)
);

authRoutes.post(
   '/auth/logout',
   AuthMiddleware,
   authController.logout.bind(authController)
);

export default authRoutes;