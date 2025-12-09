import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
  FormControl, Spinner, useToast,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stopsApi } from '../../../src/api/stops';
import { Stop } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { NativeMap, MapMarker } from '../../../src/components/map/NativeMap';
import { maskCEP, unmask } from '../../../src/utils/masks';
import { InfoRow } from '@/src/components/shared';
import { fetchAddressByCep, fetchCoordinatesByCep, isCompleteCep } from '../../../src/utils/address.utils';

export default function StopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cep, setCep] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locatingCep, setLocatingCep] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const s = await stopsApi.getById(id!);
      setStop(s);
      setName(s.name); setAddress(s.address ?? '');
      setCity(s.city ?? ''); setNeighborhood(s.neighborhood ?? '');
      setCep(s.cep ? maskCEP(s.cep) : '');
      setLat(s.latitude); setLng(s.longitude);
    } catch {
      Alert.alert('Erro', 'Não foi possivel carregar a parada.');
    } finally {
      setLoading(false);
    }
  }

  function handleMapPick(pickedLat: number, pickedLng: number) {
    setLat(pickedLat.toFixed(6));
    setLng(pickedLng.toFixed(6));
  }

  async function handleCepChange(value: string) {
    const maskedValue = maskCEP(value);
    setCep(maskedValue);

    if (!isCompleteCep(maskedValue)) return;

    setLocatingCep(true);
    try {
      const addressData = await fetchAddressByCep(maskedValue);

      if (!addressData) {
        toast.show({
          description: 'CEP não encontrado. Preencha o endereço manualmente.',
          placement: 'top',
          bg: 'orange.500',
        });
        return;
      }

      setAddress(addressData.logradouro || '');
      setNeighborhood(addressData.bairro || '');
      setCity(addressData.localidade || '');

      const coordinates = await fetchCoordinatesByCep(maskedValue, addressData);

      if (coordinates) {
        setLat(coordinates.latitude.toFixed(6));
        setLng(coordinates.longitude.toFixed(6));
        toast.show({
          description: 'Localização aproximada encontrada pelo CEP.',
          placement: 'top',
          bg: 'green.500',
        });
      } else {
        toast.show({
          description: 'Endereço preenchido. Não foi possivel localizar coordenadas pelo CEP.',
          placement: 'top',
          bg: 'orange.500',
        });
      }
    } catch {
      toast.show({
        description: 'Não foi possível consultar este CEP.',
        placement: 'top',
        bg: 'orange.500',
      });
    } finally {
      setLocatingCep(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !lat || !lng) { Alert.alert('Atenção', 'Nome e localização são obrigatórios.'); return; }
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) { Alert.alert('Atenção', 'Coordenadas inválidas.'); return; }
    setSaving(true);
    try {
      const updated = await stopsApi.update(id!, {
        name: name.trim(),
        latitude: parseFloat(lat).toFixed(6),
        longitude: parseFloat(lng).toFixed(6),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        cep: unmask(cep) || undefined,
      });
      setStop(updated);
      setEditing(false);
      toast.show({ description: 'Parada atualizada!', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Excluir', 'Deseja realmente excluir esta parada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await stopsApi.delete(id!); router.back(); }
          catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        },
      },
    ]);
  }

  if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color="red.500" /></Box>;
  if (!stop) return null;

  const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  const markers: MapMarker[] = hasCoords ? [{ lat: parseFloat(lat), lng: parseFloat(lng), title: name || 'Parada', color: '#DC2626' }] : [];

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title={stop.name} bg="#DC2626" showBack showMenu={false}
        rightContent={<Pressable onPress={() => setEditing(!editing)} p="1"><Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" /></Pressable>}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="3" shadow="1" mb="3">
          <Text fontSize="xs" fontWeight="700" mb="2" px="1" color="coolGray.700" _dark={{ color: 'coolGray.300' }}>
            {editing ? 'Toque no mapa para selecionar' : 'Localização da Parada'}
          </Text>
          <NativeMap
            markers={markers}
            onLocationPick={editing ? handleMapPick : undefined}
            center={hasCoords ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined}
            height={260}
            interactive={editing}
            title={editing ? 'Editar localização' : 'Localização da parada'}
            subtitle={hasCoords ? `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}` : 'Coordenadas nao informadas'}
            accentColor="#DC2626"
          />
        </Box>

        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          {editing ? (
            <VStack space={3}>
              <FormControl isRequired><FormControl.Label>Nome da parada</FormControl.Label><Input value={name} onChangeText={setName} /></FormControl>
              <FormControl>
                <FormControl.Label>CEP</FormControl.Label>
                <Input
                  value={cep}
                  onChangeText={handleCepChange}
                  keyboardType="numeric"
                  isDisabled={locatingCep}
                  InputRightElement={locatingCep ? <Icon as={Ionicons} name="locate-outline" size="4" mr="3" color="coolGray.400" /> : undefined}
                />
              </FormControl>
              <FormControl><FormControl.Label>Endereço</FormControl.Label><Input value={address} onChangeText={setAddress} /></FormControl>
              <HStack space={2}>
                <FormControl flex={1}><FormControl.Label>Cidade</FormControl.Label><Input value={city} onChangeText={setCity} /></FormControl>
                <FormControl flex={1}><FormControl.Label>Bairro</FormControl.Label><Input value={neighborhood} onChangeText={setNeighborhood} /></FormControl>
              </HStack>
              <HStack space={2}>
                <FormControl flex={1}><FormControl.Label>Latitude</FormControl.Label><Input value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></FormControl>
                <FormControl flex={1}><FormControl.Label>Longitude</FormControl.Label><Input value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></FormControl>
              </HStack>
              <HStack space={2} mt="2">
                <Button flex={1} variant="outline" colorScheme="red" onPress={() => setEditing(false)} borderRadius="xl">Cancelar</Button>
                <Button flex={1} bg="red.500" _pressed={{ bg: 'red.600' }} onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
              </HStack>
            </VStack>
          ) : (
            <VStack>
              <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Informações</Text>
              <InfoRow label="Nome da Parada" value={stop.name} />
              <InfoRow label="CEP" value={maskCEP(stop.cep)} />
              <InfoRow label="Endereço" value={stop.address} />
              <InfoRow label="Cidade" value={stop.city} />
              <InfoRow label="Bairro" value={stop.neighborhood} />
              <InfoRow label="Latitude" value={parseFloat(stop.latitude).toFixed(6)} />
              <InfoRow label="Longitude" value={parseFloat(stop.longitude).toFixed(6)} />
            </VStack>
          )}
        </Box>

        {!editing && (
          <Button colorScheme="red" variant="outline" onPress={handleDelete} borderRadius="xl" leftIcon={<Icon as={Ionicons} name="trash-outline" size="4" />}>
            Excluir Parada
          </Button>
        )}
      </ScrollView>
    </Box>
  );
}
