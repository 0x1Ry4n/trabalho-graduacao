import { useCallback, useEffect, useRef, useState } from 'react';
import { checkoutApi } from '../api/checkout';
import { ChargeMethod, ChargeStatus, PaymentCharge } from '../types';
import { getErrorMessage } from '../utils/error.utils';

/**
 * Intervalo entre consultas de status enquanto uma cobranca esta pendente.
 *
 * O backend tambem impoe um piso de 10s antes de reconsultar o gateway, entao
 * bater mais rapido que isso so gastaria bateria devolvendo o mesmo status.
 */
const POLL_INTERVAL_MS = 5_000;

/** Depois disso o aluno provavelmente saiu do app; o Pix continua valido. */
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

interface CheckoutState {
  charge: PaymentCharge | null;
  method: ChargeMethod | null;
  isCreating: boolean;
  error: string | null;
  isPaid: boolean;
}

/**
 * Estado do checkout de uma conta a receber.
 *
 * Concentra criacao da cobranca, polling e limpeza para que a tela cuide so de
 * renderizar — `.claude/rules.md` pede logica fora das telas.
 *
 * O polling e uma rede de seguranca visual. Quem de fato confirma o pagamento e
 * o webhook que a AbacatePay envia ao backend; aqui so perguntamos o que o
 * backend ja sabe.
 */
export function useCheckout(accountReceivableId: string | number) {
  const [state, setState] = useState<CheckoutState>({
    charge: null,
    method: null,
    isCreating: false,
    error: null,
    isPaid: false,
  });

  // Guarda contra setState apos desmontar: o polling e a criacao da cobranca
  // podem terminar depois de o aluno ter saido da tela.
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartedAtRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const poll = useCallback(
    async (chargeId: number) => {
      if (!mountedRef.current) return;

      if (Date.now() - pollStartedAtRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        return;
      }

      try {
        const updated = await checkoutApi.getStatus(chargeId);

        if (!mountedRef.current) return;

        setState((current) => ({
          ...current,
          charge: updated,
          isPaid: updated.status === ChargeStatus.PAID,
        }));

        if (updated.status !== ChargeStatus.PENDING) {
          stopPolling();
          return;
        }
      } catch {
        // Falha de rede nao interrompe o acompanhamento: a proxima tentativa
        // pode ser bem-sucedida, e o aluno continua vendo o QR Code valido.
      }

      pollTimerRef.current = setTimeout(() => poll(chargeId), POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (chargeId: number) => {
      stopPolling();
      pollStartedAtRef.current = Date.now();
      pollTimerRef.current = setTimeout(() => poll(chargeId), POLL_INTERVAL_MS);
    },
    [poll, stopPolling],
  );

  /** Abre (ou recupera) a cobranca do metodo escolhido. */
  const selectMethod = useCallback(
    async (method: ChargeMethod) => {
      stopPolling();
      setState({
        charge: null,
        method,
        isCreating: true,
        error: null,
        isPaid: false,
      });

      try {
        const charge = await checkoutApi.createCharge(accountReceivableId, method);

        if (!mountedRef.current) return;

        setState({
          charge,
          method,
          isCreating: false,
          error: null,
          isPaid: charge.status === ChargeStatus.PAID,
        });

        if (charge.status === ChargeStatus.PENDING) {
          startPolling(charge.id);
        }
      } catch (error) {
        if (!mountedRef.current) return;

        setState({
          charge: null,
          method,
          isCreating: false,
          error: getErrorMessage(error),
          isPaid: false,
        });
      }
    },
    [accountReceivableId, startPolling, stopPolling],
  );

  /**
   * Consulta o status imediatamente.
   *
   * Usada ao voltar do checkout hospedado de cartao, onde o pagamento acontece
   * fora do app e nao ha QR Code na tela para acompanhar.
   */
  const refreshStatus = useCallback(async () => {
    const chargeId = state.charge?.id;
    if (!chargeId) return;

    try {
      const updated = await checkoutApi.getStatus(chargeId);

      if (!mountedRef.current) return;

      setState((current) => ({
        ...current,
        charge: updated,
        isPaid: updated.status === ChargeStatus.PAID,
      }));
    } catch {
      // Silencioso: o status na tela continua sendo o ultimo conhecido.
    }
  }, [state.charge?.id]);

  const reset = useCallback(() => {
    stopPolling();
    setState({
      charge: null,
      method: null,
      isCreating: false,
      error: null,
      isPaid: false,
    });
  }, [stopPolling]);

  return { ...state, selectMethod, refreshStatus, reset };
}
