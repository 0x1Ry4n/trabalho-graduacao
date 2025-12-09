import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable, Badge,
    Modal, Button, FormControl, useToast, Select,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../../src/api/users';
import { User, UserRole } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { router } from 'expo-router';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, TopRefreshButton } from '../../../src/components/shared';
import { useFormError } from '../../../src/utils/error.utils';

function statusLabel(active: number) {
    return active === 1 ? 'Ativo' : 'Inativo';
}

function statusColor(active: number) {
    return active === 1 ? 'success' : 'warning';
}

function roleLabel(role: UserRole) {
    return role === UserRole.ADMIN ? 'Administrador' : role === UserRole.DRIVER ? 'Motorista' : role === UserRole.STUDENT ? 'Aluno' : 'tESTE';
}

export default function UsersListScreen() {
    const toast = useToast();
    const { error: createError, fieldErrors, isLoading: saving, clearError, withFormError } = useFormError();
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await usersApi.list();
            setUsers(data);
            setFiltered(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar os usuários.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(users);
            return;
        }

        const q = search.toLowerCase();
        setFiltered(users.filter((u) =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        ));
    }, [search, users]);

    const baseInputProps = {
        variant: 'filled',
        bg: 'coolGray.50',
        borderRadius: 'xl',
        borderColor: 'coolGray.300',
        _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'blue.400', bg: 'coolGray.700' } },
        _focus: { borderColor: 'blue.600', bg: 'white' },
        fontSize: 'sm',
    } as const;

    function resetForm() {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole(UserRole.STUDENT);
        setIsEditing(false);
        setEditingUserId(null);
        clearError();
    }

    function openEdit(user: User) {
        setEditingUserId(user.id);
        setIsEditing(true);
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setPassword('');
        setShowCreate(true);
    }

    const handleCreate = withFormError(async () => {
        if (!username.trim() || !email.trim()) {
            Alert.alert('Atenção', 'Preencha username e email.');
            return;
        }
        if (!isEditing && !password.trim()) {
            Alert.alert('Atenção', 'Preencha a senha para criar usuário.');
            return;
        }
        if (password.trim().length > 0 && password.trim().length < 8) {
            Alert.alert('Atenção', 'Senha deve ter pelo menos 8 caracteres.');
            return;
        }
        const payload: any = { username: username.trim(), email: email.trim(), role };
        if (password.trim()) payload.password = password.trim();

        if (isEditing && editingUserId) {
            await usersApi.update(editingUserId, payload);
            toast.show({ description: 'Usuário atualizado com sucesso!', placement: 'top' });
        } else {
            await usersApi.create(payload);
            toast.show({ description: 'Usuário criado com sucesso!', placement: 'top' });
        }
        resetForm();
        setShowCreate(false);
        load();
    });

    if (loading) return <LoadingSpinner color="admin.600" />;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title="Usuários"
                subtitle={`${filtered.length} usuários`}
                bg="#2f95dc"
                rightContent={
                    <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
                        <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
                    </Pressable>
                }
            />

            {searchVisible && (
                <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por username ou email..." />
            )}

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                ListHeaderComponent={
                    <Box mb="3">
                        <TopRefreshButton
                            onPress={load}
                            bgColor="admin.600"
                            pressedBgColor="admin.700"
                        />
                    </Box>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
                }
                renderItem={({ item }) => (
                    <Pressable onPress={() => router.push(`/(admin)/users/${item.id}`)} mb="2">
                        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
                            <HStack alignItems="center" space={3}>
                                <Box w="10" h="10" borderRadius="full" bg="blue.100" alignItems="center" justifyContent="center">
                                    <Text color="blue.500" fontWeight="700" fontSize="lg">
                                        {item.username.charAt(0).toUpperCase()}
                                    </Text>
                                </Box>
                                <VStack flex={1}>
                                    <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} numberOfLines={1}>
                                        {item.username}
                                    </Text>
                                    <Text fontSize="xs" color="coolGray.500">{item.email}</Text>

                                </VStack>
                                <HStack alignItems="center" space={3}>
                                    <Badge colorScheme={item.role === 'ADMIN' ? 'danger' : item.role === 'DRIVER' ? 'info' : 'success'} borderRadius="full" px="2">
                                        <Text fontSize="2xs" fontWeight="700">{roleLabel(item.role)}</Text>
                                    </Badge>
                                    <Badge colorScheme={statusColor(item.active)} borderRadius="full" px="2">
                                        <Text fontSize="2xs" fontWeight="700">{statusLabel(item.active)}</Text>
                                    </Badge>
                                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                                </HStack>
                            </HStack>
                        </Box>
                    </Pressable>
                )}
                ListEmptyComponent={<EmptyState icon="people-outline" message="Nenhum usuário encontrado" />}
            />

            <AddFab onPress={() => { resetForm(); setShowCreate(true); }} bg="blue.500" pressedBg="blue.600" />

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
                <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
                    <Modal.CloseButton />
                    <Modal.Header borderBottomWidth={0}>
                        <Text fontSize="lg" fontWeight="700">{isEditing ? 'Editar usuário' : 'Criar novo usuário'}</Text>
                    </Modal.Header>

                    <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
                        <VStack space={3}>
                            <ErrorDisplay error={createError} onDismiss={clearError} />
                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">CONTA</Text>
                            <FormControl isRequired isInvalid={!!fieldErrors.username}>
                                <FormControl.Label>Nome do usuário</FormControl.Label>
                                <Input {...baseInputProps} placeholder="Ex: joao.silva" value={username} onChangeText={setUsername} autoCapitalize="none" />
                                <FormControl.ErrorMessage>{fieldErrors.username}</FormControl.ErrorMessage>
                            </FormControl>
                            <FormControl isRequired isInvalid={!!fieldErrors.email}>
                                <FormControl.Label>Email</FormControl.Label>
                                <Input {...baseInputProps} placeholder="usuario@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                <FormControl.ErrorMessage>{fieldErrors.email}</FormControl.ErrorMessage>
                            </FormControl>
                            <FormControl isRequired={!isEditing} isInvalid={!!fieldErrors.password}>
                                <FormControl.Label>{isEditing ? 'Nova Senha (opcional)' : 'Senha'}</FormControl.Label>
                                <Input {...baseInputProps} value={password} onChangeText={setPassword} secureTextEntry placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'Mínimo 8 caracteres'} />
                                <FormControl.ErrorMessage>{fieldErrors.password}</FormControl.ErrorMessage>
                            </FormControl>

                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">PERFIL</Text>
                            <FormControl isRequired isInvalid={!!fieldErrors.role}>
                                <FormControl.Label>Regra</FormControl.Label>
                                <Select
                                    {...baseInputProps}
                                    selectedValue={role}
                                    onValueChange={(itemValue) => setRole(itemValue as UserRole)}
                                    accessibilityLabel="Selecione o perfil"
                                    placeholder="Selecione o perfil"
                                >
                                    <Select.Item label="Aluno" value={UserRole.STUDENT} />
                                    <Select.Item label="Motorista" value={UserRole.DRIVER} />
                                    <Select.Item label="Administrador" value={UserRole.ADMIN} />
                                </Select>
                                <FormControl.ErrorMessage>{fieldErrors.role}</FormControl.ErrorMessage>
                            </FormControl>
                        </VStack>
                    </Modal.Body>
                    <Modal.Footer borderTopWidth={0}>
                        <Button.Group space={2} w="full">
                            <Button flex={1} variant="outline" colorScheme="blue" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
                            <Button flex={1} colorScheme="blue" onPress={handleCreate} isLoading={saving} borderRadius="xl">{isEditing ? 'Atualizar' : 'Criar Usuário'}</Button>
                        </Button.Group>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </Box>
    );
}
