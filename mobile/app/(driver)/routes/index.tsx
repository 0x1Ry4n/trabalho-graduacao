import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Text,
  Icon,
  VStack,
  Pressable,
} from 'native-base';
import { RefreshControl, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { routesApi } from '../../../src/api/routes';
import { driversApi } from '../../../src/api/drivers';
import { Route, RouteStop } from '../../../src/types';
import { useAuthStore } from '../../../src/store/auth.store';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LoadingSpinner, EmptyState, TopRefreshButton } from '../../../src/components/shared';
import { formatRouteWindow } from '../../../src/utils/routeSchedule.utils';

type DriverRouteView = Route & {
  routeStops?: RouteStop[];
};

export default function DriverRoutesScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [routes, setRoutes] = useState<DriverRouteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [all, drivers] = await Promise.all([
        routesApi.list(),
        driversApi.list(),
      ]);
      const driver = drivers.find((d) => d.userId === Number(user?.id));

      const mine = driver
        ? all.filter(
          (r) =>
            r.driverId === Number(driver.id) ||
            r.driver?.id === driver.id
        )
        : all;

      const views = await Promise.all(mine.map(async (route) => {
        try {
          const routeStops = await routesApi.getStops(route.id);
          return { ...route, routeStops };
        } catch {
          return { ...route, routeStops: [] };
        }
      }));

      setRoutes(views);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as rotas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleOpenRoute(routeId: string) {
    router.push({
      pathname: '/(driver)/routes/[id]',
      params: { id: routeId },
    });
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner color="driver.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Minhas Rotas"
        subtitle={`${routes.length} rotas`}
        bg="#059669"
      />

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <Box mb="3">
            <TopRefreshButton
              onPress={load}
              bgColor="driver.600"
              pressedBgColor="driver.700"
            />
          </Box>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleOpenRoute(item.id)}>
            {({ isPressed }) => (
              <Box
                bg="white"
                _dark={{ bg: 'coolGray.800' }}
                borderRadius="xl"
                p="4"
                mb="2"
                shadow="1"
                borderWidth={1}
                borderColor="coolGray.100"
                style={{ opacity: isPressed ? 0.85 : 1 }}
              >
                <HStack alignItems="center" space={3}>
                  <Box
                    w="12"
                    h="12"
                    borderRadius="xl"
                    bg="driver.50"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={Ionicons} name="bus" size="5" color="driver.600" />
                  </Box>

                  <VStack flex={1}>
                    <Text
                      fontSize="md"
                      fontWeight="800"
                      color="coolGray.800"
                      _dark={{ color: 'coolGray.100' }}
                    >
                      {item.name}
                    </Text>

                    <Text fontSize="xs" color="coolGray.500">
                      Saída: {item.startTime}
                      {item.endTime ? ` · Chegada: ${item.endTime}` : ''}
                    </Text>

                    {item.vehicle && (
                      <Text fontSize="xs" color="coolGray.400">
                        Veículo: {item.vehicle.plate}
                      </Text>
                    )}

                    <Text fontSize="xs" color={item.active ? 'emerald.600' : 'coolGray.400'}>
                      {item.active ? 'Ativa' : 'Inativa'}
                    </Text>

                    <HStack space={2} mt="2">
                      <Box bg="driver.50" borderRadius="lg" px="2.5" py="1">
                        <Text fontSize="2xs" color="driver.700" fontWeight="800">
                          {item.routeStops?.length ?? 0} paradas
                        </Text>
                      </Box>
                      <Box bg="coolGray.100" borderRadius="lg" px="2.5" py="1">
                        <Text fontSize="2xs" color="coolGray.600" fontWeight="700">
                          {formatRouteWindow(item)}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>

                  <Icon as={Ionicons} name="chevron-forward" size="5" color="coolGray.400" />
                </HStack>
                <HStack space={2} mt="3">
                  <Box flex={1} bg="coolGray.50" borderRadius="xl" p="3">
                    <Text fontSize="2xs" color="coolGray.500">Inicio</Text>
                    <Text fontSize="xs" fontWeight="800" color="coolGray.800" numberOfLines={1}>
                      {item.routeStops?.[0]?.name ?? 'Sem parada'}
                    </Text>
                  </Box>
                  <Box flex={1} bg="coolGray.50" borderRadius="xl" p="3">
                    <Text fontSize="2xs" color="coolGray.500">Fim</Text>
                    <Text fontSize="xs" fontWeight="800" color="coolGray.800" numberOfLines={1}>
                      {item.routeStops?.[(item.routeStops?.length ?? 0) - 1]?.name ?? 'Sem parada'}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="map-outline" message="Nenhuma rota atribuída" />
        }
      />
    </Box>
  );
}
