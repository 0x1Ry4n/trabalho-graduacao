import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Pressable,
  ScrollView,
  Modal,
  Button,
  Select,
  useToast,
  Divider,
} from 'native-base';
import { RefreshControl, Alert, FlatList, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studentRoutesApi } from '../../src/api/studentRoutes';
import { routesApi } from '../../src/api/routes';
import { routeStopsApi } from '../../src/api/routeStops';
import { useAuthStore } from '../../src/store/auth.store';
import {
  Route, Stop, RoutePeriod, StudentRoute, Student, RouteStop,
} from '../../src/types';
import { NativeMap, MapMarker } from '../../src/components/map/NativeMap';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { LoadingSpinner, EmptyState, TopRefreshButton } from '../../src/components/shared';
import { studentsApi } from '../../src/api/students';
import {
  formatRouteWindow,
  getStopOffsetMinutes,
  getStopPassTime,
  periodColor,
  periodLabel,
} from '../../src/utils/routeSchedule.utils';

type StudentRouteView = {
  assignment: StudentRoute;
  route: Route | null;
  stop: Stop | null;
  stops: RouteStop[];
};

type AvailableRouteView = {
  route: Route;
  stops: RouteStop[];
};

function formatDate(date?: string | null) {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '-';
}

function getStopLatitude(stop: Stop) {
  return Number((stop as any).latitude ?? (stop as any).lat ?? 0);
}

function getStopLongitude(stop: Stop) {
  return Number((stop as any).longitude ?? (stop as any).lng ?? 0);
}

function normalizeStops(value: unknown): RouteStop[] {
  if (Array.isArray(value)) return value as RouteStop[];

  if (value && typeof value === 'object') {
    const data = (value as any).data;
    const stops = (value as any).stops;

    if (Array.isArray(data)) return data as RouteStop[];
    if (Array.isArray(stops)) return stops as RouteStop[];
  }

  return [];
}

function createMarkers(stops: RouteStop[], fallbackStop?: Stop | null): MapMarker[] {
  const source = stops.length ? stops : fallbackStop ? [fallbackStop] : [];

  return source
    .map((stop, index) => {
      const lat = getStopLatitude(stop);
      const lng = getStopLongitude(stop);

      if (!lat || !lng) return null;

      return {
        lat,
        lng,
        title: `Parada ${index + 1}: ${stop.name || `Parada ${index + 1}`}`,
        color: index === 0 ? '#059669' : index === source.length - 1 ? '#DC2626' : '#1E40AF',
        label: String(index + 1),
      };
    })
    .filter(Boolean) as MapMarker[];
}

function createSelectableMarkers(stops: RouteStop[], selectedStopId: string): MapMarker[] {
  return stops
    .map((stop, index) => {
      const lat = getStopLatitude(stop);
      const lng = getStopLongitude(stop);

      if (!lat || !lng) return null;

      const isSelected = String(stop.routeStopId) === selectedStopId;

      return {
        lat,
        lng,
        title: `Parada ${index + 1}: ${stop.name || `Parada ${index + 1}`}`,
        color: isSelected ? '#059669' : index === 0 ? '#059669' : index === stops.length - 1 ? '#DC2626' : '#1E40AF',
        label: String(index + 1),
      };
    })
    .filter(Boolean) as MapMarker[];
}

function getRouteStopId(stop: RouteStop) {
  return String(stop.routeStopId ?? '');
}

