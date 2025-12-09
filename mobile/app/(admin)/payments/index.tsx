import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Pressable, Icon, Badge, Spinner, Button,
  FormControl,
  Input,
  Modal,
  Select,
  useToast,
} from 'native-base';
import { RefreshControl, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { paymentsApi } from '../../../src/api/payments';
import { studentsApi } from '../../../src/api/students';
import { enrollmentsApi } from '../../../src/api/enrollments';
import { priceTablesApi } from '../../../src/api/priceTables';
import { AccountReceivable, AccountStatus, EnrollmentStatus, PaymentType, AccountReceivableType, Student, PriceTable } from '../../../src/types';
import { formatCPF, formatCurrency, maskCurrency, unmaskCurrency } from '../../../src/utils/masks';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { AddFab, SearchModal, TopRefreshButton, SwipeDeleteItem } from '@/src/components/shared';
import DatePickerInput from '../../../src/components/ui/DatePickerInput';

const HEADER_COLOR = '#1E40AF';
const HEADER_PRESSED_COLOR = '#1E3A8A';

type Filter = 'ALL' | AccountStatus;
const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: AccountStatus.OPEN },
  { label: 'Pago', value: AccountStatus.PAID },
  { label: 'Cancelado', value: AccountStatus.CANCELED },
];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function statusLabel(s: AccountStatus) { return s === 'OPEN' ? 'Pendente' : s === 'PAID' ? 'Pago' : 'Cancelado'; }
function statusColor(s: AccountStatus) { return s === 'OPEN' ? 'warning' : s === 'PAID' ? 'success' : 'error'; }
function isActiveStatus(status?: unknown) { return String(status ?? '').toUpperCase() === EnrollmentStatus.ACTIVE; }
function getEnrollmentStudentId(enrollment: any) { return String(enrollment.studentId ?? enrollment.student?.id ?? ''); }
function getEnrollmentPayerId(enrollment: any) { return enrollment.payerId ?? enrollment.student?.payerId; }
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

