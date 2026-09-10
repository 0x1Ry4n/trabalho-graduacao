import { Inject, Service } from "typedi";
import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";
import { ApiError } from "../../shared/errors/error";
import { logger } from "../../shared/utils/logger.utils";
import { isValidCpf, onlyDigits } from "../../shared/utils/document.utils";
import { envConfig } from "../../config/env/env.config";
import { ChargeMethod } from "../../shared/enums/charge-method.enum";
import { ChargeStatus } from "../../shared/enums/charge-status.enum";
import { PaymentProvider } from "../../shared/enums/payment-provider.enum";
import { AccountStatus } from "../../shared/enums/account-status.enum";
import { PaymentType } from "../../shared/enums/payment-type.enum";
import { UserRole } from "../../shared/enums/user-role.enum";
import AbacatePayClient from "../../shared/services/abacatepay/abacatepay.client";
import { AbacateCustomer, NormalizedCharge } from "../../shared/services/abacatepay/abacatepay.types";
import AccountReceivableRepository from "../account_receivable/repository/account_receivable.repository";
import PayerRepository from "../payers/repository/payer.repository";
import StudentRepository from "../students/repository/student.repository";
import PaymentChargeRepository from "./repository/payment_charge.repository";
import { PaymentCharge } from "./interfaces/PaymentCharge";
import { NormalizedWebhookEvent, PaymentChargeView } from "./payment.types";

/** Status do gateway -> nosso ciclo de vida. */
const PROVIDER_STATUS_MAP: Record<string, ChargeStatus> = {
    PENDING: ChargeStatus.PENDING,
    PAID: ChargeStatus.PAID,
    APPROVED: ChargeStatus.PAID,
    REDEEMED: ChargeStatus.PAID,
    EXPIRED: ChargeStatus.EXPIRED,
    CANCELLED: ChargeStatus.CANCELLED,
    REFUNDED: ChargeStatus.REFUNDED,
    FAILED: ChargeStatus.FAILED,
    UNDER_DISPUTE: ChargeStatus.PENDING,
};

/** Como cada metodo de cobranca aparece no historico da conta a receber. */
const METHOD_TO_PAYMENT_TYPE: Record<ChargeMethod, PaymentType> = {
    [ChargeMethod.PIX]: PaymentType.PIX,
    [ChargeMethod.BOLETO]: PaymentType.BOLETO,
    [ChargeMethod.CARD]: PaymentType.CREDIT_CARD,
};

/** Intervalo minimo entre duas reconciliacoes da mesma cobranca. */
const RECONCILE_MIN_INTERVAL_MS = 10_000;

/** Prazo de vencimento do boleto, a partir de hoje, quando a conta ja venceu. */
const BOLETO_FALLBACK_DUE_DAYS = 3;