function inferPeriod(startTime?: string): RoutePeriod {
  const hour = Number((startTime ?? '').slice(0, 2));

  if (Number.isNaN(hour)) return 'MORNING';
  if (hour < 12) return 'MORNING';
  if (hour < 18) return 'AFTERNOON';
  return 'NIGHT';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatRouteTime(route: Route) {
  return `Horario: ${formatRouteWindow(route)}`;
}

async function openRouteInMaps(markers: MapMarker[]) {
  if (!markers.length) {
    Alert.alert('Mapa indisponivel', 'Esta rota ainda nao possui coordenadas para abrir no Maps.');
    return;
  }

  const [origin] = markers;
  const destination = markers[markers.length - 1];
  const waypoints = markers.slice(1, -1);
  const params = [
    'api=1',
    `origin=${origin.lat},${origin.lng}`,
    `destination=${destination.lat},${destination.lng}`,
    waypoints.length ? `waypoints=${waypoints.map((m) => `${m.lat},${m.lng}`).join('|')}` : '',
    'travelmode=driving',
  ].filter(Boolean).join('&');

  await Linking.openURL(`https://www.google.com/maps/dir/?${params}`);
}

export default function StudentRoutesScreen() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [items, setItems] = useState<StudentRouteView[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<AvailableRouteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewRoute, setPreviewRoute] = useState<AvailableRouteView | null>(null);
  const [selectedRouteDetails, setSelectedRouteDetails] = useState<StudentRouteView | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [editingStopId, setEditingStopId] = useState<string>('');
  const [addingRoute, setAddingRoute] = useState(false);
  const [updatingStop, setUpdatingStop] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const me = await studentsApi.getByUserId(String(user?.id ?? ''));
      setStudent(me);

      if (!me) {
        setItems([]);
        setAvailableRoutes([]);
        return;
      }

      const [assignments, allRoutes] = await Promise.all([
        studentRoutesApi.getByStudent(me.id),
        routesApi.list(),
      ]);
      const activeAssignments = assignments.filter((assignment) => assignment.active === 1);

      const routeViews = await Promise.all(activeAssignments.map(async (assignment) => {
        const routeStopLink = await routeStopsApi.getById(assignment.routeStopId);
        const [routeResult, stopsResult] = await Promise.allSettled([
          routesApi.getById(routeStopLink.routeId),
          routesApi.getStops(routeStopLink.routeId),
        ]);
        const stops = stopsResult.status === 'fulfilled' ? normalizeStops(stopsResult.value) : [];
        const stop = stops.find((item) => String(item.routeStopId) === String(assignment.routeStopId))
          ?? stops.find((item) => String(item.id) === String(routeStopLink.stopId))
          ?? null;

        return {
          assignment,
          route: routeResult.status === 'fulfilled' ? routeResult.value : null,
          stop,
          stops,
        };
      }));

      const assignedRouteIds = new Set(routeViews.map((item) => String(item.route?.id ?? '')));
      const activeAvailableRoutes = allRoutes.filter(
        (route) => route.active === 1 && !assignedRouteIds.has(String(route.id)),
      );
      const availableViews = await Promise.all(activeAvailableRoutes.map(async (route) => {
        const stopsResult = await Promise.allSettled([routesApi.getStops(route.id)]);
        const stops = stopsResult[0].status === 'fulfilled' ? normalizeStops(stopsResult[0].value) : [];
        return { route, stops };
      }));

      setItems(routeViews);
      setAvailableRoutes(availableViews.filter((item) => item.stops.length > 0));
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as rotas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handlePreview(routeView: AvailableRouteView) {
    setPreviewRoute(routeView);
    setSelectedStopId(routeView.stops[0] ? getRouteStopId(routeView.stops[0]) : '');
  }

  function handleOpenAddedRoute(routeView: StudentRouteView) {
    setSelectedRouteDetails(routeView);
    setEditingStopId(String(routeView.assignment.routeStopId));
  }

  async function handleUpdateStudentStop() {
    if (!selectedRouteDetails || !editingStopId) return;

    setUpdatingStop(true);
    try {
      const updatedAssignment = await studentRoutesApi.update(selectedRouteDetails.assignment.id, {
        routeStopId: Number(editingStopId),
      });
      const updatedStop = selectedRouteDetails.stops.find((stop) => String(stop.routeStopId) === String(editingStopId)) ?? null;
      const updatedView = {
        ...selectedRouteDetails,
        assignment: updatedAssignment,
        stop: updatedStop,
      };

      setSelectedRouteDetails(updatedView);
      setItems((current) => current.map((item) => (
        item.assignment.id === updatedAssignment.id ? updatedView : item
      )));
      toast.show({ description: 'Parada de embarque atualizada.', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel alterar a parada desta rota.');
    } finally {
      setUpdatingStop(false);
    }
  }

  async function handleAddRoute() {
    if (!student || !previewRoute || !selectedStopId) return;

    setAddingRoute(true);
    try {
      await studentRoutesApi.create({
        studentId: Number(student.id),
        routeStopId: Number(selectedStopId),
        routePeriod: inferPeriod(previewRoute.route.startTime),
        departureTime: previewRoute.route.startTime,
        returnTime: previewRoute.route.endTime ?? previewRoute.route.startTime,
        startDate: todayIsoDate(),
        active: 1,
      });

      toast.show({ description: 'Rota adicionada com sucesso', placement: 'top' });
      setPreviewRoute(null);
      setSelectedStopId('');
      await load();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel adicionar esta rota.');
    } finally {
      setAddingRoute(false);
    }
  }

  if (loading) return <LoadingSpinner color="student.600" />;

  const selectedRouteMarkers = createMarkers(selectedRouteDetails?.stops ?? [], selectedRouteDetails?.stop);
  const previewMarkers = previewRoute ? createSelectableMarkers(previewRoute.stops, selectedStopId) : [];
  const selectedPreviewStop = previewRoute?.stops.find((stop) => String(stop.routeStopId) === selectedStopId) ?? null;

  const availableHeader = (
    <VStack space={3} mb="3">
      <TopRefreshButton onPress={load} />

      <Box>
        <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'coolGray.100' }} mb="2">
          Rotas disponíveis
        </Text>

        {availableRoutes.length === 0 ? (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="4" shadow="1">
            <Text fontSize="xs" color="coolGray.500">
              Nenhuma rota disponível para adicionar no momento.
            </Text>
          </Box>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableRoutes.map((item) => (
              <Pressable key={item.route.id} onPress={() => handlePreview(item)} mr="2">
                <Box w="72" bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1" borderWidth={1} borderColor="coolGray.100">
                  <VStack space={3}>
                    <HStack alignItems="center" space={3}>
                      <Box w="10" h="10" borderRadius="xl" bg="student.50" alignItems="center" justifyContent="center">
                        <Icon as={Ionicons} name="map-outline" size="5" color="student.600" />
                      </Box>
                      <VStack flex={1}>
                        <Text fontSize="sm" fontWeight="800" numberOfLines={1} color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                          {item.route.name}
                        </Text>
                        <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>
                          {item.stops.length} parada(s) | {formatRouteWindow(item.route)}
                        </Text>
                      </VStack>
                      <Icon as={Ionicons} name="chevron-forward" size="5" color="coolGray.400" />
                    </HStack>
                    <HStack space={2}>
                      <Box flex={1} bg="coolGray.50" borderRadius="lg" p="2">
                        <Text fontSize="2xs" color="coolGray.500">Primeira parada</Text>
                        <Text fontSize="xs" fontWeight="700" color="coolGray.800" numberOfLines={1}>
                          {item.stops[0]?.name ?? 'A definir'}
                        </Text>
                      </Box>
                      <Box bg="student.50" borderRadius="lg" px="3" justifyContent="center">
                        <Text fontSize="xs" fontWeight="800" color="student.700">
                          {formatRouteWindow(item.route).split(' - ')[0]}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Box>

      <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
        Minhas rotas
      </Text>
    </VStack>
  );

  const renderRouteCard = ({ item }: { item: StudentRouteView }) => {
    const markers = createMarkers(item.stops, item.stop);
    const selectedStop = item.stops.find((stop) => String(stop.routeStopId) === String(item.assignment.routeStopId)) ?? item.stop;
    const selectedStopTime = selectedStop ? getStopPassTime(item.route, selectedStop, item.assignment.departureTime) : item.assignment.departureTime;

    return (
      <Pressable onPress={() => handleOpenAddedRoute(item)}>
        <Box
          bg="white"
          _dark={{ bg: "coolGray.800" }}
          borderRadius="2xl"
          p={4}
          mb={3}
          shadow={2}
          borderWidth={1}
          borderColor="coolGray.100"
        >
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space={1}>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="coolGray.800"
                  _dark={{ color: "coolGray.100" }}
                  numberOfLines={1}
                >
                  {item.route?.name ?? "Rota"}
                </Text>

                <HStack space={4} alignItems="center">
                  <VStack space={0.5}>
                    <Text
                      fontSize="2xs"
                      color="coolGray.400"
                      fontWeight="medium"
                    >
                      SAÍDA
                    </Text>

                    <Text
                      fontSize="sm"
                      color="coolGray.700"
                      _dark={{ color: "coolGray.200" }}
                      fontWeight="semibold"
                    >
                      {item.assignment.departureTime}
                    </Text>
                  </VStack>

                  <VStack space={0.5}>
                    <Text
                      fontSize="2xs"
                      color="coolGray.400"
                      fontWeight="medium"
                    >
                      VOLTA
                    </Text>

                    <Text
                      fontSize="sm"
                      color="coolGray.700"
                      _dark={{ color: "coolGray.200" }}
                      fontWeight="semibold"
                    >
                      {item.assignment.returnTime}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              <VStack alignItems="flex-end" space={3}>
                <Badge
                  colorScheme={periodColor(item.assignment.routePeriod)}
                  borderRadius="full"
                  px={3}
                  py={1}
                  variant="subtle"
                >
                  <Text fontSize="2xs" fontWeight="bold">
                    {periodLabel(item.assignment.routePeriod)}
                  </Text>
                </Badge>

                <Pressable
                  onPress={() => openRouteInMaps(markers)}
                  p={2}
                  borderRadius="full"
                  bg="student.50"
                  _pressed={{ opacity: 0.7 }}
                >
                  <Icon
                    as={Ionicons}
                    name="navigate-outline"
                    size={5}
                    color="student.600"
                  />
                </Pressable>
              </VStack>
            </HStack>

            <Box
              bg="student.50"
              borderRadius="xl"
              px={4}
              py={3}
              borderWidth={1}
              borderColor="student.100"
            >
              <VStack space={1}>
                <Text
                  fontSize="2xs"
                  color="student.700"
                  fontWeight="bold"
                  letterSpacing={0.5}
                >
                  SUA PARADA
                </Text>

                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="student.800"
                  numberOfLines={1}
                >
                  {selectedStop?.name ?? "Parada não definida"}
                </Text>

                <HStack alignItems="center" space={1}>
                  <Icon
                    as={Ionicons}
                    name="time-outline"
                    size={3}
                    color="student.700"
                  />

                  <Text fontSize="xs" color="student.700">
                    Passa às {selectedStopTime}h
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Minhas Rotas"
        subtitle={`${items.length} rotas`}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.assignment.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={availableHeader}
        renderItem={renderRouteCard}
        ListEmptyComponent={<EmptyState icon="map-outline" message="Nenhuma rota adicionada" />}
      />

      <Modal isOpen={!!selectedRouteDetails} onClose={() => setSelectedRouteDetails(null)} size="full">
        <Modal.Content maxH="92%">
          <Modal.CloseButton />
          <Modal.Header>{selectedRouteDetails?.route?.name ?? 'Rota adicionada'}</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Box borderRadius="xl" overflow="hidden">
                {selectedRouteMarkers.length ? (
                  <NativeMap
                    markers={selectedRouteMarkers}
                    height={320}
                    interactive
                    onOpenMaps={() => openRouteInMaps(selectedRouteMarkers)}
                    openMapsDisabled={!selectedRouteMarkers.length}
                    title="Mapa da rota"
                    subtitle={`${selectedRouteMarkers.length} parada(s) no trajeto`}
                    accentColor="#1E40AF"
                  />
                ) : (
                  <EmptyState icon="location-outline" message="Nenhuma coordenada cadastrada para esta rota." />
                )}
              </Box>

              {selectedRouteDetails && (
                <VStack
                  space={3}
                  bg="white"
                  borderRadius="xl"
                  p={4}
                  borderWidth={1}
                  borderColor="coolGray.200"
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="xs" color="coolGray.400" fontWeight="medium">
                      SAÍDA
                    </Text>

                    <Text fontSize="sm" color="coolGray.700" fontWeight="semibold">
                      {selectedRouteDetails.assignment.departureTime}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="xs" color="coolGray.400" fontWeight="medium">
                      VOLTA
                    </Text>

                    <Text fontSize="sm" color="coolGray.700" fontWeight="semibold">
                      {selectedRouteDetails.assignment.returnTime}
                    </Text>
                  </HStack>

                  {selectedRouteDetails.stop ? (
                    <HStack justifyContent="space-between" alignItems="flex-start">
                      <Text fontSize="xs" color="coolGray.400" fontWeight="medium">
                        EMBARQUE
                      </Text>

                      <Text
                        flex={1}
                        textAlign="right"
                        fontSize="sm"
                        color="coolGray.700"
                        fontWeight="semibold"
                      >
                        {selectedRouteDetails.stop.name}
                      </Text>
                    </HStack>
                  ) : null}

                  <Divider bg="coolGray.200" />

                  <VStack space={1}>
                    <Text fontSize="xs" color="coolGray.400" fontWeight="medium">
                      VIGÊNCIA
                    </Text>

                    <Text fontSize="sm" color="coolGray.700" fontWeight="semibold">
                      {formatDate(selectedRouteDetails.assignment.startDate)} até{" "}
                      {formatDate(selectedRouteDetails.assignment.endDate)}
                    </Text>
                  </VStack>
                </VStack>
              )}



              {selectedRouteDetails ? (
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="4" borderWidth={1} borderColor="coolGray.100">
                  <HStack alignItems="center" justifyContent="space-between" mb="3">
                    <VStack>
                      <Text fontSize="sm" fontWeight="800" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                        Horário das paradas
                      </Text>
                      <Text fontSize="xs" color="coolGray.500">
                        Tempo estimado de passagem em cada parada
                      </Text>
                    </VStack>
                    <Icon as={Ionicons} name="time-outline" size="5" color="student.600" />
                  </HStack>
                  <VStack space={2}>
                    {selectedRouteDetails.stops.map((stop, index) => {
                      const isStudentStop = String(stop.routeStopId) === String(selectedRouteDetails.assignment.routeStopId);
                      const passTime = getStopPassTime(selectedRouteDetails.route, stop, selectedRouteDetails.assignment.departureTime);

                      return (
                        <HStack
                          key={`${stop.id}-${index}`}
                          alignItems="center"
                          space={3}
                          p="3"
                          borderRadius="xl"
                          bg={isStudentStop ? 'student.50' : 'coolGray.50'}
                          borderWidth={1}
                          borderColor={isStudentStop ? 'student.500' : 'coolGray.100'}
                        >
                          <Box w="9" h="9" borderRadius="full" bg={isStudentStop ? 'student.600' : 'coolGray.200'} alignItems="center" justifyContent="center">
                            <Text color={isStudentStop ? 'white' : 'coolGray.700'} fontSize="xs" fontWeight="800">
                              {index + 1}
                            </Text>
                          </Box>
                          <VStack flex={1}>
                            <Text fontSize="sm" fontWeight="800" color="coolGray.800" numberOfLines={1}>
                              {stop.name}
                            </Text>
                            <Text fontSize="2xs" color="coolGray.500" numberOfLines={1}>
                              +{getStopOffsetMinutes(stop)} min | {stop.address}
                            </Text>
                          </VStack>
                          <Text fontSize="md" fontWeight="900" color={isStudentStop ? 'student.700' : 'coolGray.700'}>
                            {passTime}
                          </Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              ) : null}

              {selectedRouteDetails ? (
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="4" borderWidth={1} borderColor="coolGray.100">
                  <HStack alignItems="center" justifyContent="space-between" mb="3">
                    <VStack flex={1}>
                      <Text fontSize="sm" fontWeight="800" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                        Alterar parada de embarque
                      </Text>
                      <Text fontSize="xs" color="coolGray.500">
                        Escolha uma parada da rota e salve
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="student"
                      borderRadius="xl"
                      isLoading={updatingStop}
                      isDisabled={!editingStopId || editingStopId === String(selectedRouteDetails.assignment.routeStopId)}
                      onPress={handleUpdateStudentStop}
                    >
                      Salvar
                    </Button>
                  </HStack>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedRouteDetails.stops.map((stop, index) => {
                      const selected = String(stop.id) === String(editingStopId);
                      const passTime = getStopPassTime(selectedRouteDetails.route, stop, selectedRouteDetails.assignment.departureTime);

                      return (
                        <Pressable key={`edit-${stop.routeStopId ?? stop.id}-${index}`} onPress={() => setEditingStopId(getRouteStopId(stop))} mr="2">
                          <Box
                            minW="44"
                            borderRadius="xl"
                            p="3"
                            bg={selected ? 'student.600' : 'coolGray.50'}
                            borderWidth={1}
                            borderColor={selected ? 'student.600' : 'coolGray.200'}
                          >
                            <Text fontSize="2xs" fontWeight="800" color={selected ? 'white' : 'coolGray.500'}>
                              Parada {index + 1}
                            </Text>
                            <Text fontSize="sm" fontWeight="900" color={selected ? 'white' : 'coolGray.800'} numberOfLines={1}>
                              {stop.name}
                            </Text>
                            <Text fontSize="xs" color={selected ? 'coolGray.100' : 'student.700'} fontWeight="800">
                              {passTime}
                            </Text>
                          </Box>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              ) : null}
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      <Modal isOpen={!!previewRoute} onClose={() => setPreviewRoute(null)} size="full">
        <Modal.Content maxH="92%">
          <Modal.CloseButton />
          <Modal.Header>{previewRoute?.route.name ?? 'Rota disponivel'}</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Box borderRadius="xl" overflow="hidden">
                {previewMarkers.length ? (
                  <NativeMap
                    markers={previewMarkers}
                    height={320}
                    interactive
                    onOpenMaps={() => openRouteInMaps(previewMarkers)}
                    openMapsDisabled={!previewMarkers.length}
                    title="Previa da rota"
                    subtitle="Selecione sua parada de embarque"
                    accentColor="#1E40AF"
                  />
                ) : (
                  <EmptyState icon="location-outline" message="Nenhuma coordenada cadastrada para esta rota." />
                )}
              </Box>

              {previewRoute && (
                <VStack space={1}>
                  <Text fontSize="sm" color="coolGray.500">
                    {formatRouteTime(previewRoute.route)}
                  </Text>
                  {previewRoute.route.driver?.name ? (
                    <Text fontSize="sm" color="coolGray.500">
                      Motorista: {previewRoute.route.driver.name}
                    </Text>
                  ) : null}
                  {previewRoute.route.vehicle?.plate ? (
                    <Text fontSize="sm" color="coolGray.500">
                      Veículo: {previewRoute.route.vehicle.plate}
                    </Text>
                  ) : null}
                </VStack>
              )}

              <Box>
                <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} mb="2">
                  Parada que será utilizada
                </Text>
                <Select
                  selectedValue={selectedStopId}
                  onValueChange={setSelectedStopId}
                  placeholder="Selecione uma parada"
                >
                  {(previewRoute?.stops ?? []).map((stop) => (
                    <Select.Item key={stop.routeStopId ?? stop.id} label={stop.name} value={getRouteStopId(stop)} />
                  ))}
                </Select>

                {selectedPreviewStop ? (
                  <Text fontSize="xs" color="green.600" mt="2" fontWeight="600">
                    Selecionada: {selectedPreviewStop.name}
                  </Text>
                ) : null}
              </Box>

              <VStack space={2}>
                <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                  Escolha pela lista de paradas
                </Text>
                {(previewRoute?.stops ?? []).map((stop, index) => {
                  const isSelected = String(stop.routeStopId) === selectedStopId;
                  const passTime = getStopPassTime(previewRoute?.route, stop);

                  return (
                    <Pressable key={stop.routeStopId ?? stop.id} onPress={() => setSelectedStopId(getRouteStopId(stop))}>
                      <HStack
                        alignItems="center"
                        space={3}
                        p="3"
                        borderRadius="xl"
                        bg={isSelected ? 'student.50' : 'coolGray.50'}
                        borderWidth={1}
                        borderColor={isSelected ? 'green.600' : 'coolGray.200'}
                        _dark={{ bg: isSelected ? 'coolGray.700' : 'coolGray.800' }}
                      >
                        <Box
                          w="8"
                          h="8"
                          borderRadius="full"
                          bg={isSelected ? 'green.600' : 'coolGray.300'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color={isSelected ? 'white' : 'coolGray.700'} fontSize="xs" fontWeight="700">
                            {index + 1}
                          </Text>
                        </Box>
                        <VStack flex={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="coolGray.800"
                            _dark={{ color: 'coolGray.100' }}
                          >
                            {stop.name}
                          </Text>
                          {stop.address ? (
                            <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>
                              {stop.address}
                            </Text>
                          ) : null}
                        </VStack>
                        <Text fontSize="sm" fontWeight="900" color={isSelected ? 'green.700' : 'coolGray.600'}>
                          {passTime}
                        </Text>
                        {isSelected ? (
                          <Icon as={Ionicons} name="checkmark-circle" size="5" color="green.600" />
                        ) : null}
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>

            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setPreviewRoute(null)}>
                Cancelar
              </Button>
              <Button
                onPress={handleAddRoute}
                isLoading={addingRoute}
                isDisabled={!selectedStopId || !previewRoute}
                colorScheme="green"
              >
                Adicionar rota
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
