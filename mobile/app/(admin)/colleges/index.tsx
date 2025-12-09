import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable, Badge,
    Modal, Button, FormControl, useToast,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collegesApi } from '../../../src/api/colleges';
import { College } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, TopRefreshButton } from '../../../src/components/shared';
import { maskCEP, maskPhone, unmask } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';

export default function CollegesScreen() {
    const toast = useToast();
    const { error: createError, isLoading: saving, clearError, withFormError } = useFormError();
    const { fillAddressFromCep } = useCepAddress();
    const [colleges, setColleges] = useState<College[]>([]);
    const [filtered, setFiltered] = useState<College[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [address, setAddress] = useState('');
    const [cep, setCep] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const baseInputProps = {
        variant: 'filled',
        bg: 'coolGray.50',
        borderRadius: 'xl',
        borderColor: 'coolGray.300',
        _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'amber.400', bg: 'coolGray.700' } },
        _focus: { borderColor: 'amber.600', bg: 'white' },
        fontSize: 'sm',
    } as const;

    const load = useCallback(async () => {
        try {
            const data = await collegesApi.list();
            setColleges(data);
            setFiltered(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar as instituições.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(colleges);
            return;
        }

        const q = search.toLowerCase();
        setFiltered(colleges.filter((i) =>
            i.name.toLowerCase().includes(q) ||
            i.city.toLowerCase().includes(q) ||
            i.neighborhood.toLowerCase().includes(q)
        ));
    }, [search, colleges]);

    function resetForm() {
        setName('');
        setCity('');
        setNeighborhood('');
        setAddress('');
        setCep('');
        setContactEmail('');
        setContactPhone('');
        setIsEditing(false);
        setEditingCollegeId(null);
    }

    const handleCepChange = async (value: string) => {
        const maskedValue = maskCEP(value);
        setCep(maskedValue);

        if (isCompleteCep(maskedValue)) {
            const success = await fillAddressFromCep(
                maskedValue,
                setAddress,
                setNeighborhood,
                setCity
            );

            if (!success) {
                toast.show({
                    description: 'CEP não encontrado. Preencha o endereço manualmente.',
                    placement: 'top',
                    bg: 'orange.500'
                });
            }
        }
    };

    const handleCreate = withFormError(async () => {
        if (!name.trim() || !city.trim() || !neighborhood.trim() || !address.trim() || !cep.trim()) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }
        const payload = {
            name: name.trim(), city: city.trim(), neighborhood: neighborhood.trim(),
            address: address.trim(), cep: unmask(cep),
            contactEmail: contactEmail.trim() || undefined,
            contactPhone: unmask(contactPhone) || undefined,
        };
        if (isEditing && editingCollegeId) {
            await collegesApi.update(editingCollegeId, payload);
            toast.show({ description: 'Instituição atualizada com sucesso!', placement: 'top' });
        } else {
            const newCollege = await collegesApi.create(payload);
            setColleges(prev => [...prev, newCollege]);
            toast.show({ description: 'Instituição cadastrada com sucesso!', placement: 'top' });
        }
        resetForm();
        setShowCreate(false);
    });

    if (loading) return <LoadingSpinner color="admin.600" />;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title="Instituições"
                subtitle={`${filtered.length} instituições`}
                bg="#f59e0b"
                rightContent={
                    <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
                        <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
                    </Pressable>
                }
            />

            {searchVisible && (
                <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nome, cidade ou bairro..." />
            )}

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                ListHeaderComponent={
                    <Box mb="3">
                        <TopRefreshButton
                            onPress={load}
                            bgColor="#F59E0B"
                            pressedBgColor="#D97706"
                        />
                    </Box>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
                }
                renderItem={({ item }) => (
                    <Pressable onPress={() => router.push(`/(admin)/colleges/${item.id}`)} mb="2">
                        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
                            <HStack alignItems="center" space={3}>
                                <Box w="10" h="10" borderRadius="lg" bg="amber.50" alignItems="center" justifyContent="center">
                                    <Icon as={Ionicons} name="school" size="5" color="amber.500" />
                                </Box>
                                <VStack flex={1}>
                                    <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>{item.city} - {item.neighborhood}</Text>
                                    <Text fontSize="xs" color="coolGray.400" numberOfLines={1}>{item.address} | CEP {maskCEP(item.cep)}</Text>
                                </VStack>
                                <VStack alignItems="flex-end" space={1}>
                                    <Badge
                                        colorScheme={item.active === 1 ? 'success' : 'coolGray'}
                                        borderRadius="full" variant="subtle" px="2">
                                        <Text fontSize="2xs" fontWeight="700">
                                            {item.active === 1 ? 'Ativo' : 'Inativo'}
                                        </Text>
                                    </Badge>
                                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                                </VStack>
                            </HStack>
                        </Box>
                    </Pressable>
                )}
                ListEmptyComponent={<EmptyState icon="school-outline" message="Nenhuma instituição encontrada" />}
            />

            <AddFab onPress={() => { resetForm(); setShowCreate(true); }} bg="amber.500" pressedBg="amber.600" />

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
                <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
                    <Modal.CloseButton />
                    <Modal.Header borderBottomWidth={0}>
                        <Text fontSize="lg" fontWeight="700">{isEditing ? 'Editar instituição' : 'Nova instituição'}</Text>
                    </Modal.Header>
                    <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
                        <VStack space={3}>
                            <ErrorDisplay error={createError} onDismiss={clearError} />
                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">DADOS</Text>
                            <FormControl isRequired>
                                <FormControl.Label>Nome</FormControl.Label>
                                <Input {...baseInputProps} placeholder="Ex: Centro Universitário UniPass" value={name} onChangeText={setName} />
                            </FormControl>

                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">ENDEREÇO</Text>
                            <FormControl isRequired>
                                <FormControl.Label>CEP</FormControl.Label>
                                <Input {...baseInputProps} placeholder="00000-000" value={cep} onChangeText={handleCepChange} keyboardType="numeric" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormControl.Label>Endereço</FormControl.Label>
                                <Input {...baseInputProps} placeholder="Rua, numero" value={address} onChangeText={setAddress} />
                            </FormControl>
                            <HStack space={2}>
                                <FormControl flex={1} isRequired>
                                    <FormControl.Label>Bairro</FormControl.Label>
                                    <Input {...baseInputProps} placeholder="Ex: Centro" value={neighborhood} onChangeText={setNeighborhood} />
                                </FormControl>
                                <FormControl flex={1} isRequired>
                                    <FormControl.Label>Cidade</FormControl.Label>
                                    <Input {...baseInputProps} placeholder="Ex: Jales" value={city} onChangeText={setCity} />
                                </FormControl>
                            </HStack>

                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">CONTATO</Text>
                            <FormControl>
                                <FormControl.Label>E-mail de contato</FormControl.Label>
                                <Input {...baseInputProps} placeholder="contato@instituicao.edu.br" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
                            </FormControl>
                            <FormControl>
                                <FormControl.Label>Telefone de contato</FormControl.Label>
                                <Input {...baseInputProps} placeholder="(17) 99999-9999" value={contactPhone} onChangeText={(v) => setContactPhone(maskPhone(v))} keyboardType="phone-pad" />
                            </FormControl>

                        </VStack>
                    </Modal.Body>
                    <Modal.Footer borderTopWidth={0}>
                        <Button.Group space={2} w="full">
                            <Button flex={1} variant="outline" colorScheme="amber" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
                            <Button flex={1} colorScheme="amber" onPress={handleCreate} isLoading={saving} borderRadius="xl">{isEditing ? 'Atualizar' : 'Cadastrar'}</Button>
                        </Button.Group>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </Box>
    );
}
