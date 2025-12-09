import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
  FormControl, Spinner, useToast,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vehiclesApi } from '../../../src/api/vehicles';
import { Vehicle, VehicleCategory } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { InfoRow } from '@/src/components/shared';

function categoryLabel(cat: VehicleCategory): string {
  return cat === 'MICROBUS' ? 'Micro-onibus' : cat === 'BUS' ? 'Onibus' : 'Van';
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const v = await vehiclesApi.getById(id!);
      setVehicle(v);
      setPlate(v.plate);
      setCapacity(v.capacity.toString());
      setNotes(v.notes ?? '');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar o veiculo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!plate.trim()) { Alert.alert('Atencao', 'Placa e obrigatoria.'); return; }
    setSaving(true);
    try {
      const updated = await vehiclesApi.update(id!, {
        plate: plate.trim().toUpperCase(),
        capacity: parseInt(capacity, 10) || undefined,
        notes: notes.trim() || undefined,
      });
      setVehicle(updated);
      setEditing(false);
      toast.show({ description: 'Veiculo atualizado!', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color="violet.600" /></Box>;
  if (!vehicle) return null;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title={vehicle.plate} bg="#7C3AED" showBack showMenu={false}
        rightContent={<Pressable onPress={() => setEditing(!editing)} p="1"><Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" /></Pressable>}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
          <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
            {editing ? 'Editar Veiculo' : 'Informações'}
          </Text>
          {editing ? (
            <VStack space={3}>
              <FormControl><FormControl.Label>Placa</FormControl.Label><Input value={plate} onChangeText={setPlate} autoCapitalize="characters" /></FormControl>
              <FormControl><FormControl.Label>Capacidade</FormControl.Label><Input value={capacity} onChangeText={setCapacity} keyboardType="numeric" /></FormControl>
              <FormControl><FormControl.Label>Observações</FormControl.Label><Input value={notes} onChangeText={setNotes} /></FormControl>
              <HStack space={2} mt="2">
                <Button flex={1} variant="outline" colorScheme="violet" onPress={() => setEditing(false)} borderRadius="xl">Cancelar</Button>
                <Button flex={1} colorScheme="violet" onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
              </HStack>
            </VStack>
          ) : (
            <VStack>
              <InfoRow label="Placa" value={vehicle.plate} />
              <InfoRow label="Modelo" value={vehicle.model} />
              <InfoRow label="Categoria" value={categoryLabel(vehicle.type)} />
              <InfoRow label="Capacidade" value={`${vehicle.capacity} lugares`} />
              {vehicle.notes && <InfoRow label="Observações" value={vehicle.notes} />}
            </VStack>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}
