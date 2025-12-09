import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { studentRouteRegistrationSchema, studentRouteUpdateSchema } from "./student-route.schema";
import { Router } from "express";
import StudentRouteController from "./student-route.controller";
import Container from "typedi";

const studentRouteRoutes = Router();
const studentRouteController = Container.get(StudentRouteController);

studentRouteRoutes.post(
    '/student-routes',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.STUDENT),
    SchemaValidatorMiddleware(studentRouteRegistrationSchema, 'body'),
    studentRouteController.create.bind(studentRouteController)
);

studentRouteRoutes.get(
    '/student-routes/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
    studentRouteController.listWithFiltersPaginated.bind(studentRouteController)
);

studentRouteRoutes.get(
    '/students/:studentId/routes',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    studentRouteController.listByStudent.bind(studentRouteController)
);

studentRouteRoutes.get(
    '/routes/:routeId/students',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
    studentRouteController.listByRoute.bind(studentRouteController)
);

studentRouteRoutes.get(
    '/student-routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    studentRouteController.findById.bind(studentRouteController)
);

studentRouteRoutes.patch(
    '/student-routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.STUDENT),
    SchemaValidatorMiddleware(studentRouteUpdateSchema, 'body'),
    studentRouteController.update.bind(studentRouteController)
);

studentRouteRoutes.patch(
    '/student-routes/:id/activate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    studentRouteController.activate.bind(studentRouteController)
);

studentRouteRoutes.patch(
    '/student-routes/:id/inactivate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    studentRouteController.inactivate.bind(studentRouteController)
);

studentRouteRoutes.delete(
    '/student-routes/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    studentRouteController.delete.bind(studentRouteController)
);

export default studentRouteRoutes;
