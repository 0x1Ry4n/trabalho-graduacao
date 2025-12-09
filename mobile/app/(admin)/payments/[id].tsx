import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Badge, Button, Icon, useToast,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { paymentsApi } from '../../../src/api/payments';
import { AccountReceivable, AccountStatus, AccountReceivableType, PaymentType } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LoadingSpinner, InfoRow, TopRefreshButton } from '../../../src/components/shared';
import { formatCurrency } from '@/src/utils/masks';

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function statusLabel(s: AccountStatus) {
  return s === 'OPEN' ? 'Pendente' : s === 'PAID' ? 'Pago' : 'Cancelado';
}

function statusColor(s: AccountStatus) {
  return s === 'OPEN' ? 'warning' : s === 'PAID' ? 'success' : 'error';
}

function typeLabel(t?: AccountReceivableType) {
  if (t === AccountReceivableType.ENROLLMENT_FEE) return 'Taxa de Matrícula';
  if (t === AccountReceivableType.MONTHLY_FEE) return 'Mensalidade';
  return '-';
}

function paymentTypeLabel(t?: PaymentType) {
  switch (t) {
    case PaymentType.CASH: return 'Dinheiro';
    case PaymentType.CREDIT_CARD: return 'Cartão de Crédito';
    case PaymentType.DEBIT_CARD: return 'Cartão de Débito';
    case PaymentType.PIX: return 'PIX';
    case PaymentType.BANK_TRANSFER: return 'Transferência Bancária';
    case PaymentType.ANY: return 'Qualquer';
    default: return '-';
  }
}

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [payment, setPayment] = useState<AccountReceivable | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await paymentsApi.getById(id!);
      setPayment(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a cobrança.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  async function handleMarkPaid() {
    if (!payment) return;
    Alert.alert('Confirmar recebimento', `Marcar ${formatCurrency(String(payment.amount ?? 0))} como pago?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setMarking(true);
          try {
            const updated = await paymentsApi.update(payment.id, {
              status: AccountStatus.PAID,
              paymentDate: new Date().toISOString(),
            });
            setPayment(updated);
            toast.show({ description: 'Cobrança marcada como paga!', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Não foi possível atualizar a cobrança.');
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  }

  async function handleCancel() {
    if (!payment) return;
    Alert.alert('Cancelar cobrança', 'Tem certeza que deseja cancelar esta cobrança?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar cobrança',
        style: 'destructive',
        onPress: async () => {
          setCanceling(true);
          try {
            const updated = await paymentsApi.update(payment.id, {
              status: AccountStatus.CANCELED,
            });
            setPayment(updated);
            toast.show({ description: 'Cobrança cancelada.', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Não foi possível cancelar a cobrança.');
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner color="admin.600" />;
  if (!payment) return null;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Detalhe da Cobrança"
        showBack
        showMenu={false}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Box mb="3">
          <TopRefreshButton
            onPress={load}
            bgColor="admin.600"
            pressedBgColor="admin.700"
          />
        </Box>

        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <HStack justifyContent="space-between" alignItems="center" mb="3">
            <Text fontSize="2xl" fontWeight="800" color="coolGray.800" _dark={{ color: 'white' }}>
              {"R$ " + formatCurrency(String(payment.amount ?? 0))}
            </Text>
            <Badge colorScheme={statusColor(payment.status)} borderRadius="full" variant="subtle" px="3" py="1">
              <Text fontSize="xs" fontWeight="700">{statusLabel(payment.status)}</Text>
            </Badge>
          </HStack>

          {payment.status === AccountStatus.OPEN && (
            <HStack space={2}>
              <Button
                flex={1}
                colorScheme="green"
                borderRadius="xl"
                leftIcon={<Icon as={Ionicons} name="checkmark-circle-outline" size="4" />}
                isLoading={marking}
                onPress={handleMarkPaid}
              >
                Receber
              </Button>
              <Button
                flex={1}
                colorScheme="red"
                variant="outline"
                borderRadius="xl"
                leftIcon={<Icon as={Ionicons} name="close-circle-outline" size="4" />}
                isLoading={canceling}
                onPress={handleCancel}
              >
                Cancelar
              </Button>
            </HStack>
          )}
        </Box>

        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
            Dados da Cobrança
          </Text>
          <VStack space={0}>
            <InfoRow label="Tipo" value={typeLabel(payment.accountReceivableType)} />
            <InfoRow label="Forma de Pagamento" value={paymentTypeLabel(payment.paymentType)} />
            <InfoRow label="Vencimento" value={fmt(payment.dueDate)} />
            {payment.paymentDate && (
              <InfoRow label="Data de Pagamento" value={fmt(payment.paymentDate)} />
            )}
            {payment.description && (
              <InfoRow label="Descrição" value={payment.description} />
            )}
            <InfoRow label="Criado em" value={fmt(payment.createdAt)} />
          </VStack>
        </Box>

      </ScrollView>
    </Box>
  );
}
