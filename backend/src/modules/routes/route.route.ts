import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { routeRegistrationSchema, routeUpdateSchema, addStopToRouteSchema, updateStopOrderSchema } from "./route.schema";
import { Router } from "express";
import RouteController from "./route.controller";
import Container from "typedi";

const routeRoutes = Router();
const routeController = Container.get(RouteController);

routeRoutes.post(
    '/routes',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(routeRegistrationSchema, 'body'),
    routeController.create.bind(routeController)
);

routeRoutes.get(
    '/routes',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeController.list.bind(routeController)
);

routeRoutes.get(
    '/routes/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeController.listWithFiltersPaginated.bind(routeController)
);

routeRoutes.get(
    '/routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeController.findById.bind(routeController)
);

routeRoutes.patch(
    '/routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(routeUpdateSchema, 'body'),
    routeController.update.bind(routeController)
);

routeRoutes.patch(
    '/routes/:id/activate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    routeController.activate.bind(routeController)
);

routeRoutes.patch(
    '/routes/:id/inactivate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    routeController.inactivate.bind(routeController)
);

routeRoutes.delete(
    '/routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    routeController.delete.bind(routeController)
);

// Route Stops management
routeRoutes.get(
    '/routes/:id/stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    routeController.getStops.bind(routeController)
);

routeRoutes.post(
    '/routes/:id/stops',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(addStopToRouteSchema, 'body'),
    routeController.addStop.bind(routeController)
);

routeRoutes.delete(
    '/routes/:routeId/stops/:stopId',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    routeController.removeStop.bind(routeController)
);

routeRoutes.patch(
    '/routes/:routeId/stops/:stopId',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(updateStopOrderSchema, 'body'),
    routeController.updateStopOrder.bind(routeController)
);

export default routeRoutes;
