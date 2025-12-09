import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable,
  Modal, Button, FormControl, useToast, Select, Badge,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { driversApi } from '../../../src/api/drivers';
import { usersApi } from '../../../src/api/users';
import { Driver, ContractType, User } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, SearchModal, TopRefreshButton } from '../../../src/components/shared';
import { maskCPF, maskRG, maskPhone, maskCEP, maskCurrency, unmask, unmaskCurrency, formatCPF, formatPhone } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';
import DatePickerInput from '../../../src/components/ui/DatePickerInput';

const CONTRACT_LABELS: Record<ContractType, string> = {
  [ContractType.CLT]: 'CLT',
  [ContractType.PJ]: 'PJ',
  [ContractType.FREELANCER]: 'Freelancer',
};

export default function DriversListScreen() {
  const toast = useToast();
  const { error: createError, fieldErrors, isLoading: saving, clearError, withFormError } = useFormError(); const { fillAddressFromCep } = useCepAddress(); const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filtered, setFiltered] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Search states for user
  const [users, setUsers] = useState<User[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [contractType, setContractType] = useState<ContractType>(ContractType.CLT);
  const [salary, setSalary] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');

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
      const data = await driversApi.list();
      setDrivers(data);
      console.log(data)
      setFiltered(data);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os motoristas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await usersApi.list();
      const driverUsers = usersData.filter((user) => user.role === 'DRIVER');
      setUsers(driverUsers);
    } catch {
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (showUserSearch) {
      loadUsers();
    }
  }, [showUserSearch, loadUsers]);

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

  useEffect(() => {
    if (!search.trim()) { setFiltered(drivers); return; }
    const q = search.toLowerCase();
    setFiltered(drivers.filter((d) => d.name.toLowerCase().includes(q) || d.cpf.includes(q)));
  }, [search, drivers]);

  function resetForm() {
    setName(''); setMotherName(''); setCpf(''); setRg('');
    setBirthDate(''); setLicenseNumber(''); setPhone(''); setEmail('');
    setCity(''); setNeighborhood(''); setAddress(''); setCep('');
    setContractType(ContractType.CLT); setSalary(''); setAdmissionDate('');
    setSelectedUser(null);
  }

  const handleCreate = withFormError(async () => {
    if (!selectedUser || !name.trim() || !motherName.trim() || !cpf.trim() ||
      !rg.trim() || !birthDate.trim() || !licenseNumber.trim() ||
      !city.trim() || !neighborhood.trim() || !address.trim() || !cep.trim() ||
      !admissionDate.trim() || unmaskCurrency(salary) <= 0) {
      Alert.alert('Atencao', 'Preencha todos os campos obrigatorios.');
      return;
    }
    await driversApi.create({
      userId: Number(selectedUser.id),
      name: name.trim(),
      motherName: motherName.trim(),
      cpf: unmask(cpf),
      rg: unmask(rg),
      birthDate: birthDate.trim(),
      licenseNumber: licenseNumber.trim(),
      phone: unmask(phone) || undefined,
      email: email.trim() || undefined,
      city: city.trim(),
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      cep: unmask(cep),
      contractType,
      salary: unmaskCurrency(salary),
      admissionDate: admissionDate.trim(),
    });
    setShowCreate(false);
    resetForm();
    await load();
    toast.show({ description: 'Motorista criado com sucesso!', placement: 'top' });
  });

  if (loading) return <LoadingSpinner color="driver.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Motoristas"
        subtitle={`${filtered.length} registros`}
        bg="#059669"
        rightContent={
          <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
            <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
          </Pressable>
        }
      />

      {searchVisible && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nome ou CPF..." />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListHeaderComponent={
          <Box mb="3">
            <TopRefreshButton
              onPress={load}
              bgColor="#059669"
              pressedBgColor="#047857"
            />
          </Box>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(admin)/drivers/${item.id}`)} mb="2">
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1"
              opacity={item.active === 0 ? 0.6 : 1}>
              <HStack alignItems="center" space={3}>
                <Box w="10" h="10" borderRadius="full"
                  bg={item.active === 0 ? 'coolGray.200' : 'driver.100'}
                  alignItems="center" justifyContent="center">
                  <Text color={item.active === 0 ? 'coolGray.400' : 'driver.600'} fontWeight="700" fontSize="lg">
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </Box>
                <VStack flex={1}>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="coolGray.800"
                    _dark={{ color: 'coolGray.100' }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text fontSize="xs" color="coolGray.500">
                    CPF: {formatCPF(item.cpf)}
                  </Text>

                  {item.phone && (
                    <Text fontSize="xs" color="coolGray.400">
                      Telefone: {formatPhone(item.phone)}
                    </Text>
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
        )}
        ListEmptyComponent={<EmptyState icon="person-outline" message="Nenhum motorista encontrado" />}
      />

      <AddFab onPress={() => setShowCreate(true)} bg="driver.600" pressedBg="driver.700" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>
            <Text fontSize="lg" fontWeight="700">Novo Motorista</Text>
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
                <Input {...baseInputProps} placeholder="Ex: Carlos Santos Silva" value={name} onChangeText={setName} />
                <FormControl.ErrorMessage>{fieldErrors.name}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.motherName}>
                <FormControl.Label>Nome da mãe</FormControl.Label>
                <Input {...baseInputProps} placeholder="Ex: Maria Santos Silva" value={motherName} onChangeText={setMotherName} />
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
              <HStack space={2}>
                <DatePickerInput
                  label="Data nasc."
                  value={birthDate}
                  onChange={setBirthDate}
                  required
                  flex={1}
                  errorMessage={fieldErrors.birthDate}
                />
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.licenseNumber}>
                  <FormControl.Label>CNH</FormControl.Label>
                  <Input {...baseInputProps} placeholder="00000000000" value={licenseNumber} onChangeText={setLicenseNumber} />
                  <FormControl.ErrorMessage>{fieldErrors.licenseNumber}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!fieldErrors.phone}>
                <FormControl.Label>Telefone</FormControl.Label>
                <Input {...baseInputProps} placeholder="(17) 99999-9999" value={phone} onChangeText={(v) => setPhone(maskPhone(v))} keyboardType="phone-pad" />
                <FormControl.ErrorMessage>{fieldErrors.phone}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.email}>
                <FormControl.Label>E-mail</FormControl.Label>
                <Input {...baseInputProps} placeholder="motorista@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <FormControl.ErrorMessage>{fieldErrors.email}</FormControl.ErrorMessage>
              </FormControl>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">ENDEREÇO</Text>
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


              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">CONTRATO</Text>
              <FormControl isRequired isInvalid={!!fieldErrors.contractType}>
                <FormControl.Label>Tipo de contrato</FormControl.Label>
                <Select selectedValue={contractType} onValueChange={(v) => setContractType(v as ContractType)}>
                  {Object.entries(CONTRACT_LABELS).map(([key, label]) => (
                    <Select.Item key={key} label={label} value={key} />
                  ))}
                </Select>
                <FormControl.ErrorMessage>{fieldErrors.contractType}</FormControl.ErrorMessage>
              </FormControl>
              <HStack space={2}>
                <FormControl isRequired flex={1} isInvalid={!!fieldErrors.salary}>
                  <FormControl.Label>Salário</FormControl.Label>
                  <Input {...baseInputProps} placeholder="R$ 3.500,00" value={salary} onChangeText={(v) => setSalary(maskCurrency(v))} keyboardType="numeric" />
                  <FormControl.ErrorMessage>{fieldErrors.salary}</FormControl.ErrorMessage>
                </FormControl>
                <DatePickerInput
                  label="Admissão"
                  value={admissionDate}
                  onChange={setAdmissionDate}
                  required
                  flex={1}
                  errorMessage={fieldErrors.admissionDate}
                />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="driver" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} colorScheme="driver" onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Motorista</Button>
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
    </Box>
  );
}
