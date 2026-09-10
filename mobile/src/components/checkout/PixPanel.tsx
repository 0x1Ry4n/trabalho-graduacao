import React, { useEffect, useState } from 'react';
import { Box, Center, Text, VStack } from 'native-base';
import QRCode from 'react-native-qrcode-svg';
import { PaymentCharge } from '../../types';
import { CopyableCode } from './CopyableCode';

interface PixPanelProps {
  charge: PaymentCharge;
}

/** Lado do QR Code em pontos. Abaixo disso a leitura falha em telas pequenas. */
const QR_SIZE = 220;

function formatRemaining(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

/**
 * Contagem regressiva ate a expiracao do Pix.
 *
 * Fica no componente porque e puramente visual — quem decide se a cobranca
 * expirou e o backend, ao reconciliar com o gateway.
 */
function useCountdown(expiresAt: string | null): string | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const deadline = new Date(expiresAt).getTime();

    if (Number.isNaN(deadline)) {
      setRemaining(null);
      return;
    }

    const tick = () => setRemaining(deadline - Date.now());

    tick();
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining === null ? null : formatRemaining(remaining);
}

/**
 * Pagamento via Pix.
 *
 * O QR Code e desenhado localmente a partir do `brCode` em vez de exibir o PNG
 * que o gateway devolve: e vetorial (nitido em qualquer densidade) e evita
 * carregar uma imagem remota so para mostrar um dado que ja temos em texto.
 */
export function PixPanel({ charge }: PixPanelProps) {
  const countdown = useCountdown(charge.expiresAt);

  if (!charge.brCode) {
    return (
      <Center py="8">
        <Text fontSize="sm" color="coolGray.500" textAlign="center">
          O codigo Pix ainda nao esta disponivel. Tente novamente em instantes.
        </Text>
      </Center>
    );
  }

  return (
    <VStack space={4} alignItems="center">
      <Box bg="white" p="4" borderRadius="2xl" shadow="1">
        <QRCode value={charge.brCode} size={QR_SIZE} />
      </Box>

      {countdown ? (
        <Text fontSize="xs" color="coolGray.500">
          Expira em <Text fontWeight="700">{countdown}</Text>
        </Text>
      ) : null}

      <CopyableCode
        label="Pix copia e cola"
        code={charge.brCode}
        helpText="Abra o app do seu banco, escolha Pix e leia o QR Code ou cole o codigo. A confirmacao aparece aqui automaticamente."
      />
    </VStack>
  );
}

export default PixPanel;
