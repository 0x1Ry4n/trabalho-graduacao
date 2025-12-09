import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable,
  Modal, Button, FormControl, useToast,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stopsApi } from '../../../src/api/stops';
import { Stop } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { NativeMap, MapMarker } from '../../../src/components/map/NativeMap';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, TopRefreshButton, SwipeDeleteItem } from '../../../src/components/shared';
import { maskCEP, unmask } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';
import { fetchAddressByCep, fetchCoordinatesByCep, isCompleteCep } from '../../../src/utils/address.utils';

const HEADER_COLOR = '#DC2626';
const HEADER_PRESSED_COLOR = '#B91C1C';

export default function StopsListScreen() {
  const toast = useToast();
  const { error: createError, isLoading: saving, clearError, withFormError } = useFormError();
  const [stops, setStops] = useState<Stop[]>([]);
  const [filtered, setFiltered] = useState<Stop[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cep, setCep] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locatingCep, setLocatingCep] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await stopsApi.list();
      setStops(data); setFiltered(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as paradas.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(stops); return; }
    const q = search.toLowerCase();
    setFiltered(stops.filter((s) => s.name.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q)));
  }, [search, stops]);

  function handleMapPick(pickedLat: number, pickedLng: number) {
    setLat(pickedLat.toFixed(6));
    setLng(pickedLng.toFixed(6));
  }

  const handleCepChange = async (value: string) => {
    const maskedValue = maskCEP(value);
    setCep(maskedValue);

    // Auto-fill address when CEP is complete (8 digits + mask = 9 characters)
    if (isCompleteCep(maskedValue)) {
      setLocatingCep(true);
      try {
        const addressData = await fetchAddressByCep(maskedValue);

        if (!addressData) {
          toast.show({
            description: 'CEP não encontrado. Preencha o endereço manualmente.',
            placement: 'top',
            bg: 'orange.500'
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
            bg: 'green.500'
          });
        } else {
          toast.show({
            description: 'Endereço preenchido. Não foi possível localizar coordenadas pelo CEP.',
            placement: 'top',
            bg: 'orange.500'
          });
        }
      } catch {
        toast.show({
          description: 'Não foi possível consultar este CEP.',
          placement: 'top',
          bg: 'orange.500'
        });
      } finally {
        setLocatingCep(false);
      }
    }
  };

  const handleCreate = withFormError(async () => {
    if (!name.trim() || !lat || !lng || !city.trim() || !neighborhood.trim() || !address.trim() || !cep.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      Alert.alert('Atenção', 'Coordenadas inválidas.');
      return;
    }
    const newStop = await stopsApi.create({
      name: name.trim(),
      city: city.trim(),
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      cep: unmask(cep),
      latitude: parseFloat(lat).toFixed(6),
      longitude: parseFloat(lng).toFixed(6),
    });
    setStops(prev => [...prev, newStop]);
    setShowCreate(false);
    setName(''); setAddress(''); setCity(''); setNeighborhood(''); setCep(''); setLat(''); setLng('');
    toast.show({ description: 'Parada criada com sucesso!', placement: 'top' });
  });

  function confirmDelete(stop: Stop) {
    Alert.alert('Excluir parada', `Deseja realmente excluir ${stop.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopsApi.delete(stop.id);
            setStops((current) => current.filter((item) => item.id !== stop.id));
            toast.show({ description: 'Parada excluida.', placement: 'top' });
          } catch {
            Alert.alert('Erro', 'Nao foi possivel excluir a parada.');
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner color="red.500" />;

  const createMarkers: MapMarker[] = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
    ? [{ lat: parseFloat(lat), lng: parseFloat(lng), title: name || 'Parada', color: '#DC2626' }]
    : [];

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Paradas" subtitle={`${filtered.length} paradas`} bg={HEADER_COLOR}
        rightContent={<Pressable onPress={() => setSearchVisible(!searchVisible)} p="1"><Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" /></Pressable>}
      />

      {searchVisible && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nome ou endereco..." />
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
          <Pressable onPress={() => router.push(`/(admin)/stops/${item.id}`)}>
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
              <HStack alignItems="center" space={3}>
                <Box w="10" h="10" borderRadius="lg" bg="red.50" alignItems="center" justifyContent="center">
                  <Icon as={Ionicons} name="location" size="5" color="red.500" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>{item.name}</Text>
                  {item.address && <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>{item.address}</Text>}
                  <Text fontSize="2xs" color="coolGray.400">{parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}</Text>
                </VStack>
                <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
              </HStack>
            </Box>
          </Pressable>
          </SwipeDeleteItem>
        )}
        ListEmptyComponent={<EmptyState icon="location-outline" message="Nenhuma parada cadastrada" />}
      />

      <AddFab onPress={() => setShowCreate(true)} bg={HEADER_COLOR} pressedBg={HEADER_PRESSED_COLOR} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
        <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}><Text fontSize="lg" fontWeight="700">Nova Parada</Text></Modal.Header>
          <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
            <VStack space={3}>
              <ErrorDisplay error={createError} onDismiss={clearError} />
              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">ENDEREÇO</Text>
              <FormControl isRequired><FormControl.Label>Nome da parada</FormControl.Label><Input placeholder="Ex: Terminal Centro" value={name} onChangeText={setName} /></FormControl>
              <FormControl isRequired>
                <FormControl.Label>CEP</FormControl.Label>
                <Input
                  placeholder="00000-000"
                  value={cep}
                  onChangeText={handleCepChange}
                  keyboardType="numeric"
                  isDisabled={locatingCep}
                  InputRightElement={locatingCep ? <Icon as={Ionicons} name="locate-outline" size="4" mr="3" color="coolGray.400" /> : undefined}
                />
              </FormControl>
              <FormControl isRequired><FormControl.Label>Endereço</FormControl.Label><Input placeholder="Rua, numero..." value={address} onChangeText={setAddress} /></FormControl>

              <HStack space={2}>
                <FormControl flex={1} isRequired><FormControl.Label>Cidade</FormControl.Label><Input placeholder="Ex: Jales" value={city} onChangeText={setCity} /></FormControl>
                <FormControl flex={1} isRequired><FormControl.Label>Bairro</FormControl.Label><Input placeholder="Ex: Centro" value={neighborhood} onChangeText={setNeighborhood} /></FormControl>
              </HStack>
              <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">LOCALIZAÇÃO</Text>
              <Text fontSize="xs" color="coolGray.500" textAlign="center">Toque no mapa para selecionar a localização</Text>
              <NativeMap
                markers={createMarkers}
                onLocationPick={handleMapPick}
                height={240}
                interactive
                title="Localização da parada"
                subtitle={createMarkers.length ? 'Ajuste pelo mapa se necessário' : 'Toque para definir as coordenadas'}
                accentColor={HEADER_COLOR}
              />

              <HStack space={2}>
                <FormControl flex={1}><FormControl.Label>Latitude</FormControl.Label><Input placeholder="-20.774..." value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></FormControl>
                <FormControl flex={1}><FormControl.Label>Longitude</FormControl.Label><Input placeholder="-49.506..." value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></FormControl>
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2} w="full">
              <Button flex={1} variant="outline" colorScheme="red" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
              <Button flex={1} bg="red.500" _pressed={{ bg: 'red.600' }} onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Parada</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
