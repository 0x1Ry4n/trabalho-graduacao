import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
  FormControl, Spinner, useToast,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { driversApi } from '../../../src/api/drivers';
import { Driver, ContractType } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { maskPhone, maskCEP, unmask, maskCPF, maskRG, maskDate } from '../../../src/utils/masks';
import { InfoRow } from '@/src/components/shared';
import { useFormError } from '../../../src/utils/error.utils';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';

const CONTRACT_LABELS: Record<ContractType, string> = {
  [ContractType.CLT]: 'CLT',
  [ContractType.PJ]: 'PJ',
  [ContractType.FREELANCER]: 'Freelancer',
};

function statusLabel(active: number) {
  return active === 1 ? 'Ativo' : 'Inativo';
}

export default function DriverDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const toast = useToast();
  const { fillAddressFromCep } = useCepAddress();
  const { error: saveError, fieldErrors, isLoading: saving, clearError, withFormError } = useFormError();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');

  const load = useCallback(async () => {
    if (!id || id === 'undefined') return;
    try {
      const d = await driversApi.getById(id);
      setDriver(d);
      setName(d.name);
      setPhone(d.phone ? maskPhone(d.phone) : '');
      setEmail(d.email ?? '');
      setLicenseNumber(d.licenseNumber ?? '');
      setCity(d.city ?? '');
      setNeighborhood(d.neighborhood ?? '');
      setAddress(d.address ?? '');
      setCep(d.cep ? maskCEP(d.cep) : '');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar o motorista.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive() {
    if (!driver) return;
    try {
      if (driver.active === 1) {
        await driversApi.inactivate(id!);
      } else {
        await driversApi.activate(id!);
      }
      load();
      toast.show({ description: `Motorista ${driver.active === 1 ? 'desativado' : 'ativado'} com sucesso!`, placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  }

  const handleSave = withFormError(async () => {
    if (!name.trim()) {
      Alert.alert('Atencao', 'O nome e obrigatorio.');
      return;
    }
    const updated = await driversApi.update(id!, {
      name: name.trim(),
      phone: unmask(phone) || undefined,
      email: email.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      city: city.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      address: address.trim() || undefined,
      cep: unmask(cep) || undefined,
    });
    setDriver(updated);
    setEditing(false);
    clearError();
    toast.show({ description: 'Motorista atualizado!', placement: 'top' });
  });

  async function handleCepChange(value: string) {
    const maskedValue = maskCEP(value);
    setCep(maskedValue);

    if (!isCompleteCep(maskedValue)) return;

    const success = await fillAddressFromCep(
      maskedValue,
      setAddress,
      setNeighborhood,
      setCity
    );

    if (!success) {
      toast.show({
        description: 'CEP nao encontrado. Preencha o endereco manualmente.',
        placement: 'top',
        bg: 'orange.500',
      });
    }
  }

  if (loading) return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50">
      <Spinner size="lg" color="driver.600" />
    </Box>
  );

  if (!driver || !id || id === 'undefined') return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50">
      <Text color="coolGray.500">Motorista não encontrado.</Text>
    </Box>
  );

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title={driver.name}
        bg="#059669"
        showBack
        showMenu={false}
        rightContent={
          <HStack space={2} alignItems="center">
            <Pressable onPress={() => { setEditing(!editing); clearError(); }} p="1">
              <Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" />
            </Pressable>
          </HStack>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="xs" color="coolGray.500" mb="1">Status</Text>
              <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                {statusLabel(driver.active)}
              </Text>
            </VStack>
            <Pressable
              onPress={handleToggleActive}
              px="4"
              py="2"
              bg={driver.active === 1 ? 'red.50' : 'green.50'}
              _pressed={{ bg: driver.active === 1 ? 'red.100' : 'green.100' }}
              borderRadius="lg"
            >
              <Text fontSize="xs" fontWeight="700" color={driver.active === 1 ? 'red.500' : 'green.500'}>
                {driver.active === 1 ? 'Desativar' : 'Ativar'}
              </Text>
            </Pressable>
          </HStack>
        </Box>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
            {editing ? 'Editar Motorista' : 'Dados pessoais'}
          </Text>
          {editing ? (
            <VStack space={3}>
              <ErrorDisplay error={saveError} onDismiss={clearError} />
              <FormControl isInvalid={!!fieldErrors.name}>
                <FormControl.Label>Nome</FormControl.Label>
                <Input value={name} onChangeText={setName} />
                <FormControl.ErrorMessage>{fieldErrors.name}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.phone}>
                <FormControl.Label>Telefone</FormControl.Label>
                <Input value={maskPhone(phone)} onChangeText={(v) => setPhone(maskPhone(v))} keyboardType="phone-pad" />
                <FormControl.ErrorMessage>{fieldErrors.phone}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.email}>
                <FormControl.Label>E-mail</FormControl.Label>
                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <FormControl.ErrorMessage>{fieldErrors.email}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.licenseNumber}>
                <FormControl.Label>CNH</FormControl.Label>
                <Input value={licenseNumber} onChangeText={setLicenseNumber} />
                <FormControl.ErrorMessage>{fieldErrors.licenseNumber}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.cep}>
                <FormControl.Label>CEP</FormControl.Label>
                <Input value={maskCEP(cep)} onChangeText={handleCepChange} keyboardType="numeric" />
                <FormControl.ErrorMessage>{fieldErrors.cep}</FormControl.ErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!fieldErrors.address}>
                <FormControl.Label>Endereço</FormControl.Label>
                <Input value={address} onChangeText={setAddress} />
                <FormControl.ErrorMessage>{fieldErrors.address}</FormControl.ErrorMessage>
              </FormControl>
              <HStack space={2}>
                <FormControl flex={1} isInvalid={!!fieldErrors.neighborhood}>
                  <FormControl.Label>Bairro</FormControl.Label>
                  <Input value={neighborhood} onChangeText={setNeighborhood} />
                  <FormControl.ErrorMessage>{fieldErrors.neighborhood}</FormControl.ErrorMessage>
                </FormControl>
                <FormControl flex={1} isInvalid={!!fieldErrors.city}>
                  <FormControl.Label>Cidade</FormControl.Label>
                  <Input value={city} onChangeText={setCity} />
                  <FormControl.ErrorMessage>{fieldErrors.city}</FormControl.ErrorMessage>
                </FormControl>
              </HStack>

              <HStack space={2} mt="2">
                <Button flex={1} variant="outline" colorScheme="driver" onPress={() => { setEditing(false); clearError(); }} borderRadius="xl">Cancelar</Button>
                <Button flex={1} colorScheme="driver" onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
              </HStack>
            </VStack>
          ) : (
            <VStack>
              <InfoRow label="CPF" value={maskCPF(driver.cpf)} />
              <InfoRow label="RG" value={maskRG(driver.rg)} />
              <InfoRow label="Nascimento" value={maskDate(driver.birthDate)} />
              <InfoRow label="Telefone" value={driver.phone ? maskPhone(driver.phone) : undefined} />
              <InfoRow label="E-mail" value={driver.email} />
              <InfoRow label="CNH" value={driver.licenseNumber} />
            </VStack>
          )}
        </Box>

        {!editing && (
          <>
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
              <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Endereço</Text>
              <InfoRow label="Endereço" value={driver.address} />
              <InfoRow label="Bairro" value={driver.neighborhood} />
              <InfoRow label="Cidade" value={driver.city} />
              <InfoRow label="CEP" value={maskCEP(driver.cep)} />
            </Box>
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
              <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Contrato</Text>
              <InfoRow label="Tipo" value={CONTRACT_LABELS[driver.contractType] ?? driver.contractType} />
              <InfoRow label="Salário" value={driver.salary ? `R$ ${driver.salary}` : undefined} />
              <InfoRow label="Admissão" value={maskDate(driver.admissionDate)} />
              <InfoRow label="Rescisão" value={driver.rescissionDate ? maskDate(driver.rescissionDate) : undefined} />
            </Box>
          </>
        )}
      </ScrollView>
    </Box>
  );
}
