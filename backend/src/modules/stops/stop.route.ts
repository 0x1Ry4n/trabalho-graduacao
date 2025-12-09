import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { stopRegistrationSchema, stopUpdateSchema } from "./stop.schema";
import { Router } from "express";
import StopController from "./stop.controller";
import Container from "typedi";

const stopRoutes = Router();
const stopController = Container.get(StopController);

stopRoutes.post(
    '/stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(stopRegistrationSchema, 'body'),
    stopController.create.bind(stopController)
);

stopRoutes.get(
    '/stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    stopController.list.bind(stopController)
);

stopRoutes.get(
    '/stops/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    stopController.listWithFiltersPaginated.bind(stopController)
);

stopRoutes.get(
    '/stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    stopController.findById.bind(stopController)
);

stopRoutes.patch(
    '/stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(stopUpdateSchema, 'body'),
    stopController.update.bind(stopController)
);

stopRoutes.delete(
    '/stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    stopController.delete.bind(stopController)
);

export default stopRoutes;