@Service()
export default class PaymentService {
    constructor(
        @Inject(() => PaymentChargeRepository)
        private readonly paymentChargeRepository: PaymentChargeRepository,
        @Inject(() => AccountReceivableRepository)
        private readonly accountReceivableRepository: AccountReceivableRepository,
        @Inject(() => PayerRepository)
        private readonly payerRepository: PayerRepository,
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => AbacatePayClient)
        private readonly abacatePayClient: AbacatePayClient
    ) { }

    // ─── Criacao de cobranca ─────────────────────────────────────────────────

    /**
     * Cria (ou reaproveita) uma cobranca para uma conta a receber.
     *
     * O valor **nao** vem da requisicao: e lido de `accounts_receivable.amount`.
     * Aceitar um valor do cliente permitiria a qualquer aluno autenticado pagar
     * R$ 0,01 numa mensalidade de R$ 250,00.
     */
    async createCharge(
        accountReceivableId: number,
        method: ChargeMethod,
        requester: { id: number; role: UserRole }
    ): Promise<PaymentChargeView> {
        const account = await this.accountReceivableRepository.findById(accountReceivableId);

        if (!account) {
            throw new ApiError("Cobranca nao encontrada!", StatusCodes.NOT_FOUND);
        }

        if (account.status !== AccountStatus.OPEN) {
            throw new ApiError(
                "Esta cobranca nao esta em aberto!",
                StatusCodes.CONFLICT
            );
        }

        const student = await this.resolvePayerStudent(account.payerId);
        await this.assertCanAccess(student.userId, requester);

        // Um Pix vigente e reaproveitado: emitir um segundo QR para a mesma
        // conta deixaria dois codigos validos em circulacao ao mesmo tempo.
        const existing = await this.paymentChargeRepository.findOpenByAccountAndMethod(
            accountReceivableId,
            method
        );

        if (existing) {
            if (!this.isExpired(existing)) {
                return this.toView(existing);
            }

            // Fecha a cobranca vencida antes de abrir outra. Sem isso ela ficaria
            // PENDING para sempre e `findOpenByAccountAndMethod` continuaria
            // encontrando cobrancas mortas a cada nova tentativa.
            await this.paymentChargeRepository.update(existing.id, {
                status: ChargeStatus.EXPIRED,
            });
        }

        const amountCents = this.toCents(account.amount);

        if (amountCents <= 0) {
            throw new ApiError("Valor da cobranca invalido!", StatusCodes.BAD_REQUEST);
        }

        const externalId = `ar-${accountReceivableId}-${nanoid(12)}`;
        const description = account.description?.trim()
            || `${account.accountReceivableType} - ${student.name}`;

        // O gateway recusa CPF invalido ou mascarado com `Invalid taxId`, o que
        // chega ao aluno como um 502 sem explicacao. Checar antes transforma um
        // erro de cadastro numa mensagem acionavel.
        if (!isValidCpf(student.cpf)) {
            logger.warn(
                `[Payments] Student ${student.id} has an invalid CPF; charge aborted`
            );
            throw new ApiError(
                "O CPF do cadastro e invalido. Atualize seus dados antes de gerar a cobranca.",
                StatusCodes.UNPROCESSABLE_ENTITY
            );
        }

        const customer: AbacateCustomer = {
            name: student.name,
            taxId: onlyDigits(student.cpf),
            email: student.email,
            cellphone: student.phone ? onlyDigits(student.phone) : undefined,
        };

        // A linha e gravada antes da chamada externa. Se o gateway responder e o
        // processo morrer em seguida, sobra uma cobranca PENDING sem
        // `providerChargeId` — inerte — em vez de um pagamento sem rastro.
        const charge = await this.paymentChargeRepository.create({
            accountReceivableId,
            provider: PaymentProvider.ABACATEPAY,
            externalId,
            method,
            amountCents,
        });

        let result: NormalizedCharge;

        try {
            result = await this.callGateway(method, {
                amountCents,
                description,
                externalId,
                customer,
                dueDate: this.boletoDueDate(account.dueDate),
            });
        } catch (error) {
            await this.paymentChargeRepository.update(charge.id, {
                status: ChargeStatus.FAILED,
            });
            throw error;
        }

        const updated = await this.paymentChargeRepository.update(charge.id, {
            providerChargeId: result.providerChargeId,
            brCode: result.brCode ?? null,
            barCode: result.barCode ?? null,
            paymentUrl: result.paymentUrl ?? null,
            expiresAt: result.expiresAt ?? null,
            status: this.mapStatus(result.rawStatus),
            lastCheckedAt: new Date(),
        });

        return this.toView(updated ?? charge);
    }

    private callGateway(
        method: ChargeMethod,
        input: {
            amountCents: number;
            description: string;
            externalId: string;
            customer: AbacateCustomer;
            dueDate: string;
        }
    ): Promise<NormalizedCharge> {
        switch (method) {
            case ChargeMethod.PIX:
                return this.abacatePayClient.createPixCharge({
                    amountCents: input.amountCents,
                    description: input.description,
                    externalId: input.externalId,
                    customer: input.customer,
                    expiresInMinutes: envConfig.abacatePay.pixExpiresInMinutes,
                });

            case ChargeMethod.BOLETO:
                return this.abacatePayClient.createBoletoCharge({
                    amountCents: input.amountCents,
                    description: input.description,
                    externalId: input.externalId,
                    customer: input.customer,
                    dueDate: input.dueDate,
                });

            case ChargeMethod.CARD:
                return this.abacatePayClient.createCardCheckout({
                    amountCents: input.amountCents,
                    description: input.description,
                    externalId: input.externalId,
                    customer: input.customer,
                    returnUrl: envConfig.abacatePay.returnUrl,
                    completionUrl: envConfig.abacatePay.completionUrl,
                });
        }
    }

    // ─── Consulta e reconciliacao ────────────────────────────────────────────

    /**
     * Status atual de uma cobranca.
     *
     * O caminho normal de confirmacao e o webhook. Esta consulta existe para o
     * app poder acompanhar o Pix na tela e para cobrir o caso em que o webhook
     * nao chega (endpoint indisponivel, ambiente de desenvolvimento sem URL
     * publica).
     */
    async getChargeStatus(
        chargeId: number,
        requester: { id: number; role: UserRole }
    ): Promise<PaymentChargeView> {
        const charge = await this.paymentChargeRepository.findById(chargeId);

        if (!charge) {
            throw new ApiError("Cobranca nao encontrada!", StatusCodes.NOT_FOUND);
        }

        const account = await this.accountReceivableRepository.findById(
            charge.accountReceivableId
        );

        if (!account) {
            throw new ApiError("Cobranca nao encontrada!", StatusCodes.NOT_FOUND);
        }

        const student = await this.resolvePayerStudent(account.payerId);
        await this.assertCanAccess(student.userId, requester);

        const reconciled = await this.reconcile(charge);

        return this.toView(reconciled);
    }

    /**
     * Reconsulta o gateway quando faz sentido.
     *
     * Cartao fica de fora: `/transparents/check` so responde por cobrancas
     * transparentes, e o checkout hospedado e confirmado exclusivamente por
     * webhook.
     */
    private async reconcile(charge: PaymentCharge): Promise<PaymentCharge> {
        if (charge.status !== ChargeStatus.PENDING) return charge;
        if (!charge.providerChargeId) return charge;
        if (charge.method === ChargeMethod.CARD) return charge;

        const lastCheck = charge.lastCheckedAt?.getTime() ?? 0;

        if (Date.now() - lastCheck < RECONCILE_MIN_INTERVAL_MS) return charge;

        try {
            const result = await this.abacatePayClient.checkChargeStatus(
                charge.providerChargeId
            );

            const status = this.mapStatus(result.rawStatus);

            if (status === ChargeStatus.PAID) {
                return await this.settle(charge, result.paidAt ?? new Date());
            }

            const updated = await this.paymentChargeRepository.update(charge.id, {
                status,
                lastCheckedAt: new Date(),
            });

            return updated ?? charge;
        } catch (error) {
            // A indisponibilidade do gateway nao pode derrubar a consulta: o app
            // segue mostrando o ultimo status conhecido e tenta de novo depois.
            logger.warn(`[Payments] Reconcile failed for charge ${charge.id}: ${error}`);
            return charge;
        }
    }

    // ─── Webhook ─────────────────────────────────────────────────────────────

    /**
     * Processa um evento de webhook ja autenticado.
     *
     * Idempotente por `eventKey`: o gateway reenvia ate receber 2xx, entao a
     * mesma confirmacao chega mais de uma vez.
     */
    async handleWebhookEvent(payload: unknown): Promise<void> {
        const event = this.normalizeWebhookEvent(payload);

        if (!event) {
            logger.warn("[Payments] Webhook payload not recognized; ignoring");
            return;
        }

        const isNew = await this.paymentChargeRepository.registerWebhookEvent(
            event.eventKey,
            event.eventType,
            payload,
            PaymentProvider.ABACATEPAY
        );

        if (!isNew) {
            logger.info(`[Payments] Webhook ${event.eventKey} already processed; skipping`);
            return;
        }

        const charge = await this.findChargeForEvent(event);

        if (!charge) {
            logger.warn(`[Payments] Webhook ${event.eventKey} has no matching charge`);
            return;
        }

        if (event.status === ChargeStatus.PAID) {
            await this.settle(charge, event.paidAt ?? new Date());
            return;
        }

        await this.paymentChargeRepository.update(charge.id, {
            status: event.status,
            lastCheckedAt: new Date(),
        });
    }

    private findChargeForEvent(event: NormalizedWebhookEvent) {
        if (event.providerChargeId) {
            return this.paymentChargeRepository.findByProviderChargeId(
                event.providerChargeId
            );
        }

        if (event.externalId) {
            return this.paymentChargeRepository.findByExternalId(event.externalId);
        }

        return Promise.resolve(null);
    }

    /**
     * Extrai o que interessa do payload do gateway.
     *
     * A documentacao publica nao fixa a forma exata do objeto `data`, entao os
     * ids sao procurados nos lugares plausiveis em vez de num caminho unico —
     * um evento cuja forma mudou deve virar um aviso, nao uma excecao.
     */
    private normalizeWebhookEvent(payload: unknown): NormalizedWebhookEvent | null {
        if (typeof payload !== "object" || payload === null) return null;

        const body = payload as Record<string, unknown>;
        const eventType = typeof body.event === "string" ? body.event : undefined;

        if (!eventType) return null;

        const data = (body.data ?? {}) as Record<string, unknown>;
        const nested = [
            data,
            data.pixQrCode as Record<string, unknown> | undefined,
            data.billing as Record<string, unknown> | undefined,
            data.transparent as Record<string, unknown> | undefined,
            data.checkout as Record<string, unknown> | undefined,
        ].filter((value): value is Record<string, unknown> =>
            typeof value === "object" && value !== null
        );

        const pick = (key: string): string | undefined => {
            for (const source of nested) {
                const value = source[key];
                if (typeof value === "string" && value.length > 0) return value;
            }
            return undefined;
        };

        const providerChargeId = pick("id");
        const externalId = pick("externalId");

        if (!providerChargeId && !externalId) return null;

        // O `id` do evento e o identificador de idempotencia preferido; sem ele,
        // o par tipo+cobranca ainda impede reprocessar a mesma transicao.
        const eventId = typeof body.id === "string" ? body.id : undefined;
        const eventKey = eventId ?? `${eventType}:${providerChargeId ?? externalId}`;

        const rawStatus = pick("status");
        const paidAtRaw = pick("paidAt") ?? pick("paidAtDate");

        return {
            eventKey,
            eventType,
            providerChargeId,
            externalId,
            status: this.statusFromEvent(eventType, rawStatus),
            paidAt: paidAtRaw ? new Date(paidAtRaw) : undefined,
        };
    }

    /**
     * O nome do evento manda sobre o campo `status`.
     *
     * `checkout.completed` e `transparent.completed` sao a confirmacao em si; o
     * `status` embutido as vezes ainda reflete o estado anterior.
     */
    private statusFromEvent(eventType: string, rawStatus?: string): ChargeStatus {
        if (eventType.endsWith(".completed")) return ChargeStatus.PAID;
        if (eventType.endsWith(".refunded")) return ChargeStatus.REFUNDED;
        if (eventType.endsWith(".lost")) return ChargeStatus.FAILED;

        return this.mapStatus(rawStatus);
    }

    // ─── Baixa da conta ──────────────────────────────────────────────────────

    /**
     * Marca a cobranca e a conta a receber como pagas, numa transacao.
     *
     * Este e o unico caminho pelo qual uma conta chega a `PAID` por pagamento
     * eletronico. Se a cobranca ja estava paga, nao faz nada: um webhook
     * reentregue nao pode gerar uma segunda baixa.
     */
    private async settle(charge: PaymentCharge, paidAt: Date): Promise<PaymentCharge> {
        if (charge.status === ChargeStatus.PAID) return charge;

        return this.paymentChargeRepository.transaction(async (tx) => {
            const updated = await this.paymentChargeRepository.update(
                charge.id,
                {
                    status: ChargeStatus.PAID,
                    paidAt,
                    lastCheckedAt: new Date(),
                },
                tx
            );

            await this.accountReceivableRepository.update(
                charge.accountReceivableId,
                {
                    status: AccountStatus.PAID,
                    paymentDate: paidAt.toISOString().slice(0, 10),
                    paymentType: METHOD_TO_PAYMENT_TYPE[charge.method],
                },
                tx
            );

            logger.info(
                `[Payments] Charge ${charge.id} settled; account ${charge.accountReceivableId} marked PAID`
            );

            return updated ?? charge;
        });
    }

    // ─── Autorizacao e apoio ─────────────────────────────────────────────────

    /**
     * Um aluno so enxerga as proprias cobrancas.
     *
     * Sem esta checagem, `POST /accountReceivables/:id/charges` deixaria
     * qualquer aluno autenticado gerar um Pix — e, ao pagar, quitar — a conta de
     * outro. Admin e motorista tem acesso amplo, como no resto do modulo.
     */
    private async assertCanAccess(
        ownerUserId: number,
        requester: { id: number; role: UserRole }
    ): Promise<void> {
        if (requester.role === UserRole.ADMIN || requester.role === UserRole.DRIVER) {
            return;
        }

        if (requester.id !== ownerUserId) {
            throw new ApiError(
                "Voce nao tem permissao para acessar esta cobranca!",
                StatusCodes.FORBIDDEN
            );
        }
    }

    /** Do pagador da conta ate o aluno, de onde vem nome, CPF e e-mail. */
    private async resolvePayerStudent(payerId: number) {
        const payer = await this.payerRepository.findById(payerId);

        if (!payer?.studentId) {
            throw new ApiError(
                "Pagador desta cobranca nao esta vinculado a um aluno!",
                StatusCodes.CONFLICT
            );
        }

        const student = await this.studentRepository.findById(payer.studentId);

        if (!student) {
            throw new ApiError("Aluno nao encontrado!", StatusCodes.NOT_FOUND);
        }

        return student;
    }

    /**
     * Reais para centavos.
     *
     * `amount` chega como `numeric(10,2)`. `Math.round` sobre o produto evita o
     * classico 25.10 * 100 = 2509.9999... que truncaria um centavo a menos.
     */
    private toCents(amount: number | string): number {
        return Math.round(Number(amount) * 100);
    }

    /** Boleto vencido nao e emitido; conta em atraso ganha um novo prazo curto. */
    private boletoDueDate(dueDate: Date): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = dueDate > today
            ? dueDate
            : new Date(today.getTime() + BOLETO_FALLBACK_DUE_DAYS * 86_400_000);

        return due.toISOString().slice(0, 10);
    }

    private isExpired(charge: PaymentCharge): boolean {
        return charge.expiresAt !== null && charge.expiresAt.getTime() <= Date.now();
    }

    private mapStatus(rawStatus?: string): ChargeStatus {
        if (!rawStatus) return ChargeStatus.PENDING;

        return PROVIDER_STATUS_MAP[rawStatus.toUpperCase()] ?? ChargeStatus.PENDING;
    }

    /** Projeta a cobranca para o app, sem a chave de idempotencia interna. */
    private toView(charge: PaymentCharge): PaymentChargeView {
        return {
            id: charge.id,
            accountReceivableId: charge.accountReceivableId,
            method: charge.method,
            status: charge.status,
            amountCents: charge.amountCents,
            brCode: charge.brCode,
            barCode: charge.barCode,
            paymentUrl: charge.paymentUrl,
            expiresAt: charge.expiresAt?.toISOString() ?? null,
            paidAt: charge.paidAt?.toISOString() ?? null,
        };
    }
}
