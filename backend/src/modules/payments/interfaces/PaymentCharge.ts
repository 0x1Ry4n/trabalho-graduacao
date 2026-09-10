import { ChargeMethod } from "../../../shared/enums/charge-method.enum";
import { ChargeStatus } from "../../../shared/enums/charge-status.enum";
import { PaymentProvider } from "../../../shared/enums/payment-provider.enum";

/**
 * Cobranca criada num gateway para quitar uma conta a receber.
 *
 * Nenhum campo aqui e dado sensivel de cartao. O `brCode` e um payload EMV
 * publico (o mesmo que o banco le no QR) e o `barCode` e a linha digitavel do
 * boleto; ambos so autorizam pagar, nunca cobrar.
 */
export interface PaymentCharge {
    id: number;
    accountReceivableId: number;
    provider: PaymentProvider;
    providerChargeId: string | null;
    externalId: string;
    method: ChargeMethod;
    status: ChargeStatus;
    amountCents: number;
    brCode: string | null;
    barCode: string | null;
    paymentUrl: string | null;
    expiresAt: Date | null;
    paidAt: Date | null;
    lastCheckedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
