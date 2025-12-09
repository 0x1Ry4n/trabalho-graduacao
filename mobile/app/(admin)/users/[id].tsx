import React, { useEffect, useState } from 'react';
import {
    Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
    FormControl, Spinner, useToast, Select,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../../src/api/users';
import { User, UserRole } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { InfoRow, TopRefreshButton } from '@/src/components/shared';

function statusLabel(active: number) {
    return active === 1 ? 'Ativo' : 'Inativo';
}

function roleLabel(role: UserRole) {
    return role === UserRole.ADMIN ? 'Administrador' : role === UserRole.DRIVER ? 'Motorista' : 'Aluno';
}

export default function UserDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const toast = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

    useEffect(() => { if (id) load(); }, [id]);

    async function load() {
        try {
            const u = await usersApi.getById(id!);
            setUser(u);
            setUsername(u.username);
            setEmail(u.email);
            setRole(u.role);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar o usuário.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!username.trim() || !email.trim()) {
            Alert.alert('Atenção', 'Preencha username e email.');
            return;
        }

        if (password.trim().length > 0 && password.trim().length < 8) {
            Alert.alert('Atenção', 'Senha deve ter pelo menos 8 caracteres.');
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                username: username.trim(),
                email: email.trim(),
                role,
            };

            if (password.trim()) {
                payload.password = password.trim();
            }

            const updated = await usersApi.update(id!, payload);
            setUser(updated);
            setEditing(false);
            setPassword('');
            toast.show({ description: 'Usuário atualizado com sucesso!', placement: 'top' });
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar o usuário.');
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleActive() {
        if (!user) return;
        try {
            if (user.active === 1) {
                await usersApi.inactivate(id!);
            } else {
                await usersApi.activate(id!);
            }
            load();
            toast.show({ description: `Usuário ${user.active === 1 ? 'desativado' : 'ativado'} com sucesso!`, placement: 'top' });
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o status.');
        }
    }

    if (loading) return <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50"><Spinner size="lg" color="blue.500" /></Box>;
    if (!user) return null;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader title={user.username} bg="#2f95dc" showBack showMenu={false}
                rightContent={<Pressable onPress={() => setEditing(!editing)} p="1"><Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" /></Pressable>}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Box mb="3">
                    <TopRefreshButton
                        onPress={load}
                        bgColor="admin.600"
                        pressedBgColor="admin.700"
                    />
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text fontSize="xs" color="coolGray.500" mb="1">Status</Text>
                            <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                                {statusLabel(user.active)}
                            </Text>
                        </VStack>
                        <Pressable
                            onPress={handleToggleActive}
                            px="4"
                            py="2"
                            bg={user.active === 1 ? 'red.50' : 'green.50'}
                            _pressed={{ bg: user.active === 1 ? 'red.100' : 'green.100' }}
                            borderRadius="lg"
                        >
                            <Text fontSize="xs" fontWeight="700" color={user.active === 1 ? 'red.500' : 'green.500'}>
                                {user.active === 1 ? 'Desativar' : 'Ativar'}
                            </Text>
                        </Pressable>
                    </HStack>
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    {editing ? (
                        <VStack space={3}>
                            <FormControl isRequired>
                                <FormControl.Label>Nome do usuário</FormControl.Label>
                                <Input value={username} onChangeText={setUsername} autoCapitalize="none" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormControl.Label>Email</FormControl.Label>
                                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            </FormControl>
                            <FormControl>
                                <FormControl.Label>Senha (deixe em branco para não alterar)</FormControl.Label>
                                <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 8 caracteres" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormControl.Label>Regra</FormControl.Label>
                                <Select
                                    selectedValue={role}
                                    onValueChange={(itemValue) => setRole(itemValue as UserRole)}
                                    accessibilityLabel="Selecione o perfil"
                                    placeholder="Selecione o perfil"
                                >
                                    <Select.Item label="Aluno" value={UserRole.STUDENT} />
                                    <Select.Item label="Motorista" value={UserRole.DRIVER} />
                                    <Select.Item label="Administrador" value={UserRole.ADMIN} />
                                </Select>
                            </FormControl>
                            <HStack space={2} mt="2">
                                <Button flex={1} variant="outline" colorScheme="blue" onPress={() => setEditing(false)} borderRadius="xl">Cancelar</Button>
                                <Button flex={1} bg="blue.500" _pressed={{ bg: 'blue.600' }} onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
                            </HStack>
                        </VStack>
                    ) : (
                        <VStack space={0}>
                            <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Informações</Text>
                            <InfoRow label="ID" value={user.id} />
                            <InfoRow label="Nome do usuário" value={user.username} />
                            <InfoRow label="Email" value={user.email} />
                            <InfoRow label="Perfil" value={roleLabel(user.role)} />
                            <InfoRow label="Criado em" value={new Date(user.createdAt).toLocaleDateString('pt-BR')} />
                            <InfoRow label="Atualizado em" value={new Date(user.updatedAt).toLocaleDateString('pt-BR')} />
                        </VStack>
                    )}
                </Box>
            </ScrollView>
        </Box>
    );
}
