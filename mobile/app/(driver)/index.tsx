import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, HStack, Text, Pressable, Icon, Center, Image,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { QRScanner } from '../../src/components/qr/QRScanner';
import { findStudentByCardCode, upsertStudents } from '../../src/database/students.repo';
import { insertValidation } from '../../src/database/validations.repo';
import { useSync } from '../../src/hooks/useSync';
import { useAuthStore } from '../../src/store/auth.store';
import { useSyncStore } from '../../src/store/sync.store';
import { enrollmentsApi } from '../../src/api/enrollments';
import { driversApi } from '../../src/api/drivers';
import { routesApi } from '../../src/api/routes';
import { CachedStudent, CardValidationStatus, EnrollmentStatus } from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TopRefreshButton } from '../../src/components/shared';

type ScanResult = {
  student: CachedStudent;
  status: CardValidationStatus;
  reason?: string;
} | null;

function normalizeCardCode(data: string) {
  const value = data.trim();

  try {
    const parsed = JSON.parse(value);
    const code = parsed?.cardCode ?? parsed?.card_code ?? parsed?.code ?? parsed?.codigo;
    if (code) return String(code).trim();
  } catch {
    // The app usually prints plain codes, but older QR cards may carry URLs or JSON.
  }

  const queryMatch = value.match(/(?:cardCode|card_code|code|codigo)=([^&\s]+)/i);
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]).trim();
  }

  return value;
}

export default function DriverScannerScreen() {
  const { user } = useAuthStore();
  const { isConnected, pendingCount, isSyncing, lastSyncAt, syncAll } = useSync();
  const { addValidation } = useSyncStore();
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [cacheCount, setCacheCount] = useState(0);
  const [loadingCache, setLoadingCache] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);

  useEffect(() => {
    loadStudentCache();
    loadDriverContext();
  }, []);

  async function loadDriverContext() {
    if (!isConnected || !user?.id) return;

    try {
      const driver = await driversApi.getByUserId(user.id);
      setDriverId(driver?.id ? String(driver.id) : String(user.id));

      if (!driver) return;

      const routes = await routesApi.list();
      const driverRoutes = routes.filter((route) => (
        (
          String(route.driverId) === String(driver.id) ||
          String(route.driver?.id) === String(driver.id)
        )
      ));
      const activeRoute = driverRoutes.find((route) => route.active === 1) ?? driverRoutes[0];
      setRouteId(activeRoute?.id ? String(activeRoute.id) : null);
    } catch {
      setDriverId(String(user.id));
      setRouteId(null);
    }
  }

  async function loadStudentCache() {
    if (!isConnected) return;
    setLoadingCache(true);
    try {
      const enrollments = await enrollmentsApi.list();
      const syncedAt = new Date().toISOString();
      const cached = enrollments.map((enrollment) => ({
        id: String(enrollment.student?.id ?? enrollment.studentId ?? ''),
        name: enrollment.student?.name ?? '',
        cpf: enrollment.student?.cpf ?? '',
        cardCode: enrollment.cardCode ?? '',
        enrollmentStatus: enrollment.status ?? null,
        enrollmentId: enrollment.id ? String(enrollment.id) : null,
        photoUrl: enrollment.student?.photoUrl ?? enrollment.photoUrl ?? null,
        syncedAt,
      })).filter((s) => s.id && s.cardCode);
      await upsertStudents(cached);
      setCacheCount(cached.length);
    } catch { /* use existing cache */ }
    finally { setLoadingCache(false); }
  }

  const handleScanned = useCallback(async (data: string) => {
    const cardCode = normalizeCardCode(data);
    const student = await findStudentByCardCode(cardCode);
    if (!student) {
      setScanResult({
        student: { id: '', name: 'Estudante não encontrado', cpf: '', cardCode, enrollmentStatus: null, enrollmentId: null, photoUrl: null, syncedAt: '' },
        status: CardValidationStatus.INVALID, reason: 'Cartão não reconhecido',
      });
      return;
    }
    const isValid = student.enrollmentStatus === EnrollmentStatus.ACTIVE;
    const status = isValid ? CardValidationStatus.VALID : CardValidationStatus.INVALID;
    const reason = !isValid
      ? student.enrollmentStatus === EnrollmentStatus.CANCELED ? 'Matrícula cancelada'
        : student.enrollmentStatus === EnrollmentStatus.FINISHED ? 'Matrícula encerrada' : 'Sem matrícula ativa'
      : undefined;
    setScanResult({ student, status, reason });
    const validation = {
      studentId: student.id, driverId: driverId ?? user?.id ?? '', routeId,
      latitude: null, longitude: null, status, timestamp: new Date().toISOString(),
    };
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await insertValidation({ ...validation, id, synced: false });
    addValidation(validation);
    if (isConnected) syncAll();
  }, [user, driverId, routeId, isConnected, syncAll, addValidation]);

  return (
    <Box flex={1} bg="coolGray.900">
      <ScreenHeader title="Validar Cartão" bg="#059669"
        rightContent={
          <HStack space={2} alignItems="center">
            <Box w="2" h="2" borderRadius="full" bg={isConnected ? 'green.400' : 'red.400'} />
            <Text color="white" fontSize="xs">{isConnected ? 'Online' : 'Offline'}</Text>
            {pendingCount > 0 && (
              <Box bg="amber.500" borderRadius="full" px="2" py="0.5">
                <Text fontSize="2xs" color="white" fontWeight="700">{pendingCount}</Text>
              </Box>
            )}
          </HStack>
        }
      />

      <Box bg="coolGray.800" px="4" pt="3" pb="1">
        <TopRefreshButton
          onPress={loadStudentCache}
          bgColor="driver.600"
          pressedBgColor="driver.700"
        />
      </Box>

      {/* Status bar */}
      <HStack bg="coolGray.800" px="4" py="2" alignItems="center" justifyContent="space-between">
        <HStack alignItems="center" space={2}>
          {loadingCache && <Text fontSize="2xs" color="coolGray.400">Atualizando cache...</Text>}
          {!loadingCache && cacheCount > 0 && (
            <Text fontSize="2xs" color="coolGray.500">{cacheCount} alunos em cache</Text>
          )}
        </HStack>
        <Pressable
          onPress={syncAll}
          isDisabled={isSyncing || !isConnected}
          bg="rgba(255,255,255,0.1)"
          px="4" py="2" borderRadius="xl"
        >
          <HStack alignItems="center" space={1}>
            <Icon as={Ionicons} name={isSyncing ? 'refresh' : 'cloud-upload-outline'} size="4" color="blue.300" />
            <Text fontSize="xs" color="blue.300" fontWeight="700">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</Text>
          </HStack>
        </Pressable>
      </HStack>

      {scanResult ? (
        <ResultView result={scanResult} onReset={() => setScanResult(null)} />
      ) : (
        <Box flex={1}>
          <QRScanner onScanned={handleScanned} active={!scanResult} />
        </Box>
      )}
    </Box>
  );
}

