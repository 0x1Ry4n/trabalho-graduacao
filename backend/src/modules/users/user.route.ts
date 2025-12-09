import { Router } from "express";
import { userListPaginatedSchema, userRegistrationSchema, userUpdateSchema } from "./user.schema";
import { AuthMiddleware, AuthorizeRolesMiddleware, SchemaValidatorMiddleware } from '../../shared/middlewares/index.middleware';
import { UserRole } from "../../shared/enums/user-role.enum";
import Container from "typedi";
import UserController from "./user.controller";

const userRoutes = Router();
const userController = Container.get(UserController);

userRoutes.post(
    '/users',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(userRegistrationSchema, "body"),
    userController.create.bind(userController)
);

userRoutes.get(
    '/users',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    userController.list.bind(userController)
);


userRoutes.get(
    '/users/me',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    userController.getMe.bind(userController)
);

userRoutes.get(
    '/users/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(userListPaginatedSchema, "query"),
    userController.listWithFiltersPaginated.bind(userController)
);

userRoutes.get(
    '/users/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    userController.findById.bind(userController)
);

userRoutes.patch(
    '/users/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    SchemaValidatorMiddleware(userUpdateSchema, 'body'),
    userController.update.bind(userController)
);

userRoutes.patch(
    '/users/:id/inactivate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    userController.inactivate.bind(userController)
);

userRoutes.patch(
    '/users/:id/activate',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    userController.activate.bind(userController)
);


export default userRoutes;