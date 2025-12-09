import React, { useEffect, useState } from 'react';
import {
    Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
    FormControl, Spinner, useToast,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collegesApi } from '../../../src/api/colleges';
import { College } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { maskCEP, maskPhone, unmask } from '../../../src/utils/masks';
import { InfoRow, TopRefreshButton } from '@/src/components/shared';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';

export default function CollegeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const toast = useToast();
    const { fillAddressFromCep } = useCepAddress();
    const [college, setCollege] = useState<College | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [address, setAddress] = useState('');
    const [cep, setCep] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    useEffect(() => { if (id) load(); }, [id]);

    async function load() {
        try {
            const c = await collegesApi.getById(id!);
            setCollege(c);
            setName(c.name);
            setCity(c.city);
            setNeighborhood(c.neighborhood);
            setAddress(c.address);
            setCep(maskCEP(c.cep));
            setContactEmail(c.contactEmail ?? '');
            setContactPhone(c.contactPhone ? maskPhone(c.contactPhone) : '');
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar a instituição.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!name.trim() || !city.trim() || !neighborhood.trim() || !address.trim() || !cep.trim()) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                city: city.trim(),
                neighborhood: neighborhood.trim(),
                address: address.trim(),
                cep: unmask(cep),
                contactEmail: contactEmail.trim() || undefined,
                contactPhone: unmask(contactPhone) || undefined,
            };

            const updated = await collegesApi.update(id!, payload);
            setCollege(updated);
            setEditing(false);
            toast.show({ description: 'Instituição atualizada com sucesso!', placement: 'top' });
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar a instituição.');
        } finally {
            setSaving(false);
        }
    }

    async function handleCepChange(value: string) {
        const maskedValue = maskCEP(value);
        setCep(maskedValue);

        if (!isCompleteCep(maskedValue)) return;

        const success = await fillAddressFromCep(
            maskedValue,
            setAddress,
            setNeighborhood,
            setCity
        );

        if (!success) {
            toast.show({
                description: 'CEP nao encontrado. Preencha o endereco manualmente.',
                placement: 'top',
                bg: 'orange.500',
            });
        }
    }

    async function handleToggleActive() {
        if (!college) return;
        try {
            if (college.active === 1) {
                await collegesApi.inactivate(id!);
            } else {
                await collegesApi.activate(id!);
            }
            load();
            toast.show({ description: `Instituição ${college.active === 1 ? 'desativada' : 'ativada'} com sucesso!`, placement: 'top' });
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o status.');
        }
    }

    if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color="amber.500" /></Box>;
    if (!college) return null;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader title={college.name} bg="#f59e0b" showBack showMenu={false}
                rightContent={<Pressable onPress={() => setEditing(!editing)} p="1"><Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" /></Pressable>}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Box mb="3">
                    <TopRefreshButton
                        onPress={load}
                        bgColor="#F59E0B"
                        pressedBgColor="#D97706"
                    />
                </Box>

                {/* Status Badge */}
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text fontSize="xs" color="coolGray.500" mb="1">Status</Text>
                            <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                                {college.active === 1 ? 'Ativa' : 'Inativa'}
                            </Text>
                        </VStack>
                        <Pressable
                            onPress={handleToggleActive}
                            px="4"
                            py="2"
                            bg={college.active === 1 ? 'red.50' : 'green.50'}
                            _pressed={{ bg: college.active === 1 ? 'red.100' : 'green.100' }}
                            borderRadius="lg"
                        >
                            <Text fontSize="xs" fontWeight="700" color={college.active === 1 ? 'red.500' : 'green.500'}>
                                {college.active === 1 ? 'Desativar' : 'Ativar'}
                            </Text>
                        </Pressable>
                    </HStack>
                </Box>

                {/* Info / Form */}
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    {editing ? (
                        <VStack space={3}>
                            <FormControl isRequired>
                                <FormControl.Label>Nome</FormControl.Label>
                                <Input value={name} onChangeText={setName} />
                            </FormControl>
                            <HStack space={2}>
                                <FormControl flex={1} isRequired>
                                    <FormControl.Label>Cidade</FormControl.Label>
                                    <Input value={city} onChangeText={setCity} />
                                </FormControl>
                                <FormControl flex={1} isRequired>
                                    <FormControl.Label>Bairro</FormControl.Label>
                                    <Input value={neighborhood} onChangeText={setNeighborhood} />
                                </FormControl>
                            </HStack>
                            <FormControl isRequired>
                                <FormControl.Label>Endereço</FormControl.Label>
                                <Input value={address} onChangeText={setAddress} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormControl.Label>CEP</FormControl.Label>
                                <Input value={cep} onChangeText={handleCepChange} keyboardType="numeric" />
                            </FormControl>
                            <FormControl>
                                <FormControl.Label>E-mail de contato</FormControl.Label>
                                <Input value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
                            </FormControl>
                            <FormControl>
                                <FormControl.Label>Telefone de contato</FormControl.Label>
                                <Input value={contactPhone} onChangeText={(v) => setContactPhone(maskPhone(v))} keyboardType="phone-pad" />
                            </FormControl>
                            <HStack space={2} mt="2">
                                <Button flex={1} variant="outline" colorScheme="amber" onPress={() => setEditing(false)} borderRadius="xl">Cancelar</Button>
                                <Button flex={1} bg="amber.500" _pressed={{ bg: 'amber.600' }} onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
                            </HStack>
                        </VStack>
                    ) : (
                        <VStack>
                            <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Informações</Text>
                            <InfoRow label="ID" value={college.id} />
                            <InfoRow label="Nome" value={college.name} />
                            <InfoRow label="Cidade" value={college.city} />
                            <InfoRow label="Bairro" value={college.neighborhood} />
                            <InfoRow label="Endereço" value={college.address} />
                            <InfoRow label="CEP" value={maskCEP(college.cep)} />
                            <InfoRow label="Email" value={college.contactEmail} />
                            <InfoRow label="Telefone" value={maskPhone(college.contactPhone ?? "")} />
                            <InfoRow label="Criado em" value={new Date(college.createdAt).toLocaleDateString('pt-BR')} />
                        </VStack>
                    )}
                </Box>
            </ScrollView >
        </Box >
    );
}

