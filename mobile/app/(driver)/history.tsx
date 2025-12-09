import React, { useEffect, useState } from 'react';
import {
  Box, HStack, Text, Icon,
  VStack, Pressable,
} from 'native-base';
import { RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPendingValidations } from '../../src/database/validations.repo';
import { PendingValidation, CardValidationStatus, CachedStudent } from '../../src/types';
import { getAllCachedStudents } from '../../src/database/students.repo';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { LoadingSpinner, EmptyState, SearchBar, TopRefreshButton } from '../../src/components/shared';
import { useSync } from '../../src/hooks/useSync';
import DatePickerInput from '../../src/components/ui/DatePickerInput';

function getDateOnly(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DriverHistoryScreen() {
  const { isConnected, isSyncing, syncAll } = useSync();
  const [validations, setValidations] = useState<PendingValidation[]>([]);
  const [students, setStudents] = useState<Map<string, CachedStudent>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);

  async function load() {
    try {
      const [vals, cached] = await Promise.all([getPendingValidations(), getAllCachedStudents()]);
      setValidations(vals);
      setStudents(new Map(cached.map((s) => [s.id, s])));
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSync() {
    if (!isConnected || isSyncing) return;
    await syncAll();
    await load();
  }

  if (loading) return <LoadingSpinner color="driver.600" />;

  const filteredValidations = validations.filter((validation) => {
    const student = students.get(validation.studentId);
    const term = studentFilter.trim().toLowerCase();
    const matchesStudent = !term || [
      student?.name,
      student?.cpf,
      validation.studentId,
    ].some((value) => String(value ?? '').toLowerCase().includes(term));
    const matchesDate = !dateFilter || getDateOnly(validation.timestamp) === dateFilter;
    return matchesStudent && matchesDate;
  });

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Histórico"
        subtitle={`${filteredValidations.length} validações`}
        bg="#059669"
        rightContent={(
          <Pressable onPress={() => setFiltersVisible((current) => !current)} p="1" borderRadius="lg">
            <Icon as={Ionicons} name={filtersVisible ? 'close' : 'search'} size="5" color="white" />
          </Pressable>
        )}
      />
      {filtersVisible ? (
        <>
          <SearchBar
            value={studentFilter}
            onChangeText={setStudentFilter}
            placeholder="Filtrar por aluno ou CPF"
          />

      <Box px="3" py="3" bg="white" _dark={{ bg: 'coolGray.800' }} borderBottomWidth={1} borderBottomColor="coolGray.100">
        <HStack space={2} alignItems="flex-end">
          <Box flex={1}>
            <DatePickerInput label="Data" value={dateFilter} onChange={setDateFilter} />
          </Box>
          {dateFilter ? (
            <Pressable
              onPress={() => setDateFilter('')}
              w="10"
              h="10"
              mb="1"
              borderRadius="xl"
              bg="coolGray.100"
              _dark={{ bg: 'coolGray.700' }}
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={Ionicons} name="close" size="5" color="coolGray.600" />
            </Pressable>
          ) : null}
        </HStack>
          </Box>
        </>
      ) : null}

      <FlatList
        data={filteredValidations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <Box mb="3">
            <TopRefreshButton
              onPress={handleSync}
              label={isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              bgColor="driver.600"
              pressedBgColor="driver.700"
            />
          </Box>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => {
          const student = students.get(item.studentId);
          const isValid = item.status === CardValidationStatus.VALID;
          return (
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" mb="2" shadow="1">
              <HStack alignItems="center" space={3}>
                <Box w="2.5" h="2.5" borderRadius="full" bg={isValid ? 'green.500' : 'red.500'} />
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                    {student?.name ?? 'Estudante desconhecido'}
                  </Text>
                  <Text fontSize="xs" color="coolGray.400">
                    {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </Text>
                </VStack>
                <VStack alignItems="flex-end" space={1}>
                  <Text fontSize="xs" fontWeight="700" color={isValid ? 'green.600' : 'red.500'}>
                    {isValid ? 'VALIDO' : 'INVALIDO'}
                  </Text>
                  {!item.synced && (
                    <HStack bg="amber.50" borderRadius="lg" px="2" py="1" alignItems="center" space={1.5}>
                      <Icon as={Ionicons} name="cloud-offline-outline" size="4" color="amber.500" />
                      <Text fontSize="xs" color="amber.600" fontWeight="700">Pendente</Text>
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </Box>
          );
        }}
        ListEmptyComponent={<EmptyState icon="time-outline" message="Nenhuma validação registrada" />}
      />
    </Box>
  );
}
