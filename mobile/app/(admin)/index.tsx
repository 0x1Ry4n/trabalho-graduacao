import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, Pressable, Icon, ScrollView, Spinner,
  useColorModeValue,
} from 'native-base';
import { RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { studentsApi } from '../../src/api/students';
import { driversApi } from '../../src/api/drivers';
import { collegesApi } from '../../src/api/colleges';
import { usersApi } from '../../src/api/users';
import { routesApi } from '../../src/api/routes';
import { paymentsApi } from '../../src/api/payments';
import { AccountStatus } from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TopRefreshButton } from '../../src/components/shared';

interface DashboardStats {
  totalUsers: number;
  totalColleges: number;
  totalStudents: number;
  totalDrivers: number;
  activeRoutes: number;
  pendingPayments: number;
}

const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Usuários', icon: 'people-circle', color: '#0e66f3', route: '/(admin)/users' },
  { key: 'totalColleges', label: 'Instituições', icon: 'school', color: '#8B5CF6', route: '/(admin)/colleges' },
  { key: 'totalStudents', label: 'Alunos', icon: 'people', color: '#1E40AF', route: '/(admin)/students' },
  { key: 'totalDrivers', label: 'Motoristas', icon: 'person', color: '#059669', route: '/(admin)/drivers' },
  { key: 'activeRoutes', label: 'Rotas', icon: 'map', color: '#7C3AED', route: '/(admin)/routes' },
  { key: 'pendingPayments', label: 'Pendentes', icon: 'alert-circle', color: '#F59E0B', route: '/(admin)/payments' },
] as const;

const QUICK_ACTIONS = [
  { icon: 'people-outline', label: 'Gerenciar Usuários', route: '/(admin)/users' },
  { icon: 'people-outline', label: 'Gerenciar Alunos', route: '/(admin)/students' },
  { icon: 'bus-outline', label: 'Gerenciar Veículos', route: '/(admin)/vehicles' },
  { icon: 'location-outline', label: 'Gerenciar Paradas', route: '/(admin)/stops' },
  { icon: 'cash-outline', label: 'Ver Cobranças', route: '/(admin)/payments' },
  { icon: 'document-text-outline', label: 'Logs Auditoria', route: '/(admin)/audit-logs' },
] as const;

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cardBg = useColorModeValue('white', 'coolGray.800');

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const [users, colleges, students, drivers, routes, payments] = await Promise.allSettled([
        usersApi.list(), collegesApi.list(), studentsApi.list(), driversApi.list(), routesApi.list(), paymentsApi.list(),
      ]);
      setStats({
        totalUsers: users.status === 'fulfilled' ? users.value.length : 0,
        totalColleges: colleges.status === 'fulfilled' ? colleges.value.length : 0,
        totalStudents: students.status === 'fulfilled' ? students.value.length : 0,
        totalDrivers: drivers.status === 'fulfilled' ? drivers.value.length : 0,
        activeRoutes: routes.status === 'fulfilled' ? routes.value.length : 0,
        pendingPayments: payments.status === 'fulfilled'
          ? payments.value.filter((p) => p.status === AccountStatus.OPEN).length : 0,
      });
    } catch {
      setStats({ totalUsers: 0, totalColleges: 0, totalStudents: 0, totalDrivers: 0, activeRoutes: 0, pendingPayments: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.100">
        <Spinner size="lg" color="admin.600" />
        <Text mt="3" color="coolGray.500">Carregando painel...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="coolGray.100" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Painel" subtitle={`Olá, ${user?.username}`} />

      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="3">
          <TopRefreshButton
            onPress={loadStats}
            bgColor="admin.600"
            pressedBgColor="admin.700"
          />
        </Box>

        {/* Stats Grid */}
        <Text fontSize="md" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
          Resumo Geral
        </Text>
        <HStack flexWrap="wrap" space={0} justifyContent="space-between" mb="5" >
          {STAT_CONFIG.map(({ key, label, icon, color, route }) => (
            <Pressable
              key={key}
              w="50%"
              p="1"
              onPress={() => router.push(route as any)}
            >
              <Box bg={cardBg} borderRadius="2xl" p="4" shadow="2" borderWidth={1} borderColor="coolGray.100" _dark={{ borderColor: 'coolGray.700' }}>
                <Box w="10" h="10" borderRadius="lg" bg="coolGray.100" _dark={{ bg: 'coolGray.700' }} alignItems="center" justifyContent="center" mb="3">
                  <Icon as={Ionicons} name={icon as any} size="5" color={color} />
                </Box>
                <Text fontSize="3xl" fontWeight="800" color={color}>
                  {stats?.[key as keyof DashboardStats] ?? 0}
                </Text>
                <Text fontSize="xs" fontWeight="600" color="coolGray.500" mt="1">
                  {label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>

        {/* Quick Actions */}
        <Text fontSize="md" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
          Acesso Rápido
        </Text>
        <Box bg={cardBg} borderRadius="2xl" shadow="2" overflow="hidden">
          {QUICK_ACTIONS.map(({ icon, label, route }, i) => (
            <Pressable
              key={route}
              onPress={() => router.push(route as any)}
              _pressed={{ bg: 'admin.50' }}
              px="4"
              py="4"
              borderBottomWidth={i < QUICK_ACTIONS.length - 1 ? 1 : 0}
              borderBottomColor="coolGray.100"
              _dark={{ borderBottomColor: 'coolGray.700' }}
            >
              <HStack alignItems="center" space={3}>
                <Box w="9" h="9" borderRadius="lg" bg="admin.50" alignItems="center" justifyContent="center">
                  <Icon as={Ionicons} name={icon as any} size="5" color="admin.600" />
                </Box>
                <Text flex={1} fontSize="sm" fontWeight="500" color="coolGray.800" _dark={{ color: 'coolGray.200' }}>
                  {label}
                </Text>
                <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
              </HStack>
            </Pressable>
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}
