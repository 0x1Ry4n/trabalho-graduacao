/**
 * Ciclo de vida de uma cobranca no gateway.
 *
 * `PENDING` e o unico estado a partir do qual vale reconciliar; os demais sao
 * terminais e nao voltam atras.
 */
export enum ChargeStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    FAILED = "FAILED",
}
