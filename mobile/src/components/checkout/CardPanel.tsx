import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Box, Button, Center, HStack, Icon, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { PaymentCharge } from '../../types';

interface CardPanelProps {
  charge: PaymentCharge;
  /** Chamado ao voltar do navegador, para reconsultar o status da cobranca. */
  onReturn: () => void;
}

/**
 * Pagamento com cartao de credito.
 *
 * Nao ha formulario de cartao aqui, e isso e proposital.
 *
 * A AbacatePay nao expoe endpoint de tokenizacao nem SDK client-side: cartao so
 * existe no checkout hospedado deles. Um formulario nosso teria que enviar o
 * numero do cartao ao nosso backend — que nao teria para onde encaminha-lo — e
 * colocaria a aplicacao inteira em escopo PCI-DSS sem nenhum ganho.
 *
 * Com o checkout hospedado, numero, CVV e validade sao digitados dentro do
 * dominio da AbacatePay. Nada disso passa pelo app, pelo nosso servidor ou por
 * qualquer armazenamento local.
 *
 * `openAuthSessionAsync` abre uma Custom Tab (Android) ou
 * SFAuthenticationSession (iOS) — o navegador do sistema, isolado do app. Um
 * `WebView` embutido seria o oposto: nosso JavaScript poderia inspecionar a
 * pagina onde o cartao esta sendo digitado.
 */
export function CardPanel({ charge, onReturn }: CardPanelProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = useCallback(async () => {
    if (!charge.paymentUrl) return;

    setIsOpening(true);

    try {
      await WebBrowser.openAuthSessionAsync(charge.paymentUrl);
      // O resultado do navegador nao decide nada: quem confirma o pagamento e o
      // webhook que a AbacatePay envia ao backend. Aqui so pedimos o status.
      onReturn();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir o pagamento.');
    } finally {
      setIsOpening(false);
    }
  }, [charge.paymentUrl, onReturn]);

  if (!charge.paymentUrl) {
    return (
      <Center py="8">
        <Text fontSize="sm" color="coolGray.500" textAlign="center">
          O checkout ainda nao esta disponivel. Tente novamente em instantes.
        </Text>
      </Center>
    );
  }

  return (
    <VStack space={4}>
      <Box bg="coolGray.100" _dark={{ bg: 'coolGray.700' }} borderRadius="xl" p="4">
        <HStack space={3} alignItems="flex-start">
          <Icon as={Ionicons} name="lock-closed" size="sm" color="green.600" mt="0.5" />
          <VStack flex={1} space={1}>
            <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
              Pagamento seguro
            </Text>
            <Text fontSize="xs" color="coolGray.600" _dark={{ color: 'coolGray.300' }}>
              Os dados do seu cartao sao digitados no ambiente da AbacatePay e
              nao passam pelo UniPass. Nao guardamos numero, validade nem CVV.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Button
        onPress={handleOpen}
        isLoading={isOpening}
        isLoadingText="Abrindo..."
        leftIcon={<Icon as={Ionicons} name="card-outline" size="sm" />}
      >
        Pagar com cartao
      </Button>

      <Text fontSize="2xs" color="coolGray.500" textAlign="center">
        Voce sera levado ao ambiente de pagamento e volta para o app ao concluir.
      </Text>
    </VStack>
  );
}

export default CardPanel;
