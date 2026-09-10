import { Router } from "express";
import Container from "typedi";
import { AuthMiddleware, AuthorizeRolesMiddleware } from "../../shared/middlewares/auth.middleware";
import { SchemaValidatorMiddleware } from "../../shared/middlewares/validator.middleware";
import { UserRole } from "../../shared/enums/user-role.enum";
import { createChargeSchema } from "./payment.schema";
import PaymentController from "./payment.controller";

const paymentRoutes = Router();
const paymentController = Container.get(PaymentController);

/**
 * Webhook da AbacatePay.
 *
 * Sem `AuthMiddleware` de proposito: quem chama e o gateway. A autenticacao e
 * feita no controller pelo `webhookSecret` da query somado a assinatura HMAC do
 * corpo. Declarada antes das demais para nao competir com nenhuma rota
 * parametrizada.
 */
paymentRoutes.post(
    '/webhooks/abacatepay',
    paymentController.handleAbacatePayWebhook.bind(paymentController)
);

/**
 * Abre uma cobranca para uma conta a receber.
 *
 * O aluno so consegue abrir para as proprias contas; a checagem de posse esta
 * no service, porque depende de resolver pagador -> aluno -> usuario.
 */
paymentRoutes.post(
    '/accountReceivables/:accountReceivableId/charges',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    SchemaValidatorMiddleware(createChargeSchema, 'body'),
    paymentController.createCharge.bind(paymentController)
);

paymentRoutes.get(
    '/charges/:chargeId/status',
    AuthMiddleware,
    AuthorizeRolesMiddleware(UserRole.ADMIN, UserRole.DRIVER, UserRole.STUDENT),
    paymentController.getChargeStatus.bind(paymentController)
);

export default paymentRoutes;
