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
import { usersApi } from '../../src/api/users';
import { User, UserRole } from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { useTheme } from '../../src/hooks/useTheme';
import {
  InfoRow,
  LoadingSpinner,
  TopRefreshButton,
} from '../../src/components/shared';

function roleLabel(role?: UserRole) {
  if (role === UserRole.ADMIN) return 'Administrador';
  if (role === UserRole.DRIVER) return 'Motorista';
  if (role === UserRole.STUDENT) return 'Aluno';
  return undefined;
}

function statusLabel(active?: number) {
  if (active == null) return undefined;
  return active === 1 ? 'Ativo' : 'Inativo';
}

function formatDateTime(value?: string) {
  if (!value) return undefined;
  return new Date(value).toLocaleString('pt-BR');
}

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const currentUser = await usersApi.getMe();
      setProfile(currentUser);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner color="admin.600" />;

  const displayName = profile?.username ?? user?.username ?? 'Administrador';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Meu Perfil" bg="#1E40AF" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="3">
          <TopRefreshButton
            onPress={load}
            bgColor="admin.600"
            pressedBgColor="admin.700"
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
              bg="admin.100"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl" fontWeight="800" color="admin.700">
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
                {roleLabel(profile?.role) ?? 'Administrador do sistema'}
              </Text>
              <Text
                mt="2"
                alignSelf="flex-start"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                color={profile?.active === 1 ? 'green.600' : 'red.500'}
                bg={profile?.active === 1 ? 'green.50' : 'red.50'}
              >
                {statusLabel(profile?.active) ?? 'Sem status'}
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
          <InfoRow label="E-mail" value={profile?.email} />
          <InfoRow label="Perfil" value={roleLabel(profile?.role)} />
          <InfoRow label="Status" value={statusLabel(profile?.active)} />
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
