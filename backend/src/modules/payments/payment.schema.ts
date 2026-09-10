import { z } from "zod";
import { ChargeMethod } from "../../shared/enums/charge-method.enum";

/**
 * Corpo aceito ao abrir uma cobranca.
 *
 * Somente o metodo. Valor, vencimento e pagador saem da conta a receber no
 * servidor — um `amount` vindo do cliente permitiria pagar qualquer quantia.
 */
export const createChargeSchema = z.object({
    method: z.enum(ChargeMethod),
});

export type CreateChargeInput = z.infer<typeof createChargeSchema>;
