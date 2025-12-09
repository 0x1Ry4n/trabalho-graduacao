import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Icon,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  VStack,
} from 'native-base';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { studentsApi } from '../../src/api/students';
import { collegesApi } from '../../src/api/colleges';
import {
  AccountReceivable,
  College,
  Enrollment,
  EnrollmentStatus,
  Student,
} from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { useTheme } from '../../src/hooks/useTheme';
import {
  InfoRow,
  LoadingSpinner,
  TopRefreshButton,
} from '../../src/components/shared';
import { loadStudentContext } from '../../src/utils/student.utils';
import {
  formatCurrency,
  maskCEP,
  maskCPF,
  maskPhone,
  maskRG,
} from '@/src/utils/masks';

const fmtDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : undefined;

function enrollmentStatusLabel(status?: EnrollmentStatus) {
  if (status === EnrollmentStatus.ACTIVE) return 'Ativa';
  if (status === EnrollmentStatus.CANCELED) return 'Cancelada';
  if (status === EnrollmentStatus.FINISHED) return 'Encerrada';
  return undefined;
}

export default function StudentProfileScreen() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [student, setStudent] = useState<Student | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [nextPayment, setNextPayment] = useState<AccountReceivable | null>(null);
  const [passAvailable, setPassAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [currentStudent, context] = await Promise.all([
        studentsApi.getByUserId(String(user?.id ?? '')),
        loadStudentContext(user?.id),
      ]);

      const resolvedStudent = context.student ?? currentStudent;

      setStudent(resolvedStudent);
      setEnrollment(context.enrollment);
      setNextPayment(context.nextOpenPayment);
      setPassAvailable(context.passAvailable);

      if (resolvedStudent?.collegeId) {
        try {
          const currentCollege = await collegesApi.getById(
            String(resolvedStudent.collegeId),
          );
          setCollege(currentCollege);
        } catch {
          setCollege(null);
        }
      } else {
        setCollege(null);
      }
    } catch {
      setStudent(null);
      setCollege(null);
      setEnrollment(null);
      setNextPayment(null);
      setPassAvailable(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner color="student.600" />;

  const displayName = student?.name ?? user?.username ?? 'Aluno';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title="Meu Perfil" bg="#7C3AED" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="3">
          <TopRefreshButton onPress={load} />
        </Box>

        <Box
          bg="white"
          _dark={{ bg: 'coolGray.800' }}
          borderRadius="2xl"
          p="5"
          shadow="1"
          mb="3"
        >
          <HStack alignItems="center" space={4}>
            {student?.photoUrl ? (
              <Image
                source={{ uri: student.photoUrl }}
                alt="Foto do aluno"
                w="16"
                h="16"
                borderRadius="full"
                bg="student.100"
              />
            ) : (
              <Box
                w="16"
                h="16"
                borderRadius="full"
                bg="student.100"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl" fontWeight="800" color="student.700">
                  {initials}
                </Text>
              </Box>
            )}

            <VStack flex={1}>
              <Text
                fontSize="lg"
                fontWeight="800"
                color="coolGray.800"
                _dark={{ color: 'white' }}
              >
                {displayName}
              </Text>
              <Text
                fontSize="sm"
                color="coolGray.500"
                _dark={{ color: 'coolGray.300' }}
              >
                Estudante
              </Text>
              <Text
                mt="2"
                alignSelf="flex-start"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                color={passAvailable ? 'green.600' : 'amber.600'}
                bg={passAvailable ? 'green.50' : 'amber.50'}
              >
                {passAvailable ? 'Passe liberado' : 'Passe pendente'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          bg="white"
          _dark={{ bg: 'coolGray.800' }}
          borderRadius="2xl"
          p="4"
          shadow="1"
          mb="3"
        >
          <Text
            fontSize="sm"
            fontWeight="700"
            color="coolGray.800"
            _dark={{ color: 'white' }}
            mb="3"
          >
            Conta
          </Text>
          <InfoRow label="Usuário" value={user?.username} />
          <InfoRow label="E-mail" value={student?.email} />
        </Box>

        {student && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Informações Pessoais
            </Text>
            <InfoRow label="Nome completo" value={student.name} />
            <InfoRow label="Nome da mãe" value={student.motherName} />
            <InfoRow label="CPF" value={maskCPF(student.cpf)} />
            <InfoRow label="RG" value={maskRG(student.rg)} />
            <InfoRow label="CIN" value={student.cin} />
            <InfoRow label="Nascimento" value={fmtDate(student.birthDate)} />
            <InfoRow label="Telefone" value={maskPhone(student.phone)} />
            <InfoRow label="E-mail" value={student.email} />
          </Box>
        )}

        {student && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Informações Acadêmicas
            </Text>
            <InfoRow label="Faculdade" value={college?.name} />
            <InfoRow label="Curso" value={student.course} />
            <InfoRow
              label="Semestre"
              value={
                student.semester != null
                  ? `${student.semester}o semestre`
                  : undefined
              }
            />
            <InfoRow
              label="Ano"
              value={student.year != null ? String(student.year) : undefined}
            />
          </Box>
        )}

        {enrollment && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Matrícula Atual
            </Text>
            <InfoRow label="Status" value={enrollmentStatusLabel(enrollment.status)} />
            <InfoRow label="Passe liberado" value={passAvailable ? 'Sim' : 'Não'} />
            <InfoRow label="Código do passe" value={enrollment.cardCode} />
            <InfoRow label="Curso da matrícula" value={enrollment.course} />
            <InfoRow
              label="Período letivo"
              value={
                enrollment.semester != null
                  ? `${enrollment.semester}o semestre de ${enrollment.year}`
                  : undefined
              }
            />
            <InfoRow label="Início da vigência" value={fmtDate(enrollment.startDate)} />
            <InfoRow label="Fim da vigência" value={fmtDate(enrollment.endDate)} />
            <InfoRow
              label="Mensalidade"
              value={`R$ ${formatCurrency(enrollment.monthlyFee)}`}
            />
            <InfoRow
              label="Taxa de matrícula"
              value={`R$ ${formatCurrency(enrollment.enrollmentFee)}`}
            />
            {nextPayment && (
              <InfoRow
                label="Próximo pagamento"
                value={`R$ ${formatCurrency(nextPayment.amount)} - vence em ${fmtDate(nextPayment.dueDate)}`}
              />
            )}
          </Box>
        )}

        {student && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Endereço
            </Text>
            <InfoRow label="Endereço" value={student.address} />
            <InfoRow label="Bairro" value={student.neighborhood} />
            <InfoRow label="Cidade" value={student.city} />
            <InfoRow label="CEP" value={maskCEP(student.cep)} />
          </Box>
        )}

        {student?.notes && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="3"
            >
              Observações
            </Text>
            <Text fontSize="sm" color="coolGray.700" _dark={{ color: 'coolGray.300' }}>
              {student.notes}
            </Text>
          </Box>
        )}

        <Pressable
          onPress={() =>
            Alert.alert('Sair', 'Deseja realmente sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: logout },
            ])
          }
          bg="red.50"
          _dark={{ bg: 'red.900' }}
          borderRadius="2xl"
          p="4"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <HStack alignItems="center" space={2}>
            <Icon as={Ionicons} name="log-out-outline" size="5" color="red.500" />
            <Text fontSize="sm" fontWeight="600" color="red.500">
              Sair da conta
            </Text>
          </HStack>
        </Pressable>
      </ScrollView>
    </Box>
  );
}
