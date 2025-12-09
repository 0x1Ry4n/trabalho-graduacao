import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Icon, FlatList, Pressable, Badge, Input,
  Modal, Button, FormControl, useToast, Select,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routesApi } from '../../../src/api/routes';
import { stopsApi } from '../../../src/api/stops';
import { driversApi } from '../../../src/api/drivers';
import { vehiclesApi } from '../../../src/api/vehicles';
import { Route, Driver, Vehicle, Stop, RoutePeriod } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, SearchModal, TopRefreshButton, SwipeDeleteItem } from '../../../src/components/shared';
import { maskTime } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';
import { NativeMap, MapMarker } from '../../../src/components/map/NativeMap';

function periodLabel(p: RoutePeriod) { return p === 'MORNING' ? 'Manha' : p === 'AFTERNOON' ? 'Tarde' : 'Noite'; }
function periodColor(p: RoutePeriod) { return p === 'MORNING' ? 'info' : p === 'AFTERNOON' ? 'warning' : 'coolGray'; }

const HEADER_COLOR = '#D97706';
const HEADER_PRESSED_COLOR = '#B45309';

function parseCoordinate(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinate(value: string) {
  const parsed = parseCoordinate(value);
  return parsed === null ? null : parsed.toFixed(6);
}

function createStopMarker(stop: Stop, index: number, total: number): MapMarker | null {
  const lat = parseCoordinate(stop.latitude);
  const lng = parseCoordinate(stop.longitude);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng,
    title: stop.name,
    color: index === 0 ? '#059669' : index === total - 1 ? '#DC2626' : '#1E40AF',
    label: String(index + 1),
  };
}