function ResultView({ result, onReset }: { result: NonNullable<ScanResult>; onReset: () => void }) {
  const isValid = result.status === CardValidationStatus.VALID;

  return (
    <Center flex={1} bg={isValid ? 'green.50' : 'red.50'} px="8">
      <Box w="28" h="28" borderRadius="full" bg={isValid ? 'green.100' : 'red.100'} alignItems="center" justifyContent="center" mb="5">
        <Icon as={Ionicons} name={isValid ? 'checkmark-circle' : 'close-circle'} size="16" color={isValid ? 'green.600' : 'red.500'} />
      </Box>

      <Text fontSize="xl" fontWeight="800" color={isValid ? 'green.600' : 'red.500'} mb="5">
        {isValid ? 'ACESSO PERMITIDO' : 'ACESSO NEGADO'}
      </Text>

      <Box bg="white" borderRadius="2xl" p="5" w="full" alignItems="center" shadow="3" mb="4">
        {result.student.photoUrl ? (
          <Image
            source={{ uri: result.student.photoUrl }}
            alt="Foto do aluno"
            w="20"
            h="20"
            borderRadius="full"
            bg="coolGray.100"
            mb="3"
          />
        ) : result.student.id ? (
          <Box w="20" h="20" borderRadius="full" bg="coolGray.100" alignItems="center" justifyContent="center" mb="3">
            <Icon as={Ionicons} name="person-outline" size="8" color="coolGray.500" />
          </Box>
        ) : null}
        <Text fontSize="lg" fontWeight="700" color="coolGray.800" textAlign="center">{result.student.name}</Text>
        {result.student.cpf ? <Text fontSize="xs" color="coolGray.500" mt="1">CPF: {result.student.cpf}</Text> : null}
        {!result.student.id && <Text fontSize="xs" color="coolGray.500" mt="1">Código: {result.student.cardCode}</Text>}
        {result.reason && (
          <Box mt="2" bg="red.50" borderRadius="lg" px="3" py="1.5">
            <Text fontSize="xs" color="red.500" fontWeight="500">{result.reason}</Text>
          </Box>
        )}
      </Box>

      <Text fontSize="xs" color="coolGray.400" mb="6">{new Date().toLocaleString('pt-BR')}</Text>

      <Pressable
        onPress={onReset}
        bg={isValid ? 'green.600' : 'red.500'}
        px="8" py="3.5" borderRadius="2xl"
      >
        <HStack alignItems="center" space={2}>
          <Icon as={Ionicons} name="qr-code-outline" size="5" color="white" />
          <Text color="white" fontSize="md" fontWeight="700">Escanear próximo</Text>
        </HStack>
      </Pressable>
    </Center>
  );
}
