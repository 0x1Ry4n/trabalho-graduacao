import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Input, Button,
  FormControl, Badge, useToast, Image,
} from 'native-base';
import { Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { studentsApi } from '../../../src/api/students';
import { enrollmentsApi } from '../../../src/api/enrollments';
import { paymentsApi } from '../../../src/api/payments';
import {
  Student, CardValidation, CardValidationStatus, AccountReceivable, AccountStatus, Enrollment,
} from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LoadingSpinner, InfoRow } from '../../../src/components/shared';
import { maskPhone, maskCEP, unmask, formatCPF, formatPhone, formatRG } from '../../../src/utils/masks';
import { isCompleteCep, useCepAddress } from '../../../src/utils/address.utils';
import { BASE_URL, SECURE_KEYS } from '../../../src/api/client';
import QRCode from 'react-native-qrcode-svg';

function formatDateBR(value?: string | null) {
  if (!value) return undefined;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleDateString('pt-BR');
}

function formatDateTimeBR(value?: string | null) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateBR(value);

  return date.toLocaleString('pt-BR');
}

function getValidationTimestamp(validation: CardValidation) {
  return validation.timestamp ?? validation.validationTime;
}

function buildStudentAddressQuery(address?: string, neighborhood?: string, city?: string, cep?: string) {
  return [address, neighborhood, city, cep ? maskCEP(cep) : '', 'Brasil']
    .filter((value) => value?.trim())
    .join(', ');
}

