import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { routeStopRegistrationSchema, routeStopUpdateSchema } from "./route-stop.schema";
import { Router } from "express";
import RouteStopController from "./route-stop.controller";
import Container from "typedi";

const routeStopRoutes = Router();
const routeStopController = Container.get(RouteStopController);

routeStopRoutes.post(
    '/route-stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(routeStopRegistrationSchema, 'body'),
    routeStopController.create.bind(routeStopController)
);

routeStopRoutes.get(
    '/route-stops/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeStopController.listWithFiltersPaginated.bind(routeStopController)
);

routeStopRoutes.get(
    '/routes/:routeId/stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeStopController.listByRoute.bind(routeStopController)
);

routeStopRoutes.get(
    '/route-stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeStopController.findById.bind(routeStopController)
);

routeStopRoutes.patch(
    '/route-stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(routeStopUpdateSchema, 'body'),
    routeStopController.update.bind(routeStopController)
);

routeStopRoutes.delete(
    '/route-stops/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    routeStopController.delete.bind(routeStopController)
);

export default routeStopRoutes;
