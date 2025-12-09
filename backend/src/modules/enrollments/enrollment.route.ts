import { Router } from "express";
import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { enrollmentRegistrationSchema } from "./enrollment.schema";
import Container from "typedi";
import EnrollmentController from "./enrollment.controller";

const enrollmentRoutes = Router();
const enrollmentController = Container.get(EnrollmentController);

enrollmentRoutes.post(
   '/enrollments',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(enrollmentRegistrationSchema, 'body'),
   enrollmentController.create.bind(enrollmentController)
);

enrollmentRoutes.get(
   '/enrollments',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   enrollmentController.list.bind(enrollmentController)
);

enrollmentRoutes.get(
   '/enrollments/paginated',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   enrollmentController.listWithFiltersPaginated.bind(enrollmentController)
);

enrollmentRoutes.get(
   '/enrollments/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   enrollmentController.findById.bind(enrollmentController)
);

enrollmentRoutes.get(
   '/enrollments/studentId/:studentId',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   enrollmentController.findByStudentId.bind(enrollmentController)
);

enrollmentRoutes.patch(
   '/enrollments/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   enrollmentController.update.bind(enrollmentController)
);


export default enrollmentRoutes;
