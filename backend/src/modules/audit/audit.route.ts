import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { Router } from "express";
import AuditController from "./audit.controller";
import Container from "typedi";

const auditRoutes = Router();
const auditController = Container.get(AuditController);

auditRoutes.get(
    '/audit-logs/paginated',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    auditController.listWithFiltersPaginated.bind(auditController)
);

auditRoutes.get(
    '/audit-logs/:id',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    auditController.findById.bind(auditController)
);

auditRoutes.get(
    '/audit-logs/:entityType/:entityId',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN),
    auditController.listByEntity.bind(auditController)
);

export default auditRoutes;
