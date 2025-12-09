import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Pressable, Icon, Badge, Button,
} from 'native-base';
import { RefreshControl, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentsApi } from '../../src/api/payments';
import { AccountReceivable, AccountStatus } from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { LoadingSpinner, TopRefreshButton } from '../../src/components/shared';
import { useAuthStore } from '../../src/store/auth.store';
import { loadStudentContext } from '../../src/utils/student.utils';
import { formatCurrency } from '@/src/utils/masks';
import DatePickerInput from '../../src/components/ui/DatePickerInput';

type Filter = 'ALL' | AccountStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: AccountStatus.OPEN },
  { label: 'Pago', value: AccountStatus.PAID },
  { label: 'Cancelado', value: AccountStatus.CANCELED },
];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function statusLabel(status: AccountStatus) {
  return status === 'OPEN' ? 'Pendente' : status === 'PAID' ? 'Pago' : 'Cancelado';
}

function statusColor(status: AccountStatus) {
  return status === 'OPEN' ? 'warning' : status === 'PAID' ? 'success' : 'error';
}

function getDateOnly(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWithinPeriod(payment: AccountReceivable, startDate: string, endDate: string) {
  const dueDate = getDateOnly(payment.dueDate);
  if (!dueDate) return false;
  if (startDate && dueDate < startDate) return false;
  if (endDate && dueDate > endDate) return false;
  return true;
}

export default function StudentPaymentsScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const load = useCallback(async () => {
    try {
      const context = await loadStudentContext(user?.id);
      setPayments(context.payments);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as cobrancas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) load();
  }, [load, user]);

  async function handleMarkPaid(payment: AccountReceivable) {
    Alert.alert('Marcar como pago', `Confirmar que pagou ${brl(payment.amount)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const paymentDate = new Date().toISOString();
          setMarkingId(payment.id);
          try {
            await paymentsApi.update(payment.id, { status: AccountStatus.PAID, paymentDate });
            setPayments((current) => current.map((item) => (
              item.id === payment.id
                ? { ...item, status: AccountStatus.PAID, paymentDate }
                : item
            )));
          } catch {
            Alert.alert('Erro', 'Nao foi possivel atualizar.');
          } finally {
            setMarkingId(null);
          }
        },
      },
    ]);
  }

  const totalPaid = payments
    .filter((payment) => payment.status === AccountStatus.PAID)
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const totalOpen = payments
    .filter((payment) => payment.status === AccountStatus.OPEN)
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const filteredPayments = payments.filter((payment) => (
    (filter === 'ALL' || payment.status === filter) &&
    isWithinPeriod(payment, periodStart, periodEnd)
  ));

  if (loading) return <LoadingSpinner color="student.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Pagamentos" bg="#7C3AED" />

      <HStack px="3" py="2.5" space={2} bg="white" _dark={{ bg: 'coolGray.800' }} borderBottomWidth={1} borderBottomColor="coolGray.100">
        {FILTERS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setFilter(item.value)}
            px="3"
            py="1.5"
            borderRadius="full"
            bg={filter === item.value ? 'student.600' : 'coolGray.100'}
            _dark={{ bg: filter === item.value ? 'student.600' : 'coolGray.700' }}
          >
            <Text fontSize="xs" fontWeight="600" color={filter === item.value ? 'white' : 'coolGray.600'}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </HStack>

      <Box px="3" py="3" bg="white" _dark={{ bg: 'coolGray.800' }} borderBottomWidth={1} borderBottomColor="coolGray.100">
        <HStack space={2} alignItems="flex-end">
          <Box flex={1}>
            <DatePickerInput
              label="Inicio"
              value={periodStart}
              onChange={setPeriodStart}
            />
          </Box>
          <Box flex={1}>
            <DatePickerInput
              label="Fim"
              value={periodEnd}
              onChange={setPeriodEnd}
            />
          </Box>
          {(periodStart || periodEnd) ? (
            <Pressable
              onPress={() => { setPeriodStart(''); setPeriodEnd(''); }}
              w="10"
              h="10"
              mb="1"
              borderRadius="xl"
              bg="coolGray.100"
              _dark={{ bg: 'coolGray.700' }}
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={Ionicons} name="close" size="5" color="coolGray.600" />
            </Pressable>
          ) : null}
        </HStack>
      </Box>

      <HStack mx="3" mt="3" bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
        <VStack flex={1} alignItems="center">
          <Text fontSize="2xs" color="coolGray.400" fontWeight="500">Pago</Text>
          <Text fontSize="lg" fontWeight="800" color="green.600" mt="1">{"R$ " + formatCurrency(totalPaid)}</Text>
        </VStack>
        <Box w="px" bg="coolGray.200" _dark={{ bg: 'coolGray.600' }} my="1" />
        <VStack flex={1} alignItems="center">
          <Text fontSize="2xs" color="coolGray.400" fontWeight="500">Pendente</Text>
          <Text fontSize="lg" fontWeight="800" color="amber.600" mt="1">{"R$ " + formatCurrency(totalOpen)}</Text>
        </VStack>
      </HStack>

      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <Box mb="3">
            <TopRefreshButton onPress={load} />
          </Box>
        }
        renderItem={({ item }) => (
          <Pressable
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="xl"
            p="4"
            mb="3"
            shadow="1"
            onPress={() => item.status === AccountStatus.OPEN && handleMarkPaid(item)}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <VStack flex={1}>
                <Text fontSize="md" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                  {item.description ?? 'Cobrança'}
                </Text>
                <Text fontSize="sm" color="coolGray.500" mt="0.5">
                  Vencimento: {date(item.dueDate)}
                </Text>
                {item.paymentDate && (
                  <Text fontSize="sm" color="coolGray.500">
                    Pago em: {date(item.paymentDate)}
                  </Text>
                )}
              </VStack>
              <VStack alignItems="flex-end">
                <Text fontSize="lg" fontWeight="800" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                  {brl(item.amount)}
                </Text>
                <Badge colorScheme={statusColor(item.status)} variant="subtle" mt="1" px="2" py="0.5" borderRadius="full">
                  <Text fontSize="2xs" fontWeight="600">{statusLabel(item.status)}</Text>
                </Badge>
                {item.status === AccountStatus.OPEN && (
                  <Button
                    size="xs"
                    mt="2"
                    colorScheme="success"
                    isLoading={markingId === item.id}
                    onPress={() => handleMarkPaid(item)}
                  >
                    Marcar pago
                  </Button>
                )}
              </VStack>
            </HStack>
          </Pressable>
        )}
        ListEmptyComponent={
          <Box alignItems="center" justifyContent="center" py="12">
            <Icon as={Ionicons} name="receipt-outline" size="6xl" color="coolGray.300" />
            <Text fontSize="md" color="coolGray.400" mt="4" textAlign="center">
              Nenhuma cobrança encontrada
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
