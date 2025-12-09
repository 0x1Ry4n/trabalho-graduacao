import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Icon, FlatList, Pressable, Badge,
  Modal, Button, FormControl, Input, useToast, Radio,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vehiclesApi } from '../../../src/api/vehicles';
import { Vehicle, VehicleCategory } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, AddFab, TopRefreshButton, SwipeDeleteItem } from '../../../src/components/shared';
import { maskPlate } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';

const CATEGORIES: { label: string; value: VehicleCategory }[] = [
  { label: 'Van', value: VehicleCategory.VAN },
  { label: 'Micro-ônibus', value: VehicleCategory.MICROBUS },
  { label: 'Ônibus', value: VehicleCategory.BUS },
];
const HEADER_COLOR = '#7C3AED';
const HEADER_PRESSED_COLOR = '#6D28D9';

function categoryLabel(cat: VehicleCategory): string {
  return cat === 'MICROBUS' ? 'Micro-ônibus' : cat === 'BUS' ? 'Ônibus' : 'Van';
}

export default function VehiclesListScreen() {
  const toast = useToast();
  const { error: createError, isLoading: saving, clearError, withFormError } = useFormError();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<VehicleCategory>(VehicleCategory.VAN);
  const [capacity, setCapacity] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await vehiclesApi.list();
      setVehicles(data.filter((vehicle) => !vehicle.deletedAt));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os veiculos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = withFormError(async () => {
    if (!plate.trim() || !model.trim() || !capacity) {
      Alert.alert('Atenção', 'Placa, modelo e capacidade são obrigatórios.');
      return;
    }
    await vehiclesApi.create({
      plate: plate.trim().toUpperCase(),
      model: model.trim(),
      type: category,
      capacity: parseInt(capacity, 10),
      notes: notes.trim() || undefined,
      active: 1,
    });
    setShowCreate(false);
    setPlate(''); setModel(''); setCapacity(''); setNotes('');
    setCategory(VehicleCategory.VAN);
    toast.show({ description: 'Veículo criado com sucesso!', placement: 'top' });
    load();
  });

  function confirmDelete(vehicle: Vehicle) {
    Alert.alert('Excluir veiculo', `Deseja realmente excluir ${vehicle.plate}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await vehiclesApi.delete(vehicle.id);
            setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
            toast.show({ description: 'Veiculo excluido.', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Nao foi possivel excluir o veiculo.');
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner color="violet.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Veículos" subtitle={`${vehicles.length} registros`} bg={HEADER_COLOR} />

      <FlatList
        data={vehicles}
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
          <Pressable onPress={() => router.push(`/(admin)/vehicles/${item.id}`)}>
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
              <HStack alignItems="center" space={3}>
                <Box w="12" h="12" borderRadius="xl" bg="violet.50" alignItems="center" justifyContent="center">
                  <Icon as={Ionicons} name="bus-outline" size="6" color="violet.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="md" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }} style={{ letterSpacing: 1 }}>{item.plate}</Text>
                  <Text fontSize="xs" color="coolGray.600">{item.model}</Text>
                  <Text fontSize="xs" color="coolGray.400">Capacidade: {item.capacity} lugares</Text>
                </VStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge colorScheme="info" borderRadius="full" variant="subtle">
                    <Text fontSize="2xs">{categoryLabel(item.type)}</Text>
                  </Badge>
                  <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                </VStack>
              </HStack>
            </Box>
          </Pressable>
          </SwipeDeleteItem>
        )}
        ListEmptyComponent={<EmptyState icon="bus-outline" message="Nenhum veiculo cadastrado" />}
      />

      <AddFab onPress={() => setShowCreate(true)} bg={HEADER_COLOR} pressedBg={HEADER_PRESSED_COLOR} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}><Text fontSize="lg" fontWeight="700">Novo Veículo</Text></Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <ErrorDisplay error={createError} onDismiss={clearError} />
              <FormControl isRequired><FormControl.Label>Placa</FormControl.Label><Input placeholder="ABC-1234" value={plate} onChangeText={(v) => setPlate(maskPlate(v))} autoCapitalize="characters" /></FormControl>
              <FormControl isRequired><FormControl.Label>Modelo</FormControl.Label><Input placeholder="Ex: Sprinter 415" value={model} onChangeText={setModel} /></FormControl>
              <FormControl isRequired><FormControl.Label>Capacidade</FormControl.Label><Input placeholder="Ex: 16" value={capacity} onChangeText={setCapacity} keyboardType="numeric" /></FormControl>
              <FormControl><FormControl.Label>Observações</FormControl.Label><Input placeholder="Opcional" value={notes} onChangeText={setNotes} /></FormControl>
              <FormControl>
                <FormControl.Label>Categoria</FormControl.Label>
                <Radio.Group name="category" value={category} onChange={(v) => setCategory(v as VehicleCategory)}>
                  <VStack space={2}>
                    {CATEGORIES.map((cat) => (
                      <Radio key={cat.value} value={cat.value} colorScheme="violet" size="sm">
                        <Text fontSize="sm" ml="2">{cat.label}</Text>
                      </Radio>
                    ))}
                  </VStack>
                </Radio.Group>
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="violet" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} colorScheme="violet" onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Veículo</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
