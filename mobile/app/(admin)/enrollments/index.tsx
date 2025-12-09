import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, VStack, HStack, Text, Input, Icon, FlatList, Pressable, Badge,
    Modal, Button, FormControl, useToast,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { enrollmentsApi } from '../../../src/api/enrollments';
import { BASE_URL } from '../../../src/api/client';
import { studentsApi } from '../../../src/api/students';
import { collegesApi } from '../../../src/api/colleges';
import { Enrollment, EnrollmentStatus, Student, College, AccountReceivableType } from '../../../src/types';
import { priceTablesApi } from '../../../src/api/priceTables';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { maskCPF, maskCurrency, unmaskCurrency } from '../../../src/utils/masks';
import { useFormError } from '../../../src/utils/error.utils';
import { ErrorDisplay } from '../../../src/components/ui/ErrorDisplay';
import { LoadingSpinner, EmptyState, SearchBar, AddFab, SearchModal, TopRefreshButton } from '../../../src/components/shared';

function statusLabel(s: EnrollmentStatus) {
    return s === 'ACTIVE' ? 'Ativo' : s === 'CANCELED' ? 'Cancelado' : 'Encerrado';
}

function statusColor(s: EnrollmentStatus) {
    return s === 'ACTIVE' ? 'success' : s === 'CANCELED' ? 'error' : 'coolGray';
}

