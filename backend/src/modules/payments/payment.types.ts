import { ChargeMethod } from "../../shared/enums/charge-method.enum";
import { ChargeStatus } from "../../shared/enums/charge-status.enum";
import { PaymentProvider } from "../../shared/enums/payment-provider.enum";

export interface PaymentChargeInsert {
    accountReceivableId: number;
    provider: PaymentProvider;
    externalId: string;
    method: ChargeMethod;
    amountCents: number;
}

export interface PaymentChargeUpdate {
    providerChargeId?: string;
    status?: ChargeStatus;
    brCode?: string | null;
    barCode?: string | null;
    paymentUrl?: string | null;
    expiresAt?: Date | null;
    paidAt?: Date | null;
    lastCheckedAt?: Date | null;
}

/**
 * Projecao da cobranca devolvida ao aplicativo.
 *
 * Deliberadamente mais estreita que `PaymentCharge`: o app nao precisa do
 * `externalId` (chave de idempotencia interna) nem do provedor.
 */
export interface PaymentChargeView {
    id: number;
    accountReceivableId: number;
    method: ChargeMethod;
    status: ChargeStatus;
    amountCents: number;
    brCode: string | null;
    barCode: string | null;
    paymentUrl: string | null;
    expiresAt: string | null;
    paidAt: string | null;
}

/** Evento de webhook ja normalizado, independente do formato do provedor. */
export interface NormalizedWebhookEvent {
    eventKey: string;
    eventType: string;
    /** Id da cobranca no gateway, quando o payload o traz. */
    providerChargeId?: string;
    /** Nossa chave de idempotencia, quando o payload a devolve. */
    externalId?: string;
    status: ChargeStatus;
    paidAt?: Date;
}
