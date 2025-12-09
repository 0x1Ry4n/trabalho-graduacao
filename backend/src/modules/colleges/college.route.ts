import { Router } from "express";
import { collegeRegistrationSchema, collegeUpdateSchema } from "./college.schema";
import { AuthMiddleware, AuthorizeRolesMiddleware, SchemaValidatorMiddleware } from '../../shared/middlewares/index.middleware';
import { UserRole } from "../../shared/enums/user-role.enum";
import CollegeController from "./college.controller";
import Container from "typedi";

const collegeRoutes = Router();
const collegeController = Container.get(CollegeController);

collegeRoutes.post(
   '/colleges',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(collegeRegistrationSchema, 'body'),
   collegeController.create.bind(collegeController)
);

collegeRoutes.patch(
   '/colleges/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(collegeUpdateSchema, 'body'),
   collegeController.update.bind(collegeController)
);

collegeRoutes.get(
   '/colleges',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   collegeController.list.bind(collegeController)
);

collegeRoutes.get(
   '/colleges/paginated',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   collegeController.listWithFiltersPaginated.bind(collegeController)
);

collegeRoutes.get(
   '/colleges/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   collegeController.findById.bind(collegeController)
);

collegeRoutes.patch(
   '/colleges/:id/activate',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   collegeController.activate.bind(collegeController)
);

collegeRoutes.patch(
   '/colleges/:id/inactivate',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   collegeController.inactivate.bind(collegeController)
);

export default collegeRoutes;