export default function EnrollmentsListScreen() {
    const toast = useToast();
    const { error: createError, isLoading: saving, clearError, withFormError } = useFormError();

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [filtered, setFiltered] = useState<Enrollment[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);

    // Search states for student and college
    const [students, setStudents] = useState<Student[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [showStudentSearch, setShowStudentSearch] = useState(false);
    const [showCollegeSearch, setShowCollegeSearch] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [collegeSearch, setCollegeSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

    // Create form
    const [course, setCourse] = useState('');
    const [semester, setSemester] = useState('');
    const [year, setYear] = useState('');
    const [monthlyFee, setMonthlyFee] = useState('');
    const [enrollmentFee, setEnrollmentFee] = useState('');
    const [collegeEnrollmentUrl, setCollegeEnrollmentUrl] = useState('');
    const [loadingPrices, setLoadingPrices] = useState(false);

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
            const data = await enrollmentsApi.list();
            setEnrollments(data);
            setFiltered(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar as matrículas.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (search.trim()) {
            const filteredData = enrollments.filter(item =>
                item.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
                item.cardCode?.toLowerCase().includes(search.toLowerCase()) ||
                item.student?.cpf?.includes(search)
            );
            setFiltered(filteredData);
        } else {
            setFiltered(enrollments);
        }
    }, [search, enrollments]);

    const loadStudentsAndColleges = useCallback(async () => {
        try {
            const [studentsData, collegesData] = await Promise.all([
                studentsApi.list(),
                collegesApi.list(),
            ]);
            setStudents(studentsData);
            setColleges(collegesData);
        } catch {
        }
    }, []);

    useEffect(() => { loadStudentsAndColleges(); }, [loadStudentsAndColleges]);

    const loadPricesForModal = useCallback(async () => {
        setLoadingPrices(true);
        try {
            const [mfPrice, efPrice] = await Promise.all([
                (async () => {
                    try {
                        const priceTable = await priceTablesApi.getByType(AccountReceivableType.MONTHLY_FEE);
                        if (priceTable && priceTable.active === 1) {
                            return maskCurrency(String(Math.round(Number(priceTable.price) * 100)));
                        }
                        const list = await priceTablesApi.list();
                        const found = list.find(item => item.type === AccountReceivableType.MONTHLY_FEE && item.active === 1);
                        return found ? maskCurrency(String(Math.round(Number(found.price) * 100))) : '';
                    } catch {
                        return '';
                    }
                })(),
                (async () => {
                    try {
                        const priceTable = await priceTablesApi.getByType(AccountReceivableType.ENROLLMENT_FEE);
                        if (priceTable && priceTable.active === 1) {
                            return maskCurrency(String(Math.round(Number(priceTable.price) * 100)));
                        }
                        const list = await priceTablesApi.list();
                        const found = list.find(item => item.type === AccountReceivableType.ENROLLMENT_FEE && item.active === 1);
                        return found ? maskCurrency(String(Math.round(Number(found.price) * 100))) : '';
                    } catch {
                        return '';
                    }
                })(),
            ]);
            setMonthlyFee(mfPrice);
            setEnrollmentFee(efPrice);
            if (!mfPrice || !efPrice) {
                toast.show({
                    description: 'Aviso: Tabela de preços não configurada.',
                    placement: 'top',
                    duration: 3000,
                });
            }
        } finally {
            setLoadingPrices(false);
        }
    }, [toast]);

    useEffect(() => {
        if (showCreate) {
            loadPricesForModal();
        }
    }, [showCreate, loadPricesForModal]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
            });
            if (result.canceled) return;
            const file = result.assets[0];
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as any);
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            setCollegeEnrollmentUrl(data.url);
            toast.show({ description: 'Arquivo anexado com sucesso!', placement: 'top' });
        } catch (error) {
            Alert.alert('Erro', 'Falha ao anexar arquivo.');
        }
    };

    const handleCreate = withFormError(async () => {
        if (!selectedStudent || !selectedCollege || !course.trim() || !semester || !year || !monthlyFee || !enrollmentFee) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
            return;
        }

        const dto: any = {
            studentId: Number(selectedStudent.id),
            collegeId: Number(selectedCollege.id),
            course: course.trim(),
            semester: Number(semester),
            year: Number(year),
            monthlyFee: Number(unmaskCurrency(monthlyFee)),
            enrollmentFee: Number(unmaskCurrency(enrollmentFee)),
        };

        if (collegeEnrollmentUrl) {
            dto.collegeEnrollmentUrl = collegeEnrollmentUrl;
        }

        const newEnrollment = await enrollmentsApi.create(dto);
        setEnrollments(prev => [...prev, newEnrollment]);
        setShowCreate(false);
        resetForm();
        toast.show({ description: 'Matrícula criada com sucesso!', placement: 'top' });
    });

    function resetForm() {
        setCourse('');
        setSemester('');
        setYear('');
        setMonthlyFee('');
        setEnrollmentFee('');
        setSelectedStudent(null);
        setSelectedCollege(null);
        setCollegeEnrollmentUrl('');
    }

    if (loading) return <LoadingSpinner color="admin.600" />;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title="Matrículas"
                subtitle={`${filtered.length} registros`}
                rightContent={
                    <Pressable onPress={() => setSearchVisible(!searchVisible)} p="1">
                        <Icon as={Ionicons} name={searchVisible ? 'close' : 'search'} size="5" color="white" />
                    </Pressable>
                }
            />

            {searchVisible && (
                <SearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar por nome, cartão ou CPF..."
                />
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
                    <Pressable onPress={() => router.push({ pathname: '/(admin)/enrollments/[id]', params: { id: item.id } })} mb="2">
                        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="3" shadow="1">
                            <HStack alignItems="center" space={3}>
                                <Box w="10" h="10" borderRadius="full" bg="admin.100" alignItems="center" justifyContent="center">
                                    <Text color="admin.600" fontWeight="700" fontSize="lg">
                                        {item.student?.name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </Box>
                                <VStack flex={1}>
                                    <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }} numberOfLines={1}>
                                        {item.student?.name || 'Nome não disponível'}
                                    </Text>
                                    <Text fontSize="xs" color="coolGray.500">CPF: {maskCPF(item.student?.cpf || 'N/A')}</Text>
                                    <Text fontSize="xs" color="coolGray.400">Carteirinha: {item.cardCode}</Text>
                                </VStack>
                                <VStack alignItems="flex-end" space={1}>
                                    <Badge colorScheme={statusColor(item.status)} borderRadius="full" variant="subtle" px="2">
                                        <Text fontSize="2xs" fontWeight="700">{statusLabel(item.status)}</Text>
                                    </Badge>
                                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                                </VStack>
                            </HStack>
                        </Box>
                    </Pressable>
                )}
                ListEmptyComponent={<EmptyState icon="school-outline" message="Nenhuma matrícula encontrada" />}
            />

            <AddFab onPress={() => setShowCreate(true)} bg="admin.600" pressedBg="admin.700" />

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="full">
                <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
                    <Modal.CloseButton />
                    <Modal.Header borderBottomWidth={0}>
                        <Text fontSize="lg" fontWeight="700">Nova Matrícula</Text>
                    </Modal.Header>
                    <Modal.Body _scrollview={{ showsVerticalScrollIndicator: false }}>
                        <VStack space={3}>
                            <ErrorDisplay error={createError} onDismiss={clearError} />
                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="1">ALUNO</Text>
                            <FormControl isRequired>
                                <FormControl.Label>Selecionar Aluno</FormControl.Label>
                                <HStack space={2}>
                                    <Input
                                        {...baseInputProps}
                                        flex={1}
                                        placeholder="Nome do aluno"
                                        value={selectedStudent?.name || ''}
                                        isReadOnly
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        colorScheme="admin"
                                        onPress={() => setShowStudentSearch(true)}
                                        borderRadius="xl"
                                    >
                                        <Icon as={Ionicons} name="search" size="4" />
                                    </Button>
                                </HStack>
                                {selectedStudent && (
                                    <Text fontSize="xs" color="coolGray.500" mt="1">
                                        CPF: {maskCPF(selectedStudent.cpf)}
                                    </Text>
                                )}
                            </FormControl>

                            <Text fontSize="xs" fontWeight="700" color="coolGray.500" mt="2">INSTITUIÇÃO</Text>
                            <FormControl isRequired>
                                <FormControl.Label>Selecionar Faculdade</FormControl.Label>
                                <HStack space={2}>
                                    <Input
                                        {...baseInputProps}
                                        flex={1}
                                        placeholder="Nome da faculdade"
                                        value={selectedCollege?.name || ''}
                                        isReadOnly
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        colorScheme="admin"
                                        onPress={() => setShowCollegeSearch(true)}
                                        borderRadius="xl"
                                    >
                                        <Icon as={Ionicons} name="search" size="4" />
                                    </Button>
                                </HStack>
                                {selectedCollege && (
                                    <Text fontSize="xs" color="coolGray.500" mt="1">
                                        {selectedCollege.city} - {selectedCollege.neighborhood}
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl isRequired>
                                <FormControl.Label>Curso</FormControl.Label>
                                <Input
                                    {...baseInputProps}
                                    placeholder="Ex: Medicina"
                                    value={course}
                                    onChangeText={setCourse}
                                />
                            </FormControl>

                            <HStack space={2}>
                                <FormControl isRequired flex={1}>
                                    <FormControl.Label>Semestre</FormControl.Label>
                                    <Input
                                        {...baseInputProps}
                                        placeholder="1 ou 2"
                                        value={semester}
                                        onChangeText={setSemester}
                                        keyboardType="numeric"
                                    />
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormControl.Label>Ano</FormControl.Label>
                                    <Input
                                        {...baseInputProps}
                                        placeholder={new Date().getFullYear().toString()}
                                        value={year}
                                        onChangeText={setYear}
                                        keyboardType="numeric"
                                    />
                                </FormControl>
                            </HStack>

                            <HStack space={2}>
                                <FormControl isRequired flex={1}>
                                    <FormControl.Label>Mensalidade</FormControl.Label>
                                    <Input
                                        {...baseInputProps}
                                        placeholder="R$ 0,00"
                                        value={monthlyFee}
                                        isReadOnly
                                    />
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormControl.Label>Taxa de Matrícula</FormControl.Label>
                                    <Input
                                        {...baseInputProps}
                                        placeholder="R$ 0,00"
                                        value={enrollmentFee}
                                        isReadOnly
                                    />
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormControl.Label>Comprovante de Matrícula</FormControl.Label>
                                <Button
                                    variant="outline"
                                    colorScheme="admin"
                                    onPress={pickDocument}
                                    borderRadius="xl"
                                    leftIcon={<Icon as={Ionicons} name="document-attach" size="4" />}
                                >
                                    {collegeEnrollmentUrl ? 'Arquivo Anexado' : 'Anexar Arquivo'}
                                </Button>
                                {collegeEnrollmentUrl && (
                                    <Text fontSize="xs" color="coolGray.500" mt="1">
                                        Arquivo anexado com sucesso
                                    </Text>
                                )}
                            </FormControl>
                        </VStack>
                    </Modal.Body>
                    <Modal.Footer borderTopWidth={0}>
                        <Button.Group space={2} w="full">
                            <Button flex={1} variant="outline" colorScheme="admin" onPress={() => setShowCreate(false)} borderRadius="xl">Cancelar</Button>
                            <Button flex={1} colorScheme="admin" onPress={handleCreate} isLoading={saving} borderRadius="xl">Criar Matrícula</Button>
                        </Button.Group>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>

            <SearchModal<Student>
                isOpen={showStudentSearch}
                onClose={() => { setShowStudentSearch(false); setStudentSearch(''); }}
                title="Selecionar Aluno"
                placeholder="Buscar por nome ou CPF..."
                items={students}
                search={studentSearch}
                onSearch={setStudentSearch}
                filterFn={(s, q) => s.name.toLowerCase().includes(q) || s.cpf.includes(q)}
                keyExtractor={(s) => String(s.id)}
                renderItem={(item) => (
                    <Pressable
                        onPress={() => { setSelectedStudent(item); setShowStudentSearch(false); setStudentSearch(''); }}
                        p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
                    >
                        <VStack>
                            <Text fontWeight="600">{item.name}</Text>
                            <Text fontSize="sm" color="coolGray.500">CPF: {maskCPF(item.cpf)}</Text>
                        </VStack>
                    </Pressable>
                )}
                emptyIcon="people-outline"
                emptyMessage="Nenhum aluno encontrado"
            />

            <SearchModal<College>
                isOpen={showCollegeSearch}
                onClose={() => { setShowCollegeSearch(false); setCollegeSearch(''); }}
                title="Selecionar Faculdade"
                placeholder="Buscar por nome da faculdade..."
                items={colleges}
                search={collegeSearch}
                onSearch={setCollegeSearch}
                filterFn={(c, q) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)}
                keyExtractor={(c) => String(c.id)}
                renderItem={(item) => (
                    <Pressable
                        onPress={() => { setSelectedCollege(item); setShowCollegeSearch(false); setCollegeSearch(''); }}
                        p="3" borderRadius="lg" bg="coolGray.50" _dark={{ bg: 'coolGray.700' }} mb="2"
                    >
                        <VStack>
                            <Text fontWeight="600">{item.name}</Text>
                            <Text fontSize="sm" color="coolGray.500">{item.city} - {item.neighborhood}</Text>
                        </VStack>
                    </Pressable>
                )}
                emptyIcon="school-outline"
                emptyMessage="Nenhuma faculdade encontrada"
            />
        </Box>
    );
}
