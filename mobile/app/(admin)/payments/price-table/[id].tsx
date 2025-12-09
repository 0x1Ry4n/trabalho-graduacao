import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, VStack, HStack, Text, ScrollView, Badge, Button, Icon, FormControl, Input, useToast,
    Pressable,
} from 'native-base';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { priceTablesApi } from '../../../../src/api/priceTables';
import { PriceTable, AccountReceivableType, PaymentType } from '../../../../src/types';
import { ScreenHeader } from '../../../../src/components/ui/ScreenHeader';
import { LoadingSpinner, InfoRow } from '../../../../src/components/shared';
import { formatCurrency, maskCurrency, unmaskCurrency } from '../../../../src/utils/masks';
import { useFormError } from '../../../../src/utils/error.utils';
import { ErrorDisplay } from '../../../../src/components/ui/ErrorDisplay';
import DatePickerInput from '../../../../src/components/ui/DatePickerInput';

function typeLabel(type: AccountReceivableType) {
    return type === 'ENROLLMENT_FEE' ? 'Taxa de Matrícula' : 'Mensalidade';
}

function paymentTypeLabel(type: PaymentType) {
    switch (type) {
        case 'CASH': return 'Dinheiro';
        case 'CREDIT_CARD': return 'Cartão de Crédito';
        case 'DEBIT_CARD': return 'Cartão de Débito';
        case 'PIX': return 'PIX';
        case 'BANK_TRANSFER': return 'Transferência Bancária';
        case 'ANY': return 'Qualquer';
        default: return type;
    }
}

export default function PriceTableDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const toast = useToast();
    const { error: formError, isLoading: saving, clearError, withFormError } = useFormError();

    const [priceTable, setPriceTable] = useState<PriceTable | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [price, setPrice] = useState('');
    const [dueDate, setDueDate] = useState('');

    const load = useCallback(async () => {
        try {
            const data = await priceTablesApi.getById(id!);

            const normalized: PriceTable = {
                ...data,
                price: Number(data.price ?? 0),
                dueDate: data.dueDate ?? '',
            };

            setPriceTable(normalized);
            setPrice(formatCurrency(String(normalized.price ?? 0)));
            setDueDate(normalized.dueDate ? normalized.dueDate.split('T')[0] : '');
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar o preço.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { if (id) load(); }, [id, load]);

    const handleSave = withFormError(async () => {
        if (!price || !dueDate) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }
        const updated = await priceTablesApi.update(id!, {
            price: Number(unmaskCurrency(price)),
            dueDate: new Date(dueDate).toISOString(),
        });
        setPriceTable(updated);
        setEditing(false);
        toast.show({ description: 'Preço atualizado com sucesso!', placement: 'top' });
    });

    async function handleToggleActive() {
        if (!priceTable) return;

        try {
            const updated =
                priceTable.active === 1
                    ? await priceTablesApi.inactivate(String(priceTable.id))
                    : await priceTablesApi.activate(String(priceTable.id));

            setPriceTable({
                ...updated,
                price: Number(updated.price ?? 0),
                dueDate: updated.dueDate ?? '',
            });

            toast.show({
                description: `Preço ${updated.active === 1 ? 'ativado' : 'desativado'} com sucesso!`,
                placement: 'top',
            });
        } catch {
            Alert.alert('Erro', 'Não foi possível alterar o status.');
        }
    }
    if (loading) return <LoadingSpinner color="admin.600" />;
    if (!priceTable) return null;

    const baseInputProps = {
        variant: 'filled',
        bg: 'coolGray.50',
        borderRadius: 'xl',
        borderColor: 'coolGray.300',
        _dark: { bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } },
        _focus: { borderColor: 'admin.600', bg: 'white' },
        fontSize: 'sm',
    } as const;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title={typeLabel(priceTable.type)}
                showBack
                showMenu={false}
                rightContent={<Pressable onPress={() => setEditing(!editing)} p="1"><Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" /></Pressable>}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text fontSize="2xl" fontWeight="800" color="coolGray.800" _dark={{ color: 'white' }}>
                                {"R$ " + formatCurrency(String(priceTable.price ?? 0))}
                            </Text>
                            <Badge
                                colorScheme={priceTable.active === 1 ? 'success' : 'coolGray'}
                                borderRadius="full"
                                variant="subtle"
                                alignSelf="flex-start"
                                mt="1"
                            >
                                <Text fontSize="2xs" fontWeight="700">
                                    {priceTable.active === 1 ? 'Ativo' : 'Inativo'}
                                </Text>
                            </Badge>
                        </VStack>
                        <Pressable
                            onPress={handleToggleActive}
                            px="4"
                            py="2"
                            bg={priceTable.active === 1 ? 'red.50' : 'green.50'}
                            _pressed={{ bg: priceTable.active === 1 ? 'red.100' : 'green.100' }}
                            borderRadius="lg"
                        >
                            <Text fontSize="xs" fontWeight="700" color={priceTable.active === 1 ? 'red.500' : 'green.500'}>
                                {priceTable.active === 1 ? 'Desativar' : 'Ativar'}
                            </Text>
                        </Pressable>
                    </HStack>
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
                        {editing ? 'Editar Preço' : 'Dados'}
                    </Text>

                    {editing ? (
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
                            <DatePickerInput
                                label="Data de Vencimento"
                                value={dueDate}
                                onChange={setDueDate}
                                required
                            />
                            <HStack space={2} mt="2">
                                <Button
                                    flex={1}
                                    variant="outline"
                                    colorScheme="admin"
                                    borderRadius="xl"
                                    onPress={() => { setEditing(false); clearError(); }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    flex={1}
                                    colorScheme="admin"
                                    borderRadius="xl"
                                    isLoading={saving}
                                    onPress={handleSave}
                                >
                                    Salvar
                                </Button>
                            </HStack>
                        </VStack>
                    ) : (
                        <VStack space={0}>
                            <InfoRow label="Tipo" value={typeLabel(priceTable.type)} />
                            <InfoRow label="Forma de Pagamento" value={paymentTypeLabel(priceTable.paymentType)} />
                            <InfoRow label="Vencimento" value={new Date(priceTable.dueDate).toLocaleDateString('pt-BR')} />
                            <InfoRow label="Criado em" value={new Date(priceTable.createdAt).toLocaleDateString('pt-BR')} />
                        </VStack>
                    )}
                </Box>
            </ScrollView>
        </Box>
    );
}
