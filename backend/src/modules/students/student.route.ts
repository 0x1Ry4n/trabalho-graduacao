import { Router } from "express";
import { cardValidationRegistrationSchema, studentRegistrationSchema, studentUpdateSchema } from "./student.schema";
import { AuthMiddleware, AuthorizeRolesMiddleware, SchemaValidatorMiddleware } from '../../shared/middlewares/index.middleware';
import { UserRole } from "../../shared/enums/user-role.enum";
import Container from "typedi";
import StudentController from "./student.controller";

const studentRoutes = Router();
const studentController = Container.get(StudentController);

studentRoutes.post(
  '/students',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  SchemaValidatorMiddleware(studentRegistrationSchema, 'body'),
  studentController.create.bind(studentController)
);

studentRoutes.post(
  '/students/:id/cardValidations',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  SchemaValidatorMiddleware(cardValidationRegistrationSchema, 'body'),
  studentController.createCardValidation.bind(studentController)
);

studentRoutes.get(
  '/students',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  studentController.list.bind(studentController)
);

studentRoutes.get(
  '/students/paginated',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  studentController.listWithFiltersPaginated.bind(studentController)
);

studentRoutes.get(
  '/students/:id/cardValidations/paginated',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  studentController.listCardValidationsByStudentIdPaginated.bind(studentController)
);

studentRoutes.get(
  '/students/:id',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
  studentController.findById.bind(studentController)
);

studentRoutes.get(
  '/students/:id/cardValidations',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
  studentController.listCardValidationsByStudentId.bind(studentController)
);

studentRoutes.get(
  '/students/userId/:userId',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
  studentController.findByUserId.bind(studentController)
);

studentRoutes.patch(
  '/students/:id',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  SchemaValidatorMiddleware(studentUpdateSchema, 'body'),
  studentController.update.bind(studentController)
);

studentRoutes.patch(
  '/students/:id/activate',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  studentController.activate.bind(studentController)
);

studentRoutes.patch(
  '/students/:id/inactivate',
  AuthMiddleware,
  AuthorizeRolesMiddleware(UserRole.ADMIN),
  studentController.inactivate.bind(studentController)
);

export default studentRoutes;