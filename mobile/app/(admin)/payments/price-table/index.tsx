import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, VStack, HStack, Text, FlatList, Pressable, Icon, Badge, Modal, Button,
    FormControl, Input, Select, useToast,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { priceTablesApi } from '../../../../src/api/priceTables';
import { PriceTable, AccountReceivableType, PaymentType, CreatePriceTableDto } from '../../../../src/types';
import { ScreenHeader } from '../../../../src/components/ui/ScreenHeader';
import { maskCurrency, unmaskCurrency } from '../../../../src/utils/masks';
import { useFormError } from '../../../../src/utils/error.utils';
import { ErrorDisplay } from '../../../../src/components/ui/ErrorDisplay';
import DatePickerInput from '../../../../src/components/ui/DatePickerInput';
import { LoadingSpinner, EmptyState, AddFab, TopRefreshButton } from '../../../../src/components/shared';

function typeLabel(type: AccountReceivableType) {
    return type === 'ENROLLMENT_FEE' ? 'Taxa de Matrícula' : 'Mensalidade';
}

function paymentTypeLabel(type: PaymentType) {
    switch (type) {
        case 'CASH': return 'Dinheiro';
        case 'CREDIT_CARD': return 'Cartão de Crédito';
        case 'DEBIT_CARD': return 'Cartão de Débito';
        case 'PIX': return 'PIX';
        case 'BANK_TRANSFER': return 'Transferência';
        case 'ANY': return 'Qualquer';
        default: return type;
    }
}

export default function PriceTableScreen() {
    const toast = useToast();
    const { error: formError, isLoading: saving, clearError, withFormError } = useFormError();

    const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    const [price, setPrice] = useState('');
    const [type, setType] = useState<AccountReceivableType | ''>('');
    const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.ANY);
    const [dueDate, setDueDate] = useState('');

    const baseInputProps = {
        variant: 'filled',
        bg: 'coolGray.50',
        borderRadius: 'xl',
        borderColor: 'coolGray.300',
        _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } },
        _focus: { borderColor: 'admin.600', bg: 'white' },
        fontSize: 'sm',
    } as const;

    const load = useCallback(async () => {
        try {
            const data = await priceTablesApi.list();
            setPriceTables(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar a tabela de preços.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setPrice('');
        setType('');
        setPaymentType(PaymentType.ANY);
        setDueDate('');
    };

    const handleCreate = withFormError(async () => {
        if (!price || !type || !dueDate) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
            return;
        }

        const dto: CreatePriceTableDto = {
            price: Number(unmaskCurrency(price)),
            type: type as AccountReceivableType,
            paymentType,
            dueDate: new Date(dueDate).toISOString(),
        };

        const newPriceTable = await priceTablesApi.create(dto);
        setPriceTables(prev => [...prev, newPriceTable]);
        toast.show({ description: 'Preço criado com sucesso!', placement: 'top' });
        setShowCreate(false);
        resetForm();
    });

    if (loading) return <LoadingSpinner color="admin.600" />;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title="Tabela de Preços"
                subtitle={`${priceTables.length} registros`}
                showBack
                showMenu={false}
            />

            <FlatList
                data={priceTables}
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
                    <Pressable
                        onPress={() => router.push(`/(admin)/payments/price-table/${item.id}` as any)}
                        mb="3"
                        _pressed={{ opacity: 0.85 }}
                    >
                        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="4" shadow="1">
                            <HStack justifyContent="space-between" alignItems="center" mb="2">
                                <Text fontSize="lg" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>
                                    {maskCurrency(String(item.price ?? 0))}
                                </Text>
                                <HStack alignItems="center" space={2}>
                                    <Badge
                                        colorScheme={item.active === 1 ? 'success' : 'coolGray'}
                                        borderRadius="full"
                                        variant="subtle"
                                        px="2"
                                    >
                                        <Text fontSize="2xs" fontWeight="700">
                                            {item.active === 1 ? 'Ativo' : 'Inativo'}
                                        </Text>
                                    </Badge>
                                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                                </HStack>
                            </HStack>

                            <Text fontSize="sm" color="coolGray.600" _dark={{ color: 'coolGray.300' }} mb="1">
                                {typeLabel(item.type)}
                            </Text>
                            <Text fontSize="xs" color="coolGray.500" mb="1">
                                Pagamento: {paymentTypeLabel(item.paymentType)}
                            </Text>
                            <Text fontSize="xs" color="coolGray.500">
                                Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                            </Text>
                        </Box>
                    </Pressable>
                )}
                ListEmptyComponent={<EmptyState icon="cash-outline" message="Nenhum preço cadastrado" />}
            />

            <AddFab onPress={() => setShowCreate(true)} bg="admin.600" pressedBg="admin.700" />

            <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} size="full">
                <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
                    <Modal.CloseButton />
                    <Modal.Header borderBottomWidth={0}>
                        <Text fontSize="lg" fontWeight="700">Novo Preço</Text>
                    </Modal.Header>
                    <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
                        <VStack space={3}>
                            <ErrorDisplay error={formError} onDismiss={clearError} />
                            <FormControl isRequired>
                                <FormControl.Label>Valor</FormControl.Label>
                                <Input
                                    {...baseInputProps}
                                    placeholder="R$ 0,00"
                                    value={price}
                                    onChangeText={(v) => setPrice(maskCurrency(v))}
                                    keyboardType="numeric"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormControl.Label>Tipo</FormControl.Label>
                                <Select
                                    {...baseInputProps}
                                    selectedValue={type}
                                    onValueChange={(v) => setType(v as AccountReceivableType)}
                                    placeholder="Selecione o tipo"
                                >
                                    <Select.Item label="Taxa de Matrícula" value={AccountReceivableType.ENROLLMENT_FEE} />
                                    <Select.Item label="Mensalidade" value={AccountReceivableType.MONTHLY_FEE} />
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormControl.Label>Forma de Pagamento</FormControl.Label>
                                <Select
                                    {...baseInputProps}
                                    selectedValue={paymentType}
                                    onValueChange={(v) => setPaymentType(v as PaymentType)}
                                >
                                    <Select.Item label="Qualquer" value={PaymentType.ANY} />
                                    <Select.Item label="Dinheiro" value={PaymentType.CASH} />
                                    <Select.Item label="Cartão de Crédito" value={PaymentType.CREDIT_CARD} />
                                    <Select.Item label="Cartão de Débito" value={PaymentType.DEBIT_CARD} />
                                    <Select.Item label="PIX" value={PaymentType.PIX} />
                                    <Select.Item label="Transferência Bancária" value={PaymentType.BANK_TRANSFER} />
                                </Select>
                            </FormControl>

                            <DatePickerInput
                                label="Data de Vencimento"
                                value={dueDate}
                                onChange={setDueDate}
                                required
                            />
                        </VStack>
                    </Modal.Body>
                    <Modal.Footer borderTopWidth={0}>
                        <Button.Group space={2} w="full">
                            <Button flex={1} variant="outline" colorScheme="admin" onPress={() => { setShowCreate(false); resetForm(); }} borderRadius="xl">
                                Cancelar
                            </Button>
                            <Button flex={1} colorScheme="admin" onPress={handleCreate} isLoading={saving} borderRadius="xl">
                                Criar
                            </Button>
                        </Button.Group>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </Box>
    );
}
