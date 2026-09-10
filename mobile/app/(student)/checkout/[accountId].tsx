import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Badge, Box, Center, HStack, Icon, Pressable, Spinner, Text, VStack,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { paymentsApi } from '../../../src/api/payments';
import { AccountReceivable, AccountStatus, ChargeMethod } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LoadingSpinner } from '../../../src/components/shared';
import { BoletoPanel, CardPanel, PixPanel } from '../../../src/components/checkout';
import { useCheckout } from '../../../src/hooks/useCheckout';
import { getErrorMessage } from '../../../src/utils/error.utils';

const METHODS: { method: ChargeMethod; label: string; icon: string }[] = [
  { method: ChargeMethod.PIX, label: 'Pix', icon: 'flash-outline' },
  { method: ChargeMethod.CARD, label: 'Cartao', icon: 'card-outline' },
  { method: ChargeMethod.BOLETO, label: 'Boleto', icon: 'barcode-outline' },
];

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

/**
 * Checkout de uma cobranca.
 *
 * A tela so orquestra: escolher o metodo, mostrar o painel correspondente e
 * refletir o status. Criacao da cobranca e acompanhamento ficam no
 * `useCheckout`; o calculo do valor e a confirmacao do pagamento ficam no
 * backend.
 */
export default function CheckoutScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();

  const [account, setAccount] = useState<AccountReceivable | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    charge, method, isCreating, error, isPaid, selectMethod, refreshStatus,
  } = useCheckout(accountId);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await paymentsApi.getById(accountId);
        if (active) setAccount(data);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [accountId]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (loading) return <LoadingSpinner color="student.600" />;

  if (loadError || !account) {
    return (
      <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
        <ScreenHeader title="Pagamento" bg="#7C3AED" />
        <Center flex={1} px="6">
          <Icon as={Ionicons} name="alert-circle-outline" size="6xl" color="coolGray.300" />
          <Text fontSize="md" color="coolGray.500" mt="4" textAlign="center">
            {loadError ?? 'Cobranca nao encontrada.'}
          </Text>
        </Center>
      </Box>
    );
  }

  const isSettled = isPaid || account.status === AccountStatus.PAID;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Pagamento" bg="#7C3AED" />

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
          <Text fontSize="xs" color="coolGray.400" fontWeight="500">
            {account.description ?? 'Cobranca'}
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="coolGray.800" _dark={{ color: 'coolGray.100' }} mt="1">
            {brl(account.amount)}
          </Text>
          <HStack alignItems="center" space={2} mt="2">
            <Icon as={Ionicons} name="calendar-outline" size="xs" color="coolGray.400" />
            <Text fontSize="xs" color="coolGray.500">
              Vencimento em {formatDate(account.dueDate)}
            </Text>
          </HStack>
        </Box>

        {isSettled ? (
          <Center bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="8" mt="3" shadow="1">
            <Icon as={Ionicons} name="checkmark-circle" size="6xl" color="green.500" />
            <Text fontSize="lg" fontWeight="700" color="coolGray.800" _dark={{ color: 'coolGray.100' }} mt="3">
              Pagamento confirmado
            </Text>
            <Text fontSize="sm" color="coolGray.500" mt="1" textAlign="center">
              A cobranca foi baixada automaticamente.
            </Text>
            <Pressable mt="5" onPress={handleBack}>
              <Badge colorScheme="success" variant="subtle" px="4" py="2" borderRadius="full">
                <Text fontSize="xs" fontWeight="600">Voltar para pagamentos</Text>
              </Badge>
            </Pressable>
          </Center>
        ) : (
          <>
            <Text fontSize="xs" fontWeight="600" color="coolGray.500" mt="5" mb="2" px="1">
              COMO VOCE QUER PAGAR
            </Text>

            <HStack space={2}>
              {METHODS.map((item) => {
                const selected = method === item.method;

                return (
                  <Pressable
                    key={item.method}
                    flex={1}
                    onPress={() => selectMethod(item.method)}
                    bg={selected ? 'student.600' : 'white'}
                    _dark={{ bg: selected ? 'student.600' : 'coolGray.800' }}
                    borderRadius="xl"
                    py="4"
                    alignItems="center"
                    shadow="1"
                  >
                    <Icon
                      as={Ionicons}
                      name={item.icon}
                      size="lg"
                      color={selected ? 'white' : 'coolGray.500'}
                    />
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      mt="1.5"
                      color={selected ? 'white' : 'coolGray.600'}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="5" mt="3" shadow="1">
              {isCreating ? (
                <Center py="10">
                  <Spinner color="student.600" />
                  <Text fontSize="sm" color="coolGray.500" mt="3">
                    Gerando cobranca...
                  </Text>
                </Center>
              ) : error ? (
                <Center py="8">
                  <Icon as={Ionicons} name="alert-circle-outline" size="4xl" color="red.400" />
                  <Text fontSize="sm" color="coolGray.600" mt="3" textAlign="center">
                    {error}
                  </Text>
                </Center>
              ) : !charge || !method ? (
                <Center py="10">
                  <Text fontSize="sm" color="coolGray.400" textAlign="center">
                    Escolha uma forma de pagamento acima.
                  </Text>
                </Center>
              ) : method === ChargeMethod.PIX ? (
                <PixPanel charge={charge} />
              ) : method === ChargeMethod.BOLETO ? (
                <BoletoPanel charge={charge} />
              ) : (
                <CardPanel charge={charge} onReturn={refreshStatus} />
              )}
            </Box>
          </>
        )}
      </ScrollView>
    </Box>
  );
}
