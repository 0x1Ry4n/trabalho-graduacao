import { Router } from "express";
import { driverRegistrationSchema, driverUpdateSchema } from "./driver.schema";
import { AuthMiddleware, AuthorizeRolesMiddleware, SchemaValidatorMiddleware } from '../../shared/middlewares/index.middleware';
import { UserRole } from "../../shared/enums/user-role.enum";
import Container from "typedi";
import DriverController from "./driver.controller";

const driverRoutes = Router();
const driverController = Container.get(DriverController);

driverRoutes.post(
  '/drivers',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  SchemaValidatorMiddleware(driverRegistrationSchema, 'body'),
  driverController.create.bind(driverController)
);

driverRoutes.get(
  '/drivers',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  driverController.list.bind(driverController)
);

driverRoutes.get(
  '/drivers/paginated',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  driverController.listWithFiltersPaginated.bind(driverController)
);

driverRoutes.get(
  '/drivers/userId/:userId',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  driverController.findByUserId.bind(driverController)
);

driverRoutes.get(
  '/drivers/:id',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  driverController.findById.bind(driverController)
);

driverRoutes.patch(
  '/drivers/:id',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  SchemaValidatorMiddleware(driverUpdateSchema, 'body'),
  driverController.update.bind(driverController)
);

driverRoutes.patch(
  '/drivers/:id/activate',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  driverController.activate.bind(driverController)
);

driverRoutes.patch(
  '/drivers/:id/inactivate',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  driverController.inactivate.bind(driverController)
);

export default driverRoutes;
