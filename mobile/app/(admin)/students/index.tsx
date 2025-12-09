import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable, Badge,
  Modal, Button, FormControl, useToast, Select,
} from 'native-base';
import { RefreshControl, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { studentsApi } from '../../../src/api/students';
import { usersApi } from '../../../src/api/users';
import { collegesApi } from '../../../src/api/colleges';
import { enrollmentsApi } from '../../../src/api/enrollments';
import { paymentsApi } from '../../../src/api/payments';
import {
  Student, User, College, AccountReceivableType, PaymentType, AccountStatus, EnrollmentStatus, UserRole,
} from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import {
  maskCPF, maskRG, maskPhone, maskCEP, maskNumeric, unmask, maskCurrency, unmaskCurrency,
} from '../../../src/utils/masks';
import DatePickerInput from '../../../src/components/ui/DatePickerInput';
import { useFormError } from '../../../src/utils/error.utils';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, SearchModal, TopRefreshButton } from '../../../src/components/shared';

export default function StudentsListScreen() {
  const toast = useToast();
  const { error: createError, fieldErrors, isLoading: saving, clearError, withFormError } = useFormError();
  const { fillAddressFromCep } = useCepAddress();

  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkCharge, setShowBulkCharge] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bulkCreating, setBulkCreating] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCollegeSearch, setShowCollegeSearch] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const [name, setName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [cin, setCin] = useState('');
  const [notes, setNotes] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkType, setBulkType] = useState<AccountReceivableType>(AccountReceivableType.MONTHLY_FEE);

  const baseInputProps = {
    variant: 'filled',
    bg: 'coolGray.50',
    borderRadius: 'xl',
    borderColor: 'coolGray.300',
    _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } },
    _focus: { borderColor: 'admin.600', bg: 'white' },
    fontSize: 'sm',
  } as const;

  const load = useCallback(async () => {
    try {
      const data = await studentsApi.list();
      setStudents(data);
      setFiltered(data);
    } catch {
      Alert.alert('Erro', 'Não foi possivel carregar os alunos...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadUsersAndColleges = useCallback(async () => {
    try {
      const [usersData, collegesData] = await Promise.all([
        usersApi.list(),
        collegesApi.list(),
      ]);
      setUsers(usersData.filter((user) => user.role === UserRole.STUDENT));
      setColleges(collegesData);
    } catch {
    }
  }, []);

  useEffect(() => { loadUsersAndColleges(); }, [loadUsersAndColleges]);

  const handleCepChange = async (value: string) => {
    const maskedValue = maskCEP(value);
    setCep(maskedValue);

    if (isCompleteCep(maskedValue)) {
      const success = await fillAddressFromCep(
        maskedValue,
        setAddress,
        setNeighborhood,
        setCity
      );

      if (!success) {
        toast.show({
          description: 'CEP não encontrado. Preencha o endereço manualmente.',
          placement: 'top',
          bg: 'orange.500'
        });
      }
    }
  };

  function resetForm() {
    setName(''); setMotherName(''); setCpf(''); setRg('');
    setPhone(''); setEmail(''); setBirthDate('');
    setCourse(''); setSemester(''); setYear('');
    setCity(''); setNeighborhood(''); setAddress(''); setCep('');
    setCin(''); setNotes('');
    setSelectedUser(null); setSelectedCollege(null);
  }

  function toggleSelectedStudent(studentId: string) {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function clearBulkChargeForm() {
    setBulkAmount('');
    setBulkDescription('');
    setBulkDueDate('');
    setBulkType(AccountReceivableType.MONTHLY_FEE);
  }

  async function handleCreateBulkCharges() {
    if (selectedStudentIds.size === 0 || !bulkAmount || !bulkDescription.trim() || !bulkDueDate) {
      Alert.alert('Atenção', 'Selecione alunos e preencha os dados da cobrança.');
      return;
    }

    setBulkCreating(true);
    try {
      const enrollments = await enrollmentsApi.list();
      const selectedIds = Array.from(selectedStudentIds);
      const activeEnrollments = selectedIds.map((studentId) => (
        enrollments.find((enrollment) => (
          String(enrollment.studentId ?? enrollment.student?.id) === String(studentId) &&
          enrollment.status === EnrollmentStatus.ACTIVE
        ))
      ));

      const missing = activeEnrollments.filter((enrollment) => !enrollment).length;
      const validEnrollments = activeEnrollments.filter(Boolean);

      if (validEnrollments.length === 0) {
        Alert.alert('Erro', 'Nenhum aluno selecionado possui matrícula ativa.');
        return;
      }

      await Promise.all(validEnrollments.map((enrollment: any) => {
        const payerId = enrollment.payerId ?? enrollment.student?.payerId;
        if (!payerId) return Promise.resolve();

        return paymentsApi.create({
          payerId: Number(payerId),
          enrollmentId: Number(enrollment.id),
          description: bulkDescription.trim(),
          amount: Number(unmaskCurrency(bulkAmount)),
          dueDate: new Date(bulkDueDate).toISOString(),
          accountReceivableType: bulkType,
          paymentType: PaymentType.ANY,
          status: AccountStatus.OPEN,
        });
      }));

      setShowBulkCharge(false);
      setSelectedStudentIds(new Set());
      clearBulkChargeForm();
      toast.show({
        description: missing
          ? `Cobranças criadas. ${missing} aluno(s) sem matrícula ativa foram ignorados.`
          : 'Cobranças criadas com sucesso!',
        placement: 'top',
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível criar as cobranças.');
    } finally {
      setBulkCreating(false);
    }
  }

  const handleCreate = withFormError(async () => {
    if (!selectedUser || !selectedCollege || !name.trim() || !motherName.trim() || !cpf.trim() ||
      !rg.trim() || !phone.trim() || !email.trim() || !birthDate.trim() ||
      !course.trim() || !semester.trim() || !year.trim() ||
      !city.trim() || !neighborhood.trim() || !address.trim() || !cep.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (name.trim().length < 8) {
      Alert.alert('Atenção', 'O nome do aluno deve ter pelo menos 8 caracteres.');
      return;
    }
    if (motherName.trim().length < 8) {
      Alert.alert('Atenção', 'O nome da mãe deve ter pelo menos 8 caracteres.');
      return;
    }
    if (cin.trim() && cin.trim().length !== 11) {
      Alert.alert('Atenção', 'O CIN deve ter exatamente 11 dígitos.');
      return;
    }
    if (parseInt(semester) < 1 || parseInt(semester) > 2) {
      Alert.alert('Atenção', 'O semestre deve ser 1 ou 2.');
      return;
    }
    if (parseInt(year) < 2000) {
      Alert.alert('Atenção', 'O ano deve ser maior ou igual a 2000.');
      return;
    }

    const payload: any = {
      userId: Number(selectedUser.id),
      name: name.trim(),
      motherName: motherName.trim(),
      cpf: unmask(cpf),
      rg: unmask(rg),
      phone: unmask(phone) || undefined,
      email: email.trim() || undefined,
      birthDate: birthDate.trim(),
      collegeId: Number(selectedCollege.id),
      course: course.trim(),
      semester: parseInt(semester, 10),
      year: parseInt(year, 10),
      city: city.trim(),
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      cep: unmask(cep),
    };

    if (cin.trim()) payload.cin = cin.trim();
    if (notes.trim()) payload.notes = notes.trim();

    await studentsApi.create(payload);
    setShowCreate(false);
    resetForm();
    await load();
    toast.show({ description: 'Aluno criado com sucesso!', placement: 'top' });
  });

  if (loading) return <LoadingSpinner color="admin.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Alunos"
        subtitle={`${filtered.length} registros`}
        rightContent={
          <HStack space={2}>
            <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
              <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
            </Pressable>
          </HStack>
        }
      />

      {searchVisible && (
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome, CPF ou e-mail..."
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListHeaderComponent={
          <VStack mb="3" space={2}>
            <TopRefreshButton
              onPress={load}
              bgColor="admin.600"
              pressedBgColor="admin.700"
            />
            {selectedStudentIds.size > 0 ? (
              <HStack bg="admin.50" p="3" borderRadius="xl" alignItems="center" justifyContent="space-between">
                <Text fontSize="xs" fontWeight="700" color="admin.700">
                  {selectedStudentIds.size} aluno(s) selecionado(s)
                </Text>
                <HStack space={2}>
                  <Button size="xs" colorScheme="admin" borderRadius="lg" onPress={() => setShowBulkCharge(true)}>
                    Criar cobrança
                  </Button>
                  <Button size="xs" variant="ghost" colorScheme="admin" onPress={() => setSelectedStudentIds(new Set())}>
                    Limpar
                  </Button>
                </HStack>
              </HStack>
            ) : null}
          </VStack>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        renderItem={({ item }) => {
          const isSelected = selectedStudentIds.has(item.id);
          return (
            <Pressable onPress={() => router.push(`/(admin)/students/${item.id}`)} mb="2">
              <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
                <HStack alignItems="center" space={3}>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      toggleSelectedStudent(item.id);
                    }}
                    w="6"
                    h="6"
                    borderRadius="full"
                    bg={isSelected ? 'admin.600' : 'coolGray.100'}
                    borderWidth={1}
                    borderColor={isSelected ? 'admin.600' : 'coolGray.300'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected ? <Icon as={Ionicons} name="checkmark" size="4" color="white" /> : null}
                  </Pressable>
                  <Box w="10" h="10" borderRadius="full" bg="admin.100" alignItems="center" justifyContent="center">
                    <Text color="admin.600" fontWeight="700" fontSize="lg">
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </Box>
                  <VStack flex={1}>
                    <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text fontSize="xs" color="coolGray.500">CPF: {maskCPF(item.cpf)}</Text>
                    <Text fontSize="xs" color="coolGray.500">Telefone: {maskPhone(item.phone)}</Text>
                    {item.enrollment?.cardCode && (
                      <Text fontSize="xs" color="coolGray.400">Cartão: {item.enrollment.cardCode}</Text>
                    )}
                  </VStack>
                  <VStack alignItems="flex-end" space={1}>
                    <Badge
                      colorScheme={item.active === 1 ? 'success' : 'coolGray'}
                      borderRadius="full" variant="subtle" px="2">
                      <Text fontSize="2xs" fontWeight="700">
                        {item.active === 1 ? 'Ativo' : 'Inativo'}
                      </Text>
                    </Badge>
                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                  </VStack>
                </HStack>
              </Box>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState icon="people-outline" message="Nenhum aluno encontrado" />}
      />

      <AddFab onPress={() => { loadUsersAndColleges(); setShowCreate(true); }} bg="admin.600" pressedBg="admin.700" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>
            <Text fontSize="lg" fontWeight="700">Novo Aluno</Text>
          </Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <ErrorDisplay error={createError} onDismiss={clearError} />
              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">CONTA</Text>
              <FormControl isRequired>
                <FormControl.Label>ID do usuário</FormControl.Label>
                <HStack space={2}>
                  <Input
                    {...baseInputProps}
                    flex={1}
                    placeholder="ID do usuário vinculado"
                    value={selectedUser ? String(selectedUser.id) : ''}
                    isReadOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="admin"
                    onPress={() => setShowUserSearch(true)}
                    borderRadius="xl"
                  >
                    <Icon as={Ionicons} name="search" size="4" />
                  </Button>
                </HStack>
                {selectedUser && (
                  <Text fontSize="xs" color="coolGray.500" mt="1">
                    {selectedUser.username} ({selectedUser.email})
                  </Text>
                )}
              </FormControl>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">DADOS PESSOAIS</Text>
              <FormControl isRequired isInvalid={!!fieldErrors.name}>
                <FormControl.Label>Nome completo</FormControl.Label>
                <Input {...baseInputProps} placeholder="Ex: Joao da Silva" value={name} onChangeText={setName} />
                <FormControl.ErrorMessage>{fieldErrors.name}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.motherName}>
                <FormControl.Label>Nome da mãe</FormControl.Label>
                <Input {...baseInputProps} placeholder="Ex: Maria da Silva" value={motherName} onChangeText={setMotherName} />
                <FormControl.ErrorMessage>{fieldErrors.motherName}</FormControl.ErrorMessage>
              </FormControl>
              <HStack space={2}>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.cpf}>
                  <FormControl.Label>CPF</FormControl.Label>
                  <Input {...baseInputProps} placeholder="000.000.000-00" value={cpf} onChangeText={(v) => setCpf(maskCPF(v))} keyboardType="numeric" />
                  <FormControl.ErrorMessage>{fieldErrors.cpf}</FormControl.ErrorMessage>
                </FormControl>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.rg}>
                  <FormControl.Label>RG</FormControl.Label>
                  <Input {...baseInputProps} placeholder="00.000.000-0" value={rg} onChangeText={(v) => setRg(maskRG(v))} keyboardType="numeric" />
                  <FormControl.ErrorMessage>{fieldErrors.rg}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!fieldErrors.cin}>
                <FormControl.Label>CIN (opcional)</FormControl.Label>
                <Input {...baseInputProps} placeholder="Ex: 12345678901" value={cin} onChangeText={setCin} keyboardType="numeric" />
                <FormControl.ErrorMessage>{fieldErrors.cin}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl>
                <FormControl.Label>Observações (opcional)</FormControl.Label>
                <Input {...baseInputProps} placeholder="Notas extras" value={notes} onChangeText={setNotes} />
              </FormControl>
              <DatePickerInput
                label="Data nasc."
                value={birthDate}
                onChange={setBirthDate}
                required
                errorMessage={fieldErrors.birthDate}
              />
              <HStack space={2}>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.phone}>
                  <FormControl.Label>Telefone</FormControl.Label>
                  <Input {...baseInputProps} placeholder="(17) 99999-9999" value={phone} onChangeText={(v) => setPhone(maskPhone(v))} keyboardType="phone-pad" />
                  <FormControl.ErrorMessage>{fieldErrors.phone}</FormControl.ErrorMessage>
                </FormControl>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.email}>
                  <FormControl.Label>E-mail</FormControl.Label>
                  <Input {...baseInputProps} placeholder="aluno@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  <FormControl.ErrorMessage>{fieldErrors.email}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">ACADÊMICO</Text>
              <FormControl isRequired isInvalid={!!fieldErrors.collegeId}>
                <FormControl.Label>ID da faculdade</FormControl.Label>
                <HStack space={2}>
                  <Input
                    {...baseInputProps}
                    flex={1}
                    placeholder="ID da instituição"
                    value={selectedCollege ? String(selectedCollege.id) : ''}
                    isReadOnly
                  />
                  <Button size="sm" variant="outline" colorScheme="admin" onPress={() => setShowCollegeSearch(true)} borderRadius="xl">
                    <Icon as={Ionicons} name="search" size="4" />
                  </Button>
                </HStack>
                {selectedCollege && (
                  <Text fontSize="xs" color="coolGray.500" mt="1">
                    {selectedCollege.name} - {selectedCollege.city}
                  </Text>
                )}
                <FormControl.ErrorMessage>{fieldErrors.collegeId}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.course}>
                <FormControl.Label>Curso</FormControl.Label>
                <Input {...baseInputProps} placeholder="Ex: Medicina" value={course} onChangeText={setCourse} />
                <FormControl.ErrorMessage>{fieldErrors.course}</FormControl.ErrorMessage>
              </FormControl>
              <HStack space={2}>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.semester}>
                  <FormControl.Label>Semestre</FormControl.Label>
                  <Input {...baseInputProps} placeholder="1 ou 2" value={semester} onChangeText={(v) => setSemester(maskNumeric(v, 2))} keyboardType="numeric" />
                  <FormControl.ErrorMessage>{fieldErrors.semester}</FormControl.ErrorMessage>
                </FormControl>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.year}>
                  <FormControl.Label>Ano</FormControl.Label>
                  <Input {...baseInputProps} placeholder="Ex: 2025" value={year} onChangeText={(v) => setYear(maskNumeric(v, 4))} keyboardType="numeric" />
                  <FormControl.ErrorMessage>{fieldErrors.year}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>

              <HStack alignItems="center" justifyContent="space-between" mt="2">
                <Text fontSize="xs" fontWeight="700" color="coolGray.500">ENDEREÇO</Text>
              </HStack>
              <FormControl isRequired isInvalid={!!fieldErrors.cep}>
                <FormControl.Label>CEP</FormControl.Label>
                <Input {...baseInputProps} placeholder="00000-000" value={cep} onChangeText={handleCepChange} keyboardType="numeric" />
                <FormControl.ErrorMessage>{fieldErrors.cep}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.address}>
                <FormControl.Label>Endereço</FormControl.Label>
                <Input {...baseInputProps} placeholder="Rua, numero" value={address} onChangeText={setAddress} />
                <FormControl.ErrorMessage>{fieldErrors.address}</FormControl.ErrorMessage>
              </FormControl>
              <HStack space={2}>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.neighborhood}>
                  <FormControl.Label>Bairro</FormControl.Label>
                  <Input {...baseInputProps} placeholder="Ex: Centro" value={neighborhood} onChangeText={setNeighborhood} />
                  <FormControl.ErrorMessage>{fieldErrors.neighborhood}</FormControl.ErrorMessage>
                </FormControl>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.city}>
                  <FormControl.Label>Cidade</FormControl.Label>
                  <Input {...baseInputProps} placeholder="Ex: Jales" value={city} onChangeText={setCity} />
                  <FormControl.ErrorMessage>{fieldErrors.city}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="admin" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} colorScheme="admin" onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Aluno</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <Modal isOpen={showBulkCharge} onClose={() => setShowBulkCharge(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>
            <Text fontSize="lg" fontWeight="700">Criar cobranças</Text>
          </Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <Text fontSize="xs" color="coolGray.500">
                {selectedStudentIds.size} aluno(s) selecionado(s). A cobrança será criada para os alunos com matrícula ativa.
              </Text>
              <FormControl isRequired>
                <FormControl.Label>Tipo</FormControl.Label>
                <Select
                  selectedValue={bulkType}
                  onValueChange={(value) => setBulkType(value as AccountReceivableType)}
                  placeholder="Selecione o tipo"
                >
                  <Select.Item label="Taxa de Matrícula" value={AccountReceivableType.ENROLLMENT_FEE} />
                  <Select.Item label="Mensalidade" value={AccountReceivableType.MONTHLY_FEE} />
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>Valor</FormControl.Label>
                <Input
                  placeholder="R$ 0,00"
                  value={bulkAmount}
                  onChangeText={(value) => setBulkAmount(maskCurrency(value))}
                  keyboardType="numeric"
                />
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>Descrição</FormControl.Label>
                <Input
                  placeholder="Ex: Mensalidade de maio"
                  value={bulkDescription}
                  onChangeText={setBulkDescription}
                />
              </FormControl>
              <DatePickerInput
                label="Vencimento"
                value={bulkDueDate}
                onChange={setBulkDueDate}
                required
              />
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="admin" onPress={() => setShowBulkCharge(false)} borderRadius="xl">
                Cancelar
              </Button>
              <Button flex={1} colorScheme="admin" onPress={handleCreateBulkCharges} isLoading={bulkCreating} borderRadius="xl">
                Criar
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <SearchModal<User>
        isOpen={showUserSearch}
        onClose={() => { setShowUserSearch(false); setUserSearch(''); }}
        title="Selecionar Usuário"
        placeholder="Buscar por nome de usuário ou e-mail..."
        items={users}
        search={userSearch}
        onSearch={setUserSearch}
        filterFn={(u, q) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)}
        keyExtractor={(u) => String(u.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => { setSelectedUser(item); setShowUserSearch(false); setUserSearch(''); }}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.username}</Text>
              <Text fontSize="sm" color="coolGray.500">{item.email}</Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="people-outline"
        emptyMessage="Nenhum usuário encontrado"
      />

      <SearchModal<College>
        isOpen={showCollegeSearch}
        onClose={() => { setShowCollegeSearch(false); setCollegeSearch(''); }}
        title="Selecionar Faculdade"
        placeholder="Buscar por nome da faculdade..."
        items={colleges}
        search={collegeSearch}
        onSearch={setCollegeSearch}
        filterFn={(c, q) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)}
        keyExtractor={(c) => String(c.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => { setSelectedCollege(item); setShowCollegeSearch(false); setCollegeSearch(''); }}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.name}</Text>
              <Text fontSize="sm" color="coolGray.500">{item.city} - {item.neighborhood}</Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="school-outline"
        emptyMessage="Nenhuma faculdade encontrada"
      />
    </Box>
  );
}
