import apiClient from './client';
import { ChargeMethod, CreateChargeDto, PaymentCharge } from '../types';

/**
 * Cobrancas de mensalidade e matricula.
 *
 * O app **nunca** manda valor: o backend le o montante da conta a receber. Se o
 * valor viesse daqui, qualquer requisicao adulterada poderia quitar uma
 * mensalidade de R$ 250,00 pagando um centavo.
 *
 * Nao existe metodo para enviar dados de cartao — nem aqui nem em lugar nenhum
 * do app. O cartao e digitado direto no checkout hospedado da AbacatePay, aberto
 * no navegador do sistema.
 */
export const checkoutApi = {
  /**
   * Abre uma cobranca para uma conta a receber.
   *
   * O backend reaproveita uma cobranca vigente do mesmo metodo em vez de gerar
   * outra, entao chamar de novo ao reabrir a tela e seguro.
   */
  createCharge: async (
    accountReceivableId: string | number,
    method: ChargeMethod,
  ): Promise<PaymentCharge> => {
    const dto: CreateChargeDto = { method };

    const response = await apiClient.post<PaymentCharge>(
      `/accountReceivables/${String(accountReceivableId)}/charges`,
      dto,
    );

    return response.data;
  },

  /**
   * Consulta o status de uma cobranca.
   *
   * A confirmacao definitiva chega ao backend por webhook; esta rota existe para
   * a tela conseguir reagir enquanto o aluno olha para o QR Code.
   */
  getStatus: async (chargeId: number): Promise<PaymentCharge> => {
    const response = await apiClient.get<PaymentCharge>(
      `/charges/${chargeId}/status`,
    );

    return response.data;
  },
};

export default checkoutApi;
