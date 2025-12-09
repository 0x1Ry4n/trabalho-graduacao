import React, { useEffect, useState, useCallback } from 'react';
import { Box, VStack, HStack, Text, Icon, FlatList, Pressable, Button, useToast } from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { TopRefreshButton, LoadingSpinner, SearchBar } from '../../../src/components/shared';
import DatePickerInput from '../../../src/components/ui/DatePickerInput';
import { auditApi } from '../../../src/api/audit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function isWithinPeriod(item: any, start: string, end: string) {
    if (!start && !end) return true;
    const created = item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : null;
    if (!created) return false;
    if (start && created < start) return false;
    if (end && created > end) return false;
    return true;
}

export default function AuditLogsAdmin() {
    const HEADER_COLOR = '#1E40AF';
    const [searchVisible, setSearchVisible] = useState(false);
    const toast = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [search, setSearch] = useState('');

    const load = useCallback(async (p = 1) => {
        try {
            const resp = await auditApi.listPaginated(p, 50);
            setLogs(resp.items || []);
            setFiltered(resp.items || []);
        } catch (err) {
            const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Não foi possível carregar logs de auditoria.';
            Alert.alert('Erro', String(message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(1); }, [load]);

    useEffect(() => {
        const f = logs.filter(l => {
            if (!isWithinPeriod(l, periodStart, periodEnd)) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return String(l.action ?? '').toLowerCase().includes(q)
                || String(l.entityType ?? '').toLowerCase().includes(q)
                || String(l.entityId ?? '').toLowerCase().includes(q)
                || String(l.userId ?? '').toLowerCase().includes(q);
        });
        setFiltered(f);
    }, [logs, periodStart, periodEnd, search]);

    const exportCsv = async () => {
        try {
            toast.show({ description: 'Preparando exportação...', placement: 'top' });
            let all: any[] = [];
            let p = 1;
            while (true) {
                const resp = await auditApi.listPaginated(p, 200);
                if (!resp.items || resp.items.length === 0) break;
                all = all.concat(resp.items);
                if (resp.items.length < 200) break;
                p += 1;
            }

            const filteredAll = all.filter(item => isWithinPeriod(item, periodStart, periodEnd));

            const header = ['id', 'userId', 'action', 'entityType', 'entityId', 'createdAt', 'oldValues', 'newValues', 'ipAddress', 'userAgent'];
            const rows = filteredAll.map(r => {
                const oldV = r.oldValues ? JSON.stringify(r.oldValues) : '';
                const newV = r.newValues ? JSON.stringify(r.newValues) : '';
                const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                return [r.id, r.userId, r.action, r.entityType, r.entityId, r.createdAt, oldV, newV, r.ipAddress, r.userAgent].map(escape).join(',');
            });

            const csv = `${header.join(',')}\n${rows.join('\n')}`;
            const fileName = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            const path = FileSystem.cacheDirectory + fileName;
            await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(path, { mimeType: 'text/csv' });
        } catch (err) {
            const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Falha ao exportar logs.';
            Alert.alert('Erro', String(message));
        }
    };

    if (loading) return <LoadingSpinner color="admin.600" />;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title="Logs de Auditoria"
                subtitle={`${filtered.length} registros`}
                bg={HEADER_COLOR}
                rightContent={
                    <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
                        <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
                    </Pressable>
                }
            />

            {searchVisible && (
                <SearchBar value={search} onChangeText={setSearch} placeholder="Pesquisar por usuário, ação ou entidade..." />
            )}

            <FlatList
                data={filtered}
                keyExtractor={(item, index) => {
                    const idPart = item.id?.toString() ?? 'no-id';
                    return `${idPart}-${index}`;
                }}
                contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                ListHeaderComponent={() => (
                    <Box mb="3">
                        <TopRefreshButton onPress={() => load(1)} bgColor="admin.600" pressedBgColor="admin.700" />
                        <VStack space={3} mt={3}>
                            <HStack space={2}>
                                <DatePickerInput label="Início" value={periodStart} onChange={setPeriodStart} flex={1} />
                                <DatePickerInput label="Fim" value={periodEnd} onChange={setPeriodEnd} flex={1} />
                            </HStack>
                            <HStack justifyContent="flex-end">
                                <Button
                                    size="sm"
                                    colorScheme="admin"
                                    variant="ghost"
                                    onPress={exportCsv}
                                    leftIcon={<Icon as={Ionicons} name="download" size="4" />}
                                >
                                    Exportar
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1); }} />}
                renderItem={({ item, index }) => {
                    const itemKey = `${item.id?.toString() ?? 'no-id'}-${index}`;
                    return (
                        <Pressable key={itemKey} mb="2" onPress={() => { }}>
                            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
                                <HStack justifyContent="space-between">
                                    <VStack>
                                        <Text fontWeight="700">{item.action} — {item.entityType}#{item.entityId}</Text>
                                        <Text fontSize="xs" color="coolGray.500">
                                            Usuário: {item.userId ?? 'sistema'} — {new Date(item.createdAt).toLocaleString()}
                                        </Text>
                                        {item.userAgent && (
                                            <Text fontSize="xs" color="coolGray.500">UA: {item.userAgent}</Text>
                                        )}
                                    </VStack>
                                </HStack>
                            </Box>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={() => (
                    <Text color="coolGray.500">Nenhum log encontrado...</Text>
                )} />
        </Box>
    );
}
