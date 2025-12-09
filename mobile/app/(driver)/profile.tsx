import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Icon,
  Pressable,
  ScrollView,
  Switch,
  Text,
  VStack,
} from 'native-base';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { driversApi } from '../../src/api/drivers';
import { usersApi } from '../../src/api/users';
import { Driver, User, ContractType } from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { useTheme } from '../../src/hooks/useTheme';
import {
  InfoRow,
  LoadingSpinner,
  TopRefreshButton,
} from '../../src/components/shared';
import {
  formatCurrency,
  maskCEP,
  maskCPF,
  maskPhone,
  maskRG,
} from '../../src/utils/masks';

function formatDate(value?: string) {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value?: string) {
  if (!value) return undefined;
  return new Date(value).toLocaleString('pt-BR');
}

function contractTypeLabel(value?: ContractType) {
  if (value === ContractType.CLT) return 'CLT';
  if (value === ContractType.PJ) return 'PJ';
  if (value === ContractType.FREELANCER) return 'Freelancer';
  return undefined;
}

function statusLabel(active?: number) {
  if (active == null) return undefined;
  return active === 1 ? 'Ativo' : 'Inativo';
}

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [currentUser, currentDriver] = await Promise.all([
        usersApi.getMe(),
        driversApi.getByUserId(String(user?.id ?? '')),
      ]);

      setProfile(currentUser);
      setDriver(currentDriver);
    } catch {
      setProfile(null);
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner color="driver.600" />;

  const displayName =
    driver?.name ?? profile?.username ?? user?.username ?? 'Motorista';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Meu Perfil" bg="#059669" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="3">
          <TopRefreshButton
            onPress={load}
            bgColor="driver.600"
            pressedBgColor="driver.700"
          />
        </Box>

        <Box
          bg="white"
          _dark={{ bg: 'coolGray.800' }}
          borderRadius="2xl"
          p="5"
          shadow="1"
          mb="3"
        >
          <HStack alignItems="center" space={4}>
            <Box
              w="16"
              h="16"
              borderRadius="full"
              bg="driver.100"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl" fontWeight="800" color="driver.700">
                {initials}
              </Text>
            </Box>

            <VStack flex={1}>
              <Text
                fontSize="lg"
                fontWeight="800"
                color="coolGray.800"
                _dark={{ color: 'white' }}
              >
                {displayName}
              </Text>
              <Text
                fontSize="sm"
                color="coolGray.500"
                _dark={{ color: 'coolGray.300' }}
              >
                Motorista
              </Text>
              <Text
                mt="2"
                alignSelf="flex-start"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                color={driver?.active === 1 ? 'green.600' : 'red.500'}
                bg={driver?.active === 1 ? 'green.50' : 'red.50'}
              >
                {statusLabel(driver?.active) ?? 'Sem cadastro completo'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          bg="white"
          _dark={{ bg: 'coolGray.800' }}
          borderRadius="2xl"
          p="4"
          shadow="1"
          mb="3"
        >
          <Text
            fontSize="sm"
            fontWeight="700"
            color="coolGray.800"
            _dark={{ color: 'white' }}
            mb="3"
          >
            Conta
          </Text>
          <InfoRow label="Usuário" value={profile?.username ?? user?.username} />
          <InfoRow label="E-mail da conta" value={profile?.email} />
        </Box>

        {driver && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Informações Pessoais
            </Text>
            <InfoRow label="Nome completo" value={driver.name} />
            <InfoRow label="Nome da mãe" value={driver.motherName} />
            <InfoRow label="CPF" value={maskCPF(driver.cpf)} />
            <InfoRow label="RG" value={maskRG(driver.rg)} />
            <InfoRow
              label="Data de nascimento"
              value={formatDate(driver.birthDate)}
            />
            <InfoRow label="Telefone" value={maskPhone(driver.phone ?? '')} />
            <InfoRow label="E-mail" value={driver.email ?? undefined} />
          </Box>
        )}

        {driver && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Informações Profissionais
            </Text>
            <InfoRow label="CNH" value={driver.licenseNumber} />
            <InfoRow
              label="Tipo de contrato"
              value={contractTypeLabel(driver.contractType)}
            />
            <InfoRow label="Empresa" value={driver.companyName ?? undefined} />
            <InfoRow label="Salário" value={`R$ ${formatCurrency(driver.salary)}`} />
            <InfoRow label="Admissão" value={formatDate(driver.admissionDate)} />
            <InfoRow
              label="Rescisão"
              value={formatDate(driver.rescissionDate ?? undefined)}
            />
          </Box>
        )}

        {driver && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Endereço
            </Text>
            <InfoRow label="Endereço" value={driver.address} />
            <InfoRow label="Bairro" value={driver.neighborhood} />
            <InfoRow label="Cidade" value={driver.city} />
            <InfoRow label="CEP" value={maskCEP(driver.cep)} />
          </Box>
        )}

        <Box
          bg="white"
          _dark={{ bg: 'coolGray.800' }}
          borderRadius="2xl"
          p="4"
          shadow="1"
          mb="3"
        >
          <Text
            fontSize="sm"
            fontWeight="700"
            color="coolGray.800"
            _dark={{ color: 'white' }}
            mb="3"
          >
            Sistema
          </Text>
          <InfoRow label="ID do usuário" value={profile?.id} />
          <InfoRow label="Criado em" value={formatDateTime(profile?.createdAt)} />
          <InfoRow
            label="Última atualização"
            value={formatDateTime(profile?.updatedAt)}
          />
        </Box>

        <Pressable
          onPress={() =>
            Alert.alert('Sair', 'Deseja realmente sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: logout },
            ])
          }
          bg="red.50"
          _dark={{ bg: 'red.900' }}
          borderRadius="2xl"
          p="4"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <HStack alignItems="center" space={2}>
            <Icon
              as={Ionicons}
              name="log-out-outline"
              size="5"
              color="red.500"
            />
            <Text fontSize="sm" fontWeight="600" color="red.500">
              Sair da conta
            </Text>
          </HStack>
        </Pressable>
      </ScrollView>
    </Box>
  );
}
