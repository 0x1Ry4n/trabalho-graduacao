import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { vehicleRegistrationSchema, vehicleUpdateSchema } from "./vehicle.schema";
import { Router } from "express";
import VehicleController from "./vehicle.controller";
import Container from "typedi";

const vehicleRoutes = Router();
const vehicleController = Container.get(VehicleController);

vehicleRoutes.post(
   '/vehicles',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(vehicleRegistrationSchema, 'body'),
   vehicleController.create.bind(vehicleController)
);

vehicleRoutes.get(
   '/vehicles',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   vehicleController.list.bind(vehicleController)
);

vehicleRoutes.get(
   '/vehicles/paginated',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.STUDENT, UserRole.STUDENT),
   vehicleController.listWithFiltersPaginated.bind(vehicleController)
);

vehicleRoutes.get(
   '/vehicles/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   vehicleController.findById.bind(vehicleController)
);

vehicleRoutes.patch(
   '/vehicles/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(vehicleUpdateSchema),
   vehicleController.update.bind(vehicleController)
);

vehicleRoutes.delete(
   '/vehicles/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   vehicleController.delete.bind(vehicleController)
);

export default vehicleRoutes;
