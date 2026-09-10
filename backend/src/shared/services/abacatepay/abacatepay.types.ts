import { ChargeMethod } from "../../enums/charge-method.enum";

/**
 * Envelope padrao da AbacatePay v2.
 *
 * Diferente do nosso `SendResponse`, `success: false` chega com HTTP 200 em
 * varios casos — por isso o client precisa checar o corpo, e nao so o status.
 */
export interface AbacateEnvelope<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

/** Dados do pagador exigidos pelo boleto (nome e CPF sao obrigatorios). */
export interface AbacateCustomer {
    name: string;
    taxId: string;
    email: string;
    cellphone?: string;
}

export interface CreateTransparentPixInput {
    amountCents: number;
    description: string;
    externalId: string;
    expiresInMinutes: number;
    customer: AbacateCustomer;
}

export interface CreateTransparentBoletoInput {
    amountCents: number;
    description: string;
    externalId: string;
    dueDate: string;
    customer: AbacateCustomer;
}

export interface CreateHostedCheckoutInput {
    amountCents: number;
    description: string;
    externalId: string;
    customer: AbacateCustomer;
    returnUrl?: string;
    completionUrl?: string;
}

/**
 * Resposta normalizada de qualquer um dos tres fluxos.
 *
 * O gateway devolve formatos diferentes para Pix, boleto e checkout hospedado;
 * achatar aqui evita que o service tenha que conhecer cada um deles.
 */
export interface NormalizedCharge {
    providerChargeId: string;
    method: ChargeMethod;
    /** Pix copia-e-cola. */
    brCode?: string;
    /** Linha digitavel do boleto. */
    barCode?: string;
    /** URL do boleto (impressao) ou do checkout hospedado (cartao). */
    paymentUrl?: string;
    expiresAt?: Date;
    /** Status cru devolvido pelo gateway, antes do mapeamento para `ChargeStatus`. */
    rawStatus?: string;
}

/** Resultado de `GET /transparents/check`. */
export interface ChargeStatusResult {
    rawStatus: string;
    paidAt?: Date;
}
