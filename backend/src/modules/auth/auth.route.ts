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

authRoutes.post(
   '/auth/refresh',
   AuthMiddleware,
   authController.refresh.bind(authController)
);

authRoutes.post(
   '/auth/logout',
   AuthMiddleware,
   authController.logout.bind(authController)
);

export default authRoutes;