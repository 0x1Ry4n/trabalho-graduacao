/**
 * Metodo de pagamento de uma cobranca no gateway.
 *
 * Distinto de `PaymentType` (que descreve como a conta a receber foi/sera
 * quitada, incluindo dinheiro e transferencia manual): aqui so entram os
 * metodos que a AbacatePay executa.
 */
export enum ChargeMethod {
    PIX = "PIX",
    BOLETO = "BOLETO",
    CARD = "CARD",
}