function getPriceTableDate(value?: string | Date) {
  if (!value) return '';

  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return '';

  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function PaymentsScreen() {
  const toast = useToast();
  const [payments, setPayments] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<AccountReceivableType>(AccountReceivableType.ENROLLMENT_FEE);
  const [loadingPriceTable, setLoadingPriceTable] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await paymentsApi.list();
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as cobranças.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentsApi.list();
      setStudents(data);
    } catch {
    }
  }, []);

  useEffect(() => { load(); loadStudents(); }, [load, loadStudents]);

  useEffect(() => {
    if (showManualCreate) {
      applyPriceTable(type);
    }
  }, [showManualCreate]);

  async function applyPriceTable(nextType: AccountReceivableType) {
    setLoadingPriceTable(true);
    try {
      const priceTableByType = await priceTablesApi.getByType(nextType);
      const priceTable = priceTableByType.active === 1
        ? priceTableByType
        : (await priceTablesApi.list()).find((item) => item.type === nextType && item.active === 1);

      if (!priceTable) {
        throw new Error('Tabela de preço ativa não encontrada');
      }

      applyPriceTableValues(priceTable);
    } catch {
      if (nextType === AccountReceivableType.ENROLLMENT_FEE) {
        Alert.alert('Atenção', 'Nenhum preço ativo encontrado para taxa de matrícula.');
      }
    } finally {
      setLoadingPriceTable(false);
    }
  }

  function applyPriceTableValues(priceTable: PriceTable) {
    if (priceTable.active === 0) return;

    setAmount(maskCurrency(String(Math.round(Number(priceTable.price) * 100))));

    const priceDueDate = getPriceTableDate(priceTable.dueDate);
    if (priceDueDate) setDueDate(priceDueDate);

    if (priceTable.type === AccountReceivableType.ENROLLMENT_FEE) {
      setDescription('Taxa de matrícula');
    } else if (priceTable.type === AccountReceivableType.MONTHLY_FEE) {
      setDescription('Mensalidade');
    }
  }

  function handleTypeChange(nextType: AccountReceivableType) {
    setType(nextType);
    setAmount('');
    setDueDate('');
    setDescription('');
    applyPriceTable(nextType);
  }

  async function handleManualCreate() {
    if (!selectedStudent || !amount || !description || !dueDate) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    try {
      const enrollments = await enrollmentsApi.list();
      const enrollment = enrollments.find(e => getEnrollmentStudentId(e) === String(selectedStudent.id) && isActiveStatus(e.status));
      if (!enrollment) {
        Alert.alert('Erro', 'Estudante não tem matrícula ativa.');
        return;
      }
      const payerId = getEnrollmentPayerId(enrollment);
      if (!payerId) {
        Alert.alert('Erro', 'Matrícula não possui pagador vinculado.');
        return;
      }
      const dto = {
        payerId: Number(payerId),
        enrollmentId: Number(enrollment.id),
        description,
        amount: Number(unmaskCurrency(amount)),
        dueDate: new Date(dueDate).toISOString(),
        accountReceivableType: type,
        paymentType: PaymentType.ANY,
        status: AccountStatus.OPEN,
      };
      const newPayment = await paymentsApi.create(dto);
      setPayments(prev => [...prev, newPayment]);
      setShowManualCreate(false);
      resetManualForm();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar cobrança.');
    }
  }

  function resetManualForm() {
    setSelectedStudent(null);
    setAmount('');
    setDescription('');
    setDueDate('');
    setType(AccountReceivableType.ENROLLMENT_FEE);
    setLoadingPriceTable(false);
  }

  function confirmDelete(payment: AccountReceivable) {
    Alert.alert('Excluir cobrança', 'Deseja realmente excluir esta cobrança? Ela será cancelada.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await paymentsApi.update(payment.id, {
              status: AccountStatus.CANCELED,
            });
            setPayments((current) => current.map((item) => (
              item.id === payment.id ? updated : item
            )));
            toast.show({ description: 'Cobrança cancelada.', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a cobrança.');
          }
        },
      },
    ]);
  }

  const filtered = payments.filter((payment) => (
    (filter === 'ALL' || payment.status === filter) &&
    isWithinPeriod(payment, periodStart, periodEnd)
  ));
  const totalOpen = payments
    .filter((p) => p.status === AccountStatus.OPEN)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color={HEADER_COLOR} /></Box>;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Cobranças"
        subtitle={`Pendente: ${brl(totalOpen)}`}
        bg={HEADER_COLOR}
        rightContent={
          <HStack space={2}>
            <Pressable onPress={() => router.push('/(admin)/payments/price-table')} p="1">
              <Icon as={Ionicons} name="settings-outline" size="5" color="white" />
            </Pressable>
          </HStack>
        }
      />

      <HStack px="3" py="2.5" space={2} bg="white" _dark={{ bg: 'coolGray.800' }} borderBottomWidth={1} borderBottomColor="coolGray.100">
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            px="3" py="1.5" borderRadius="full"
            bg={filter === f.value ? HEADER_COLOR : 'coolGray.100'}
            _dark={{ bg: filter === f.value ? HEADER_COLOR : 'coolGray.700' }}
          >
            <Text fontSize="xs" fontWeight="600" color={filter === f.value ? 'white' : 'coolGray.600'}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </HStack>

      <Box px="3" py="3" bg="white" _dark={{ bg: 'coolGray.800' }} borderBottomWidth={1} borderBottomColor="coolGray.100">
        <HStack space={2} alignItems="flex-end">
          <Box flex={1}>
            <DatePickerInput
              label="Início"
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <Box mb="3">
            <TopRefreshButton
              onPress={load}
              bgColor={HEADER_COLOR}
              pressedBgColor={HEADER_PRESSED_COLOR}
            />
          </Box>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <SwipeDeleteItem onDelete={() => confirmDelete(item)} actionBg={HEADER_COLOR}>
          <Pressable
            onPress={() => router.push(`/(admin)/payments/${item.id}` as any)}
            _pressed={{ opacity: 0.85 }}
          >
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" shadow="1" overflow="hidden">
              <HStack>
                <Box w="1" bg={item.status === AccountStatus.PAID ? 'green.500' : item.status === AccountStatus.OPEN ? 'amber.500' : 'coolGray.400'} />
                <VStack flex={1} p="3.5">
                  <HStack justifyContent="space-between" alignItems="center" mb="1">
                    <Text fontSize="lg" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>
                      {"R$ " + formatCurrency(String(item.amount ?? 0))}
                    </Text>
                    <HStack alignItems="center" space={2}>
                      <Badge colorScheme={statusColor(item.status)} borderRadius="full" variant="subtle">
                        <Text fontSize="2xs" fontWeight="700">{statusLabel(item.status)}</Text>
                      </Badge>
                      <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                    </HStack>
                  </HStack>
                  <Text fontSize="xs" color="coolGray.500">
                    {item.status === AccountStatus.PAID && item.paymentDate ? `Pago em ${date(item.paymentDate)}` : `Vence em ${date(item.dueDate)}`}
                  </Text>
                  {item.description && <Text fontSize="xs" color="coolGray.400" mt="0.5">{item.description}</Text>}
                </VStack>
              </HStack>
            </Box>
          </Pressable>
          </SwipeDeleteItem>
        )}
        ListEmptyComponent={
          <VStack alignItems="center" pt="16" space={3}>
            <Icon as={Ionicons} name="receipt-outline" size="12" color="coolGray.300" />
            <Text color="coolGray.400" fontSize="md">Nenhuma cobrança encontrada</Text>
          </VStack>
        }
      />

      <AddFab onPress={() => setShowManualCreate(true)} bg={HEADER_COLOR} pressedBg={HEADER_PRESSED_COLOR} />

      <Modal isOpen={showManualCreate} onClose={() => setShowManualCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>
            <Text fontSize="lg" fontWeight="700">Criar Cobrança Manual</Text>
          </Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <FormControl isRequired>
                <FormControl.Label>Selecionar Aluno</FormControl.Label>
                <HStack space={2}>
                  <Input
                    flex={1}
                    placeholder="Nome do aluno"
                    value={selectedStudent?.name || ''}
                    isReadOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setShowStudentSearch(true)}
                    borderRadius="xl"
                  >
                    <Icon as={Ionicons} name="search" size="4" />
                  </Button>
                </HStack>
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>Tipo</FormControl.Label>
                <Select selectedValue={type} onValueChange={(v) => handleTypeChange(v as AccountReceivableType)}>
                  <Select.Item label="Taxa de Matrícula" value="ENROLLMENT_FEE" />
                  <Select.Item label="Mensalidade" value="MONTHLY_FEE" />
                </Select>
              </FormControl>
              {loadingPriceTable && (
                <Text fontSize="xs" color="coolGray.500">
                  Buscando valor na tabela de preços...
                </Text>
              )}
              <FormControl isRequired>
                <FormControl.Label>Valor</FormControl.Label>
                <Input
                  placeholder="R$ 0,00"
                  value={amount}
                  onChangeText={(v) => setAmount(maskCurrency(v))}
                  keyboardType="numeric"
                  isDisabled={loadingPriceTable}
                />
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>Descrição</FormControl.Label>
                <Input
                  placeholder="Descrição da cobrança"
                  value={description}
                  onChangeText={setDescription}
                />
              </FormControl>
              <DatePickerInput
                label="Data de Vencimento"
                value={dueDate}
                onChange={setDueDate}
                required
              />
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" onPress={() => setShowManualCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} onPress={handleManualCreate} borderRadius="xl">Criar</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <SearchModal<Student>
        isOpen={showStudentSearch}
        onClose={() => { setShowStudentSearch(false); setStudentSearch(''); }}
        title="Selecionar Aluno"
        placeholder="Buscar por nome ou CPF..."
        items={students}
        search={studentSearch}
        onSearch={setStudentSearch}
        filterFn={(s, q) => s.name.toLowerCase().includes(q) || s.cpf.includes(q)}
        keyExtractor={(s) => String(s.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => { setSelectedStudent(item); setShowStudentSearch(false); setStudentSearch(''); }}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.name}</Text>
              <Text fontSize="sm" color="coolGray.500">CPF: {formatCPF(item.cpf)}</Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="people-outline"
        emptyMessage="Nenhum aluno encontrado"
      />
    </Box>
  );
}
