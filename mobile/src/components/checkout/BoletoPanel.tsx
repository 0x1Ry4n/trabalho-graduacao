import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { Button, Center, Icon, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { PaymentCharge } from '../../types';
import { CopyableCode } from './CopyableCode';

interface BoletoPanelProps {
  charge: PaymentCharge;
}

/**
 * Pagamento via boleto.
 *
 * A linha digitavel resolve o caso comum (colar no app do banco); o botao abre o
 * PDF hospedado pelo gateway para quem precisa imprimir ou pagar no caixa.
 */
export function BoletoPanel({ charge }: BoletoPanelProps) {
  const handleOpen = useCallback(async () => {
    if (!charge.paymentUrl) return;

    try {
      await WebBrowser.openBrowserAsync(charge.paymentUrl);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir o boleto.');
    }
  }, [charge.paymentUrl]);

  if (!charge.barCode) {
    return (
      <Center py="8">
        <Text fontSize="sm" color="coolGray.500" textAlign="center">
          O boleto ainda nao esta disponivel. Tente novamente em instantes.
        </Text>
      </Center>
    );
  }

  return (
    <VStack space={4}>
      <CopyableCode
        label="Linha digitavel"
        code={charge.barCode}
        helpText="Boletos levam ate 3 dias uteis para compensar. A baixa e automatica assim que o banco confirma."
      />

      {charge.paymentUrl ? (
        <Button
          variant="outline"
          onPress={handleOpen}
          leftIcon={<Icon as={Ionicons} name="document-text-outline" size="sm" />}
        >
          Abrir boleto
        </Button>
      ) : null}
    </VStack>
  );
}

export default BoletoPanel;