export default function RoutesListScreen() {
  const toast = useToast();
  const { error: createError, isLoading: saving, clearError, withFormError } = useFormError();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filtered, setFiltered] = useState<Route[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Search states
  const [showDriverSearch, setShowDriverSearch] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [showStopSearch, setShowStopSearch] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [stopSearch, setStopSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);

  // Create form
  const [name, setName] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [routeStops, setRouteStops] = useState<Stop[]>([]);

  const load = useCallback(async () => {
    try {
      const [routesData, driversData, vehiclesData, stopsData] = await Promise.all([
        routesApi.list(),
        driversApi.list(),
        vehiclesApi.list(),
        stopsApi.list(),
      ]);
      const visibleRoutes = routesData.filter((route) => !route.deletedAt);
      setRoutes(visibleRoutes);
      setFiltered(visibleRoutes);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setStops(stopsData);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as rotas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(routes);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(routes.filter((r) => r.name.toLowerCase().includes(q)));
  }, [search, routes]);

  const baseInputProps = {
    variant: 'filled',
    bg: 'coolGray.50',
    borderRadius: 'xl',
    borderColor: 'coolGray.300',
    _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } },
    _focus: { borderColor: 'admin.600', bg: 'white' },
    fontSize: 'sm',
  } as const;

  function resetForm() {
    setName('');
    setDriverId('');
    setVehicleId('');
    setStartTime('');
    setEndTime('');
    setEstimatedDuration('');
    setRouteStops([]);
    setSelectedDriver(null);
    setSelectedVehicle(null);
  }

  function addRouteStop(stop: Stop) {
    if (routeStops.some((routeStop) => routeStop.id === stop.id)) {
      toast.show({ description: 'Esta parada ja foi adicionada a rota.', placement: 'top' });
      return;
    }

    setRouteStops((current) => [...current, stop]);
    setShowStopSearch(false);
    setStopSearch('');
  }

  function removeRouteStop(stopId: string) {
    setRouteStops((current) => current.filter((stop) => stop.id !== stopId));
  }

  function moveRouteStop(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;

    setRouteStops((current) => {
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
  }

  const handleCreate = withFormError(async () => {
    if (!name.trim() || !driverId || !vehicleId || !startTime || !estimatedDuration) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (routeStops.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma parada para definir as coordenadas da rota.');
      return;
    }

    const firstStop = routeStops[0];
    const lastStop = routeStops[routeStops.length - 1];
    const startLatValue = formatCoordinate(firstStop.latitude);
    const startLongValue = formatCoordinate(firstStop.longitude);
    const endLatValue = formatCoordinate(lastStop.latitude);
    const endLongValue = formatCoordinate(lastStop.longitude);

    if (!startLatValue || !startLongValue || !endLatValue || !endLongValue) {
      Alert.alert('Atenção', 'A primeira e a última parada precisam ter coordenadas válidas.');
      return;
    }

    const createdRoute = await routesApi.create({
      name: name.trim(),
      driverId: parseInt(driverId, 10),
      vehicleId: parseInt(vehicleId, 10),
      startLat: startLatValue,
      startLong: startLongValue,
      endLat: endLatValue,
      endLong: endLongValue,
      startTime: startTime.trim(),
      endTime: endTime.trim() || undefined,
      estimatedDuration: parseInt(estimatedDuration, 10),
      active: 1,
    });

    await Promise.all(routeStops.map((stop, index) => (
      routesApi.addStop(createdRoute.id, stop.id, index + 1, 0)
    )));

    resetForm();
    setShowCreate(false);
    toast.show({ description: 'Rota criada com sucesso!', placement: 'top' });
    load();
  });

  function confirmDelete(route: Route) {
    Alert.alert('Excluir rota', `Deseja realmente excluir ${route.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await routesApi.delete(route.id);
            setRoutes((current) => current.filter((item) => item.id !== route.id));
            toast.show({ description: 'Rota excluida.', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Nao foi possivel excluir a rota.');
          }
        },
      },
    ]);
  }

  const availableStops = stops.filter((stop) => !routeStops.some((routeStop) => routeStop.id === stop.id));
  const createRouteMarkers = routeStops
    .map((stop, index) => createStopMarker(stop, index, routeStops.length))
    .filter(Boolean) as MapMarker[];

  if (loading) return <LoadingSpinner color="amber.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Rotas"
        subtitle={`${filtered.length} rotas`}
        bg={HEADER_COLOR}
        rightContent={
          <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
            <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
          </Pressable>
        }
      />

      {searchVisible && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nome da rota..." />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
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
          <Pressable onPress={() => router.push(`/(admin)/routes/${item.id}`)}>
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
              <HStack alignItems="center" space={3}>
                <Box w="11" h="11" borderRadius="xl" bg="amber.50" alignItems="center" justifyContent="center">
                  <Icon as={Ionicons} name="map-outline" size="5" color="amber.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} numberOfLines={1}>{item.name}</Text>
                  {item.startTime && <Text fontSize="xs" color="coolGray.500">Saída: {item.startTime}</Text>}
                  {item.endTime && <Text fontSize="xs" color="coolGray.500">Chegada: {item.endTime}</Text>}
                  {item.driver && <Text fontSize="xs" color="coolGray.400">Motorista: {item.driver.name}</Text>}
                </VStack>
                <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
              </HStack>
            </Box>
          </Pressable>
          </SwipeDeleteItem>
        )}
        ListEmptyComponent={<EmptyState icon="map-outline" message="Nenhuma rota encontrada" />}
      />

      <AddFab onPress={() => { resetForm(); setShowCreate(true); }} bg={HEADER_COLOR} pressedBg={HEADER_PRESSED_COLOR} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>
            <Text fontSize="lg" fontWeight="700">Nova rota</Text>
          </Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <ErrorDisplay error={createError} onDismiss={clearError} />
              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">ROTA</Text>
              <FormControl isRequired>
                <FormControl.Label>Nome da rota</FormControl.Label>
                <Input value={name} onChangeText={setName} placeholder="Ex: Rota Centro - Bairro Alta" />
              </FormControl>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">VINCULAÇÃO</Text>
              <FormControl isRequired>
                <FormControl.Label>Motorista</FormControl.Label>
                <HStack space={2}>
                  <Input
                    flex={1}
                    placeholder="ID do motorista"
                    value={driverId}
                    isReadOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="admin"
                    onPress={() => setShowDriverSearch(true)}
                    borderRadius="xl"
                  >
                    <Icon as={Ionicons} name="search" size="4" />
                  </Button>
                </HStack>
                {selectedDriver && (
                  <Text fontSize="xs" color="coolGray.500" mt="1">
                    {selectedDriver.name}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormControl.Label>Veículo</FormControl.Label>
                <HStack space={2}>
                  <Input
                    flex={1}
                    placeholder="ID do veículo"
                    value={vehicleId}
                    isReadOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="admin"
                    onPress={() => setShowVehicleSearch(true)}
                    borderRadius="xl"
                  >
                    <Icon as={Ionicons} name="search" size="4" />
                  </Button>
                </HStack>
                {selectedVehicle && (
                  <Text fontSize="xs" color="coolGray.500" mt="1">
                    {selectedVehicle.plate} - {selectedVehicle.model}
                  </Text>
                )}
              </FormControl>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">HORÁRIOS</Text>
              <FormControl isRequired>
                <FormControl.Label>Hora de saída</FormControl.Label>
                <Input value={startTime} onChangeText={(v) => setStartTime(maskTime(v))} placeholder="HH:MM" keyboardType="numeric" />
              </FormControl>

              <FormControl>
                <FormControl.Label>Hora de chegada</FormControl.Label>
                <Input value={endTime} onChangeText={(v) => setEndTime(maskTime(v))} placeholder="HH:MM" keyboardType="numeric" />
              </FormControl>

              <FormControl isRequired>
                <FormControl.Label>Duração estimada (minutos)</FormControl.Label>
                <Input value={estimatedDuration} onChangeText={setEstimatedDuration} keyboardType="numeric" placeholder="Ex: 45" />
              </FormControl>

              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">PARADAS</Text>
              <FormControl isRequired>
                <FormControl.Label>Paradas da rota</FormControl.Label>
                <Button
                  variant="outline"
                  colorScheme="admin"
                  onPress={() => setShowStopSearch(true)}
                  borderRadius="xl"
                  leftIcon={<Icon as={Ionicons} name="add" size="4" />}
                >
                  Adicionar parada
                </Button>
              </FormControl>

              {routeStops.length > 0 ? (
                <VStack space={2}>
                  {routeStops.map((stop, index) => (
                    <HStack key={stop.id} alignItems="center" space={2} bg="coolGray.50" _dark={{ bg: 'coolGray.800' }} p="2" borderRadius="lg">
                      <Box w="7" h="7" borderRadius="full" bg={index === 0 ? 'green.500' : index === routeStops.length - 1 ? 'red.500' : 'blue.600'} alignItems="center" justifyContent="center">
                        <Text color="white" fontSize="xs" fontWeight="700">{index + 1}</Text>
                      </Box>
                      <VStack flex={1}>
                        <Text fontSize="sm" fontWeight="600" numberOfLines={1}>{stop.name}</Text>
                        <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>{stop.address}</Text>
                      </VStack>
                      <HStack space={1}>
                        <Pressable onPress={() => moveRouteStop(index, -1)} isDisabled={index === 0} opacity={index === 0 ? 0.35 : 1} p="1">
                          <Icon as={Ionicons} name="arrow-up" size="4" color="coolGray.500" />
                        </Pressable>
                        <Pressable onPress={() => moveRouteStop(index, 1)} isDisabled={index === routeStops.length - 1} opacity={index === routeStops.length - 1 ? 0.35 : 1} p="1">
                          <Icon as={Ionicons} name="arrow-down" size="4" color="coolGray.500" />
                        </Pressable>
                        <Pressable onPress={() => removeRouteStop(stop.id)} p="1">
                          <Icon as={Ionicons} name="trash-outline" size="4" color="red.500" />
                        </Pressable>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="xs" color="coolGray.400">A primeira parada define as coordenadas iniciais. A última define as coordenadas finais.</Text>
              )}

              <Box mt="2">
                <Text fontSize="xs" fontWeight="700" color="coolGray.500" mb="2">MARCADORES DA ROTA</Text>
                <NativeMap
                  markers={createRouteMarkers}
                  height={220}
                  interactive
                  title="Marcadores da rota"
                  subtitle={routeStops.length ? 'A primeira parada e o inicio da rota' : 'Adicione paradas para visualizar'}
                  accentColor={HEADER_COLOR}
                />
              </Box>
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="amber" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} colorScheme="amber" onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Rota</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <SearchModal<Driver>
        isOpen={showDriverSearch}
        onClose={() => { setShowDriverSearch(false); setDriverSearch(''); }}
        title="Selecionar Motorista"
        placeholder="Buscar por nome do motorista..."
        items={drivers}
        search={driverSearch}
        onSearch={setDriverSearch}
        filterFn={(d, q) => d.name.toLowerCase().includes(q)}
        keyExtractor={(d) => String(d.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => { setDriverId(item.id.toString()); setSelectedDriver(item); setShowDriverSearch(false); setDriverSearch(''); }}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.name}</Text>
              <Text fontSize="sm" color="coolGray.500">{item.email}</Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="person-outline"
        emptyMessage="Nenhum motorista encontrado"
      />

      <SearchModal<Vehicle>
        isOpen={showVehicleSearch}
        onClose={() => { setShowVehicleSearch(false); setVehicleSearch(''); }}
        title="Selecionar Veículo"
        placeholder="Buscar por placa ou modelo..."
        items={vehicles}
        search={vehicleSearch}
        onSearch={setVehicleSearch}
        filterFn={(v, q) => v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)}
        keyExtractor={(v) => String(v.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => { setVehicleId(item.id.toString()); setSelectedVehicle(item); setShowVehicleSearch(false); setVehicleSearch(''); }}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.plate} - {item.model}</Text>
              <Text fontSize="sm" color="coolGray.500">Capacidade: {item.capacity}</Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="car-outline"
        emptyMessage="Nenhum veículo encontrado"
      />

      <SearchModal<Stop>
        isOpen={showStopSearch}
        onClose={() => { setShowStopSearch(false); setStopSearch(''); }}
        title="Selecionar Parada"
        placeholder="Buscar por nome, bairro ou endereco..."
        items={availableStops}
        search={stopSearch}
        onSearch={setStopSearch}
        filterFn={(s, q) => (
          s.name.toLowerCase().includes(q)
          || s.neighborhood.toLowerCase().includes(q)
          || s.address.toLowerCase().includes(q)
        )}
        keyExtractor={(s) => String(s.id)}
        renderItem={(item) => (
          <Pressable
            onPress={() => addRouteStop(item)}
            p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
          >
            <VStack>
              <Text fontWeight="600">{item.name}</Text>
              <Text fontSize="sm" color="coolGray.500">{item.address}</Text>
              <Text fontSize="xs" color="coolGray.400">
                {item.latitude}, {item.longitude}
              </Text>
            </VStack>
          </Pressable>
        )}
        emptyIcon="location-outline"
        emptyMessage="Nenhuma parada encontrada"
      />
    </Box>
  );
}
