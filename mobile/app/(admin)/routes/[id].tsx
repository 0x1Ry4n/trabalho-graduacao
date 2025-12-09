import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Icon, Badge, Spinner, Pressable,
  Modal, Button, FormControl, Select, Input, useToast, FlatList,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routesApi } from '../../../src/api/routes';
import { stopsApi } from '../../../src/api/stops';
import { Route, Stop, RoutePeriod } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { NativeMap, MapMarker } from '../../../src/components/map/NativeMap';
import { EmptyState, InfoRow } from '@/src/components/shared';

function periodLabel(p: RoutePeriod) { return p === 'MORNING' ? 'Manha' : p === 'AFTERNOON' ? 'Tarde' : 'Noite'; }

function createStopMarker(stop: Stop, index: number, total: number): MapMarker | null {
  const lat = parseFloat(stop.latitude);
  const lng = parseFloat(stop.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    title: stop.name,
    color: index === 0 ? '#059669' : index === total - 1 ? '#DC2626' : '#1E40AF',
    label: String(index + 1),
  };
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [availableStops, setAvailableStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [stopOrder, setStopOrder] = useState<string>('');
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [addingStop, setAddingStop] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const [r, s] = await Promise.allSettled([routesApi.getById(id!), routesApi.getStops(id!)]);
      if (r.status === 'fulfilled') setRoute(r.value);
      if (s.status === 'fulfilled') setStops(s.value);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar a rota.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableStops() {
    try {
      const allStops = await stopsApi.list();
      const available = allStops.filter(stop => !stops.some(routeStop => routeStop.id === stop.id));
      setAvailableStops(available);
    } catch {
      toast.show({ description: 'Erro ao carregar paradas disponíveis', placement: 'top' });
    }
  }

  async function handleAddStop() {
    if (!selectedStopId || !stopOrder) {
      toast.show({ description: 'Selecione uma parada e defina a ordem', placement: 'top' });
      return;
    }

    setAddingStop(true);
    try {
      await routesApi.addStop(id!, selectedStopId.toString(), parseInt(stopOrder), parseInt(estimatedArrival) || 0);
      await load();
      setShowAddStopModal(false);
      setSelectedStopId('');
      setStopOrder('');
      setEstimatedArrival('');
      toast.show({ description: 'Parada adicionada com sucesso', placement: 'top' });
    } catch {
      toast.show({ description: 'Erro ao adicionar parada', placement: 'top' });
    } finally {
      setAddingStop(false);
    }
  }

  async function handleRemoveStop(stopId: number) {
    Alert.alert(
      'Remover Parada',
      'Tem certeza que deseja remover esta parada da rota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await routesApi.removeStop(id!, stopId.toString());
              await load();
              toast.show({ description: 'Parada removida com sucesso', placement: 'top' });
            } catch {
              toast.show({ description: 'Erro ao remover parada', placement: 'top' });
            }
          }
        }
      ]
    );
  }

  function toggleEditMode() {
    setEditMode(!editMode);
    if (!editMode) {
      loadAvailableStops();
    }
  }

  if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color="amber.600" /></Box>;
  if (!route) return null;

  const markers: MapMarker[] = stops
    .map((stop, index) => createStopMarker(stop, index, stops.length))
    .filter(Boolean) as MapMarker[];
  const selectedStop = availableStops.find((stop) => stop.id.toString() === selectedStopId);
  const addStopPreviewStops = selectedStop ? [...stops, selectedStop] : stops;
  const addStopPreviewMarkers = addStopPreviewStops
    .map((stop, index) => createStopMarker(stop, index, addStopPreviewStops.length))
    .filter(Boolean) as MapMarker[];

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title={route.name}
        bg="#D97706"
        showBack
        showMenu={false}
        rightContent={
          <HStack alignItems="center" space={2}>
            <Pressable onPress={toggleEditMode} p="1">
              <Icon as={Ionicons} name={editMode ? 'close-outline' : 'create-outline'} size="5" color="white" />
            </Pressable>
          </HStack>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Detalhes da Rota</Text>
          <InfoRow label="Nome" value={route.name} />
          <InfoRow label="Saida" value={route.startLat} />
          <InfoRow label="Chegada" value={route.endLat} />
          {route.driver && <InfoRow label="Motorista" value={route.driver.name} />}
          {route.vehicle && <InfoRow label="Veiculo" value={`${route.vehicle.plate} - ${route.vehicle.model}`} />}
        </Box>

        {/* Map */}
        {stops.length > 0 && (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="3" shadow="1" mb="3">
            <Text fontSize="sm" fontWeight="700" mb="3" px="1" color="coolGray.800" _dark={{ color: 'white' }}>
              Paradas no Mapa ({stops.length})
            </Text>
            <NativeMap
              markers={markers}
              height={280}
              title="Paradas no mapa"
              subtitle={`${markers.length} ponto(s) com coordenadas`}
              accentColor="#D97706"
            />
          </Box>
        )}

        {/* Stops list */}
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
          <HStack justifyContent="space-between" alignItems="center" mb="3">
            <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>Lista de Paradas</Text>
            {editMode && (
              <Pressable onPress={() => setShowAddStopModal(true)} p={1}>
                <Icon as={Ionicons} name="add-circle" size="md" color="amber.600" />
              </Pressable>
            )}
          </HStack>
          {stops.length === 0 ? (
            <Text fontSize="xs" color="coolGray.400" textAlign="center" py="4">Nenhuma parada cadastrada</Text>
          ) : (
            stops.map((stop, i) => (
              <HStack key={stop.id} alignItems="flex-start" py="2.5" space={3} borderBottomWidth={1} borderBottomColor="coolGray.50">
                <Box w="3" h="3" borderRadius="full" mt="1" bg={i === 0 ? 'green.500' : i === stops.length - 1 ? 'red.500' : 'blue.600'} />
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.200' }}>{stop.name}</Text>
                  {stop.address && <Text fontSize="xs" color="coolGray.500" mt="0.5">{stop.address}</Text>}
                  <Text fontSize="2xs" color="coolGray.400" mt="0.5">
                    {parseFloat(stop.latitude).toFixed(5)}, {parseFloat(stop.longitude).toFixed(5)}
                  </Text>
                </VStack>
                {editMode && (
                  <Pressable onPress={() => handleRemoveStop(parseInt(stop.id))} p={1}>
                    <Icon as={Ionicons} name="remove-circle" size="md" color="red.500" />
                  </Pressable>
                )}
              </HStack>
            ))
          )}
        </Box>
      </ScrollView>

      {/* Add Stop Modal */}
      <Modal isOpen={showAddStopModal} onClose={() => setShowAddStopModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Adicionar Parada</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Selecione uma Parada</FormControl.Label>
                <Select
                  selectedValue={selectedStopId}
                  onValueChange={setSelectedStopId}
                  placeholder="Escolha uma parada"
                >
                  {availableStops.map(stop => (
                    <Select.Item key={stop.id} label={stop.name} value={stop.id.toString()} />
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="coolGray.500" mb="2">
                  Marcadores da rota
                </Text>
                {addStopPreviewMarkers.length > 0 ? (
                  <NativeMap
                    markers={addStopPreviewMarkers}
                    height={220}
                    interactive
                    title="Previa da rota"
                    subtitle="Confira a ordem dos marcadores"
                    accentColor="#D97706"
                  />
                ) : (
                  <EmptyState icon="location-outline" message="Selecione uma parada com coordenadas." />
                )}
              </Box>

              <FormControl>
                <FormControl.Label>Ordem na Rota</FormControl.Label>
                <Input
                  value={stopOrder}
                  onChangeText={setStopOrder}
                  placeholder="Ex: 1, 2, 3..."
                  keyboardType="numeric"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Chegada Estimada (minutos)</FormControl.Label>
                <Input
                  value={estimatedArrival}
                  onChangeText={setEstimatedArrival}
                  placeholder="Ex: 15, 30, 45..."
                  keyboardType="numeric"
                />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowAddStopModal(false)}>
                Cancelar
              </Button>
              <Button
                onPress={handleAddStop}
                isLoading={addingStop}
                isDisabled={!selectedStopId || !stopOrder}
                bg="amber.600"
                _pressed={{ bg: "amber.700" }}
              >
                Adicionar
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
