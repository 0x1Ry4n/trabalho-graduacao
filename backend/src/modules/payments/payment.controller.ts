import { Inject, Service } from "typedi";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import SendResponse from "../../shared/utils/response.utils";
import { ApiError } from "../../shared/errors/error";
import { logger } from "../../shared/utils/logger.utils";
import PaymentService from "./payment.service";
import { CreateChargeInput } from "./payment.schema";
import {
    verifyWebhookSecret,
    verifyWebhookSignature,
} from "../../shared/services/abacatepay/abacatepay.signature";

@Service()
export default class PaymentController {
    constructor(
        @Inject(() => PaymentService)
        private readonly paymentService: PaymentService
    ) { }

    async createCharge(req: Request, res: Response) {
        const accountReceivableId = Number(req.params.accountReceivableId);

        if (!Number.isInteger(accountReceivableId) || accountReceivableId <= 0) {
            return SendResponse.badRequest(res, undefined, "Cobranca invalida");
        }

        if (!req.user) {
            throw new ApiError("Nao autenticado!", StatusCodes.UNAUTHORIZED);
        }

        const { method } = req.body as CreateChargeInput;

        const charge = await this.paymentService.createCharge(
            accountReceivableId,
            method,
            req.user
        );

        return SendResponse.created(res, charge);
    }

    async getChargeStatus(req: Request, res: Response) {
        const chargeId = Number(req.params.chargeId);

        if (!Number.isInteger(chargeId) || chargeId <= 0) {
            return SendResponse.badRequest(res, undefined, "Cobranca invalida");
        }

        if (!req.user) {
            throw new ApiError("Nao autenticado!", StatusCodes.UNAUTHORIZED);
        }

        const charge = await this.paymentService.getChargeStatus(chargeId, req.user);

        return SendResponse.success(res, charge);
    }

    /**
     * Recebe eventos da AbacatePay.
     *
     * Rota publica — nao passa pelo `AuthMiddleware`, porque quem chama e o
     * gateway, nao um usuario. A autenticacao aqui sao as duas verificacoes
     * abaixo, e ambas acontecem antes de qualquer leitura do corpo.
     *
     * Erros de processamento sao registrados mas respondidos com 200: devolver
     * 5xx faria o gateway reenviar indefinidamente um evento que nunca vai ser
     * aceito. Falhas de autenticacao, essas sim, respondem 401.
     */
    async handleAbacatePayWebhook(req: Request, res: Response) {
        if (!verifyWebhookSecret(req.query.webhookSecret)) {
            logger.warn("[Payments] Webhook rejected: invalid secret");
            return SendResponse.unauthorized(res);
        }

        const signature = req.header("x-webhook-signature");

        if (!req.rawBody || !verifyWebhookSignature(req.rawBody, signature)) {
            logger.warn("[Payments] Webhook rejected: invalid signature");
            return SendResponse.unauthorized(res);
        }

        try {
            await this.paymentService.handleWebhookEvent(req.body);
        } catch (error) {
            logger.error(`[Payments] Webhook processing failed: ${error}`);
        }

        return SendResponse.success(res, { received: true });
    }
}