async function openAddressInMaps(address?: string, neighborhood?: string, city?: string, cep?: string) {
  const query = buildStudentAddressQuery(address, neighborhood, city, cep);

  if (!query) {
    Alert.alert('Mapa indisponivel', 'Este aluno nao possui endereco para abrir no Maps.');
    return;
  }

  await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

const brl = (value: number | string) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function normalizeEnrollmentResult(result: Enrollment[] | Enrollment | null | undefined) {
  if (!result) return null;
  return Array.isArray(result) ? result[0] ?? null : result;
}

function paymentStatusLabel(status: AccountStatus) {
  return status === AccountStatus.OPEN ? 'Pendente' : status === AccountStatus.PAID ? 'Pago' : 'Cancelado';
}

function paymentStatusColor(status: AccountStatus) {
  return status === AccountStatus.OPEN ? 'warning' : status === AccountStatus.PAID ? 'success' : 'error';
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { fillAddressFromCep } = useCepAddress();
  const [student, setStudent] = useState<Student | null>(null);
  const [validations, setValidations] = useState<CardValidation[]>([]);
  const [payments, setPayments] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingEnrollmentProof, setUploadingEnrollmentProof] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const [s, v] = await Promise.allSettled([
        studentsApi.getById(id!),
        studentsApi.getCardValidations(id!),
      ]);
      if (s.status === 'fulfilled') {
        let enrollment: Enrollment | null = null;
        try {
          enrollment = normalizeEnrollmentResult(await enrollmentsApi.getByStudentId(s.value.id));
        } catch {
          enrollment = s.value.enrollment ?? null;
        }

        const studentWithEnrollment = {
          ...s.value,
          enrollment: enrollment ?? s.value.enrollment,
          photoUrl: s.value.photoUrl ?? enrollment?.student?.photoUrl ?? undefined,
        };
        setStudent(studentWithEnrollment);
        setPhone(s.value.phone ? maskPhone(s.value.phone) : '');
        setEmail(s.value.email ?? '');
        setCourse(s.value.course ?? '');
        setCity(s.value.city ?? '');
        setNeighborhood(s.value.neighborhood ?? '');
        setAddress(s.value.address ?? '');
        setCep(s.value.cep ? maskCEP(s.value.cep) : '');

        try {
          const studentPayments = s.value.userId
            ? await paymentsApi.getByUserId(String(s.value.userId))
            : s.value.enrollment?.id
              ? await paymentsApi.getByEnrollmentId(s.value.enrollment.id)
              : [];
          setPayments(Array.isArray(studentPayments) ? studentPayments : []);
        } catch {
          setPayments([]);
        }
      }
      if (v.status === 'fulfilled') setValidations(v.value);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o aluno.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await studentsApi.update(id!, {
        phone: unmask(phone) || undefined,
        email: email.trim() || undefined,
        course: course.trim() || undefined,
        city: city.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || undefined,
        cep: unmask(cep) || undefined,
      });
      setStudent((current) => current ? { ...current, ...updated, enrollment: current.enrollment } : updated);
      setShowCardPreview(false);
      setEditing(false);
      toast.show({ description: 'Dados atualizados com sucesso!', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
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

  async function uploadFile(file: DocumentPicker.DocumentPickerAsset) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as any);

    const token = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) throw new Error('O upload do arquivo falhou!');

    const data = await response.json();
    return data.url ?? data.data?.url;
  }

  async function handlePickStudentPhoto() {
    if (!student) return;

    setUploadingPhoto(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const fileUrl = await uploadFile(result.assets[0]);
      if (!fileUrl) throw new Error('Upload without URL');

      const updated = await studentsApi.update(student.id, { photoUrl: fileUrl });
      setStudent({ ...student, ...updated, photoUrl: fileUrl });
      toast.show({ description: 'Foto do aluno atualizada!', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível anexar a foto do aluno.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handlePickEnrollmentProof() {
    if (!student?.enrollment?.id) return;

    setUploadingEnrollmentProof(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const fileUrl = await uploadFile(result.assets[0]);
      if (!fileUrl) throw new Error('Erro! Upload sem URL!');

      const updatedEnrollment = await enrollmentsApi.update(student.enrollment.id, {
        collegeEnrollmentUrl: fileUrl,
      });
      setStudent({ ...student, enrollment: { ...student.enrollment, ...updatedEnrollment, collegeEnrollmentUrl: fileUrl } });
      toast.show({ description: 'Comprovante de matricula anexado!', placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível anexar o comprovante de matrícula.');
    } finally {
      setUploadingEnrollmentProof(false);
    }
  }

  async function handleToggleActive() {
    if (!student) return;
    try {
      if (student.active === 1) {
        await studentsApi.inactivate(id!);
      } else {
        await studentsApi.activate(id!);
      }
      load();
      toast.show({ description: `Usuário ${student.active === 1 ? 'desativado' : 'ativado'} com sucesso!`, placement: 'top' });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  }

  if (loading) return <LoadingSpinner color="admin.600" />;

  if (!student) return null;

  const enrollStatus = student.enrollment?.status;
  const enrollmentStartDate = formatDateBR(student.enrollment?.startDate);
  const enrollmentEndDate = formatDateBR(student.enrollment?.endDate);


  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title={student.name}
        bg="#1E40AF"
        showBack
        showMenu={false}
        rightContent={
          <Pressable onPress={() => setEditing(!editing)} p="1">
            <Icon as={Ionicons} name={editing ? 'close-outline' : 'create-outline'} size="5" color="white" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="xs" color="coolGray.500" mb="1">Status</Text>
              <Text fontSize="sm" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                {student.active === 1 ? 'Ativo' : 'Inativo'}
              </Text>
            </VStack>
            <Pressable
              onPress={handleToggleActive}
              px="4"
              py="2"
              bg={student.active === 1 ? 'red.50' : 'green.50'}
              _pressed={{ bg: student.active === 1 ? 'red.100' : 'green.100' }}
              borderRadius="lg"
            >
              <Text fontSize="xs" fontWeight="700" color={student.active === 1 ? 'red.500' : 'green.500'}>
                {student.active === 1 ? 'Desativar' : 'Ativar'}
              </Text>
            </Pressable>
          </HStack>
        </Box>

        {student.enrollment && (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack>
                <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>Matrícula</Text>
                <Text fontSize="xs" color="coolGray.500" mt="1">Cartão: {student.enrollment.cardCode}</Text>
                <Text fontSize="xs" color="coolGray.500" mt="1">Início: {enrollmentStartDate ?? 'Nao informado'}</Text>
                {enrollmentEndDate ? (
                  <Text fontSize="xs" color="coolGray.500" mt="1">Término: {enrollmentEndDate}</Text>
                ) : null}
              </VStack>
              <VStack alignItems="flex-end" space={2}>
                <Badge
                  colorScheme={enrollStatus === 'ACTIVE' ? 'success' : enrollStatus === 'CANCELED' ? 'error' : 'coolGray'}
                  borderRadius="full" variant="subtle"
                >
                  {enrollStatus === 'ACTIVE' ? 'ATIVO' : enrollStatus === 'CANCELED' ? 'CANCELADO' : 'ENCERRADO'}
                </Badge>
                <Pressable
                  onPress={() => setShowCardPreview((current) => !current)}
                  px="4"
                  py="2.5"
                  bg="admin.50"
                  _pressed={{ bg: 'admin.100' }}
                  borderRadius="xl"
                >
                  <HStack alignItems="center" space={2}>
                    <Icon as={Ionicons} name={showCardPreview ? 'eye-off-outline' : 'card-outline'} size="4" color="admin.700" />
                    <Text fontSize="xs" fontWeight="700" color="admin.700">
                      {showCardPreview ? 'Ocultar' : 'Carteirinha'}
                    </Text>
                  </HStack>
                </Pressable>
              </VStack>
            </HStack>
          </Box>
        )}

        {student.enrollment && showCardPreview && (
          <StudentCardPreview student={student} startDate={enrollmentStartDate} />
        )}

        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
          <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
            {editing ? 'Editar Aluno' : 'Dados Pessoais'}
          </Text>
          <HStack alignItems="center" justifyContent="space-between" mb="4" space={3}>
            <HStack alignItems="center" space={3} flex={1}>
              {student.photoUrl ? (
                <Image
                  source={{ uri: student.photoUrl }}
                  alt="Foto do aluno"
                  w="16"
                  h="16"
                  borderRadius="full"
                  bg="coolGray.100"
                />
              ) : (
                <Box
                  w="16"
                  h="16"
                  borderRadius="full"
                  bg="admin.50"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={Ionicons} name="person-outline" size="7" color="admin.700" />
                </Box>
              )}
              <VStack flex={1}>
                <Text fontSize="xs" color="coolGray.500">Foto do aluno</Text>
                <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }} numberOfLines={1}>
                  {student.photoUrl ? 'Com anexo' : 'Sem anexo'}
                </Text>
              </VStack>
            </HStack>
            <Button
              size="sm"
              variant={student.photoUrl ? 'outline' : 'solid'}
              colorScheme="admin"
              borderRadius="xl"
              isLoading={uploadingPhoto}
              onPress={handlePickStudentPhoto}
              leftIcon={<Ionicons name="camera-outline" size={16} color={student.photoUrl ? '#1D4ED8' : 'white'} />}
            >
              {student.photoUrl ? 'Trocar foto' : 'Anexar foto'}
            </Button>
          </HStack>

          {editing ? (
            <VStack space={3}>
              <FormControl>
                <FormControl.Label>Telefone</FormControl.Label>
                <Input value={phone} onChangeText={(v) => setPhone(maskPhone(v))} keyboardType="phone-pad" />
              </FormControl>
              <FormControl>
                <FormControl.Label>E-mail</FormControl.Label>
                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </FormControl>
              <FormControl>
                <FormControl.Label>Curso</FormControl.Label>
                <Input value={course} onChangeText={setCourse} />
              </FormControl>
              <FormControl>
                <FormControl.Label>CEP</FormControl.Label>
                <Input value={cep} onChangeText={handleCepChange} keyboardType="numeric" />
              </FormControl>
              <FormControl>
                <FormControl.Label>Endereço</FormControl.Label>
                <Input value={address} onChangeText={setAddress} />
              </FormControl>
              <HStack space={2}>
                <FormControl flex={1}>
                  <FormControl.Label>Bairro</FormControl.Label>
                  <Input value={neighborhood} onChangeText={setNeighborhood} />
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Cidade</FormControl.Label>
                  <Input value={city} onChangeText={setCity} />
                </FormControl>
              </HStack>
              <HStack space={2} mt="2">
                <Button flex={1} variant="outline" onPress={() => setEditing(false)} borderRadius="xl">Cancelar</Button>
                <Button flex={1} onPress={handleSave} isLoading={saving} borderRadius="xl">Salvar</Button>
              </HStack>
            </VStack>
          ) : (
            <VStack space={0}>
              <InfoRow label="CPF" value={formatCPF(student.cpf)} />
              <InfoRow label="RG" value={formatRG(student.rg)} />
              <InfoRow label="Nascimento" value={student.birthDate} />
              <InfoRow label="Telefone" value={formatPhone(student.phone)} />
              <InfoRow label="E-mail" value={student.email} />
              <InfoRow label="Curso" value={student.course} />
              <InfoRow label="Semestre" value={student.semester?.toString()} />
              <InfoRow label="Ano" value={student.year?.toString()} />
            </VStack>
          )}
        </Box>

        {!editing && (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
            <HStack justifyContent="space-between" alignItems="center" mb="3">
              <Text
                fontSize="sm"
                fontWeight="700"
                color="coolGray.800"
                _dark={{ color: 'white' }}
              >
                Endereço
              </Text>

              <Pressable
                onPress={() =>
                  openAddressInMaps(
                    student.address,
                    student.neighborhood,
                    student.city,
                    student.cep
                  )
                }
                borderRadius="xl"
                bg="rgba(22,101,52,0.9)"
                alignItems="center"
                justifyContent="center"
                px="3"
                py="2"
                _pressed={{ bg: 'green.800' }}
              >
                <Icon as={Ionicons} name="navigate-outline" size="5" color="white" />
              </Pressable>
            </HStack>
            <InfoRow label="CEP" value={maskCEP(student.cep)} />
            <InfoRow label="Endereço" value={student.address} />
            <InfoRow label="Bairro" value={student.neighborhood} />
            <InfoRow label="Cidade" value={student.city} />
          </Box>
        )}

        {!editing && (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
            <HStack justifyContent="space-between" alignItems="center" mb="3">
              <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>
                Cobranças ({payments.length})
              </Text>
              <Button
                size="sm"
                variant="outline"
                colorScheme="admin"
                borderRadius="xl"
                onPress={() => router.push('/(admin)/payments')}
              >
                Todas
              </Button>
            </HStack>
            {payments.length === 0 ? (
              <Text fontSize="xs" color="coolGray.400" textAlign="center" py="4">
                Nenhuma cobrança encontrada para este aluno.
              </Text>
            ) : (
              payments.map((payment) => (
                <Pressable
                  key={payment.id}
                  onPress={() => router.push(`/(admin)/payments/${payment.id}` as any)}
                  py="2.5"
                  borderBottomWidth={1}
                  borderBottomColor="coolGray.50"
                >
                  <HStack alignItems="center" justifyContent="space-between" space={3}>
                    <VStack flex={1}>
                      <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'coolGray.100' }}>
                        {brl(payment.amount)}
                      </Text>
                      <Text fontSize="xs" color="coolGray.500" numberOfLines={1}>
                        {payment.description || `Vence em ${formatDateBR(payment.dueDate)}`}
                      </Text>
                    </VStack>
                    <Badge colorScheme={paymentStatusColor(payment.status)} borderRadius="full" variant="subtle">
                      <Text fontSize="2xs" fontWeight="700">{paymentStatusLabel(payment.status)}</Text>
                    </Badge>
                    <Icon as={Ionicons} name="chevron-forward" size="4" color="coolGray.400" />
                  </HStack>
                </Pressable>
              ))
            )}
          </Box>
        )}

        {!editing && (
          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1">
            <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>
              Validações ({validations.length})
            </Text>
            {validations.length === 0 ? (
              <Text fontSize="xs" color="coolGray.400" textAlign="center" py="4">
                Nenhuma validação registrada
              </Text>
            ) : (
              validations.slice(0, 10).map((v) => (
                <HStack key={v.id} alignItems="flex-start" py="3" space={3} borderBottomWidth={1} borderBottomColor="coolGray.50">
                  <Box w="2.5" h="2.5" borderRadius="full" bg={v.status === CardValidationStatus.VALID ? 'green.500' : 'red.500'} />
                  <VStack flex={1}>
                    <Text fontSize="xs" fontWeight="600" color="coolGray.800" _dark={{ color: 'coolGray.200' }}>
                      {v.status === CardValidationStatus.VALID ? 'Valido' : 'Invalido'}
                    </Text>
                    <Text fontSize="2xs" color="coolGray.400">
                      {formatDateTimeBR(getValidationTimestamp(v)) ?? getValidationTimestamp(v)}
                    </Text>
                    <HStack flexWrap="wrap" mt="1" alignItems="center">
                      <Text fontSize="2xs" color="coolGray.500" mr="3">
                        Motorista: {v.driver?.name ?? '-'}
                      </Text>
                      <Text fontSize="2xs" color="coolGray.500" mr="3">
                        Rota: {v.route?.name ?? v.routeId ?? '-'}
                      </Text>
                      {(v.latitude != null || v.longitude != null) ? (
                        <Text fontSize="2xs" color="coolGray.500">
                          Local: {v.latitude ?? '-'}, {v.longitude ?? '-'}
                        </Text>
                      ) : null}
                    </HStack>
                  </VStack>
                </HStack>
              ))
            )}
          </Box>
        )}
      </ScrollView>
    </Box>
  );
}

function StudentCardPreview({ student, startDate }: { student: Student; startDate?: string }) {
  const enrollment = student.enrollment;
  if (!enrollment?.cardCode) return null;

  const isActive = enrollment.status === 'ACTIVE';

  return (
    <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="2" mb="3">
      <HStack justifyContent="space-between" alignItems="center" mb="4">
        <VStack>
          <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>
            Carteirinha do Aluno
          </Text>
          <Text fontSize="xs" color="coolGray.500" mt="1">
            Prévia para visualização
          </Text>
        </VStack>
        <Badge colorScheme={isActive ? 'success' : 'coolGray'} borderRadius="full" variant="subtle">
          {isActive ? 'ATIVA' : 'INATIVA'}
        </Badge>
      </HStack>

      <Box
        bg="#0F172A"
        borderRadius="2xl"
        overflow="hidden"
        borderWidth={1}
        borderColor="coolGray.200"
      >
        <Box bg="#1E40AF" px="4" py="3">
          <Text color="white" fontSize="xs" fontWeight="700">
            Transporte Universitário
          </Text>
          <Text color="white" fontSize="2xs" opacity={0.8}>
            Carteirinha digital
          </Text>
        </Box>

        <VStack p="4" space={4}>
          <HStack space={3} alignItems="center">
            {student.photoUrl ? (
              <Image
                source={{ uri: student.photoUrl }}
                alt="Foto do aluno"
                w="24"
                h="24"
                borderRadius="full"
                bg="white"
              />
            ) : (
              <Box
                w="24"
                h="24"
                borderRadius="full"
                bg="white"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={Ionicons} name="person" size="7" color="admin.700" />
              </Box>
            )}
            <VStack flex={1}>
              <Text color="white" fontSize="md" fontWeight="800" numberOfLines={2}>
                {student.name}
              </Text>
              <Text color="coolGray.300" fontSize="xs" mt="1" numberOfLines={1}>
                {student.course}
              </Text>
            </VStack>
          </HStack>

          <HStack space={3} alignItems="center">
            <Box bg="white" p="3" borderRadius="xl">
              <QRCode value={enrollment.cardCode} size={108} color="#0F172A" backgroundColor="#FFFFFF" />
            </Box>
            <VStack flex={1} space={2}>
              <VStack>
                <Text color="coolGray.400" fontSize="2xs">Código</Text>
                <Text color="white" fontSize="sm" fontWeight="800">
                  {enrollment.cardCode}
                </Text>
              </VStack>
              <VStack>
                <Text color="coolGray.400" fontSize="2xs">CPF</Text>
                <Text color="white" fontSize="xs" fontWeight="600">
                  {formatCPF(student.cpf)}
                </Text>
              </VStack>
              {startDate ? (
                <VStack>
                  <Text color="coolGray.400" fontSize="2xs">Início</Text>
                  <Text color="white" fontSize="xs" fontWeight="600">
                    {startDate}
                  </Text>
                </VStack>
              ) : null}
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
