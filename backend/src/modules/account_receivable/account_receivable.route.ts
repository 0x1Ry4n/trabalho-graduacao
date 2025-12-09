import { Router } from "express";
import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { accountReceivableRegistrationSchema, priceTableRegistrationSchema, priceTableUpdateSchema } from "./account_receivable.schema";
import Container from "typedi";
import AccountReceivableController from "./account_receivable.controller";

const accountReceivableRoutes = Router();
const accountReceivableController = Container.get(AccountReceivableController);

// ─── Price Tables ─────────────────────────
// Deve vir ANTES de /:id para não ser capturado como parâmetro

accountReceivableRoutes.post(
   '/accountReceivables/priceTables',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(priceTableRegistrationSchema, 'body'),
   accountReceivableController.createPriceTable.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/priceTables',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.listPriceTables.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/priceTables/type/:type',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.findPriceTableByType.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/priceTables/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.findPriceTableById.bind(accountReceivableController)
);

accountReceivableRoutes.patch(
   '/accountReceivables/priceTables/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(priceTableUpdateSchema, 'body'),
   accountReceivableController.updatePriceTable.bind(accountReceivableController)
);

accountReceivableRoutes.patch(
   '/accountReceivables/priceTables/:id/activate',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   accountReceivableController.activatePriceTable.bind(accountReceivableController)
);

accountReceivableRoutes.patch(
   '/accountReceivables/priceTables/:id/inactivate',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   accountReceivableController.inactivatePriceTable.bind(accountReceivableController)
);

// ─── Accounts Receivable ─────────────────────────

accountReceivableRoutes.post(
   '/accountReceivables',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN),
   SchemaValidatorMiddleware(accountReceivableRegistrationSchema, 'body'),
   accountReceivableController.create.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.list.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/paginated',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.listWithFiltersPaginated.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER),
   accountReceivableController.findById.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/userId/:userId',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   accountReceivableController.findByUserId.bind(accountReceivableController)
);

accountReceivableRoutes.get(
   '/accountReceivables/enrollmentId/:enrollmentId',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   accountReceivableController.findByEnrollmentId.bind(accountReceivableController)
);

accountReceivableRoutes.patch(
   '/accountReceivables/:id',
   AuthMiddleware,
   AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
   accountReceivableController.update.bind(accountReceivableController)
);

export default accountReceivableRoutes;
