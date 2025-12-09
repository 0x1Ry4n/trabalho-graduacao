import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Badge,
  Spinner,
  Icon,
  Pressable,
  Button,
} from 'native-base';
import { RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '../../src/store/auth.store';
import {
  AccountReceivable,
  AccountReceivableType,
  AccountStatus,
  Enrollment,
  EnrollmentStatus,
  Student,
} from '../../src/types';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TopRefreshButton } from '../../src/components/shared';
import { loadStudentContext } from '../../src/utils/student.utils';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '-';

const brl = (value: number | string | null | undefined) =>
  Number(value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function getEnrollmentStartDate(enrollment?: Enrollment | null) {
  return enrollment?.startDate
    ?? (enrollment as any)?.start_date
    ?? enrollment?.createdAt
    ?? null;
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isEnrollmentFee(payment: AccountReceivable) {
  const description = String(payment.description ?? '').toLowerCase();
  return payment.accountReceivableType === AccountReceivableType.ENROLLMENT_FEE ||
    description.includes('matr');
}

type CachedPassContext = {
  student: Student | null;
  enrollment: Enrollment | null;
  payments: AccountReceivable[];
  nextPayment: AccountReceivable | null;
  passAvailable: boolean;
  savedAt: string;
};

function passCacheKey(userId?: string | number | null) {
  return `student_pass_cache_${userId ?? 'anonymous'}`;
}

async function loadCachedPass(userId?: string | number | null): Promise<CachedPassContext | null> {
  const raw = await SecureStore.getItemAsync(passCacheKey(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedPassContext;
  } catch {
    return null;
  }
}

async function saveCachedPass(userId: string | number, data: CachedPassContext) {
  await SecureStore.setItemAsync(passCacheKey(userId), JSON.stringify(data));
}

async function buildCardPdfHtml(student: Student, enrollment: Enrollment) {
  const QRCodeCore = require('qrcode/lib/core/qrcode');
  const SvgRenderer = require('qrcode/lib/renderer/svg-tag');
  const qrData = QRCodeCore.create(enrollment.cardCode, {
    errorCorrectionLevel: 'M',
  });
  const qrSvg = SvgRenderer.render(qrData, {
    margin: 1,
    width: 132,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  const studentName = escapeHtml(student.name ?? 'Aluno');
  const course = escapeHtml(enrollment.course);
  const cpf = escapeHtml(student.cpf ?? '');
  const startDate = escapeHtml(fmt(getEnrollmentStartDate(enrollment)) ?? 'Nao informado');
  const cardCode = escapeHtml(enrollment.cardCode);
  const photoUrl = escapeHtml(student.photoUrl ?? '');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 32px; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 18px;
          }
          .card {
            width: 420px;
            border-radius: 20px;
            overflow: hidden;
            background: #0f172a;
            color: white;
            border: 1px solid #cbd5e1;
          }
          .header {
            background: #1e40af;
            padding: 18px 22px;
          }
          .header strong {
            display: block;
            font-size: 15px;
          }
          .header span {
            display: block;
            margin-top: 3px;
            color: #dbeafe;
            font-size: 11px;
          }
          .content {
            padding: 22px;
          }
          .student {
            font-size: 20px;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 4px;
          }
          .course {
            color: #cbd5e1;
            font-size: 12px;
            margin-bottom: 22px;
          }
          .top {
            display: flex;
            gap: 14px;
            align-items: center;
            margin-bottom: 22px;
          }
          .photo {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            background: #ffffff;
            object-fit: cover;
          }
          .photo-placeholder {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            background: #ffffff;
            color: #1e40af;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
          }
          .row {
            display: flex;
            gap: 18px;
            align-items: center;
          }
          .qr {
            background: white;
            border-radius: 14px;
            padding: 12px;
            width: 132px;
            height: 132px;
          }
          .qr svg {
            width: 132px;
            height: 132px;
            display: block;
          }
          .meta {
            flex: 1;
          }
          .label {
            font-size: 9px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 10px;
          }
          .value {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 3px;
          }
          .code {
            font-size: 16px;
            letter-spacing: 1.6px;
          }
        </style>
      </head>
      <body>
        <div class="title">Carteirinha do Estudante</div>
        <div class="card">
          <div class="header">
            <strong>Transporte Universitario</strong>
            <span>Carteirinha digital</span>
          </div>
          <div class="content">
            <div class="top">
              ${photoUrl ? `<img class="photo" src="${photoUrl}" />` : `<div class="photo-placeholder">${studentName.charAt(0).toUpperCase()}</div>`}
              <div>
                <div class="student">${studentName}</div>
                <div class="course">${course}</div>
              </div>
            </div>
            <div class="row">
              <div class="qr">${qrSvg}</div>
              <div class="meta">
                <div class="label">Codigo</div>
                <div class="value code">${cardCode}</div>
                ${cpf ? `<div class="label">CPF</div><div class="value">${cpf}</div>` : ''}
                <div class="label">Inicio</div>
                <div class="value">${startDate}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default function StudentHomeScreen() {
  const { user } = useAuthStore();

  const [student, setStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [payments, setPayments] = useState<AccountReceivable[]>([]);
  const [nextPayment, setNextPayment] = useState<AccountReceivable | null>(null);
  const [exportingCard, setExportingCard] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const context = await loadStudentContext(user.id);

      setStudent(context.student);
      setStudentName(context.student?.name ?? null);
      setEnrollment(context.enrollment);
      setPayments(context.payments);
      setNextPayment(context.nextOpenPayment);

      const enrollmentFeeOpen = context.payments.some((payment) => (
        isEnrollmentFee(payment) && payment.status === AccountStatus.OPEN
      ));
      const canCachePass = context.enrollment?.status === EnrollmentStatus.ACTIVE &&
        !enrollmentFeeOpen &&
        Boolean(context.enrollment?.cardCode);

      if (canCachePass && context.enrollment?.cardCode) {
        await saveCachedPass(user.id, {
          student: context.student,
          enrollment: context.enrollment,
          payments: context.payments,
          nextPayment: context.nextOpenPayment,
          passAvailable: true,
          savedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log('Erro ao carregar contexto do aluno:', error);
      const cached = await loadCachedPass(user.id);
      if (cached?.passAvailable && cached.enrollment?.cardCode) {
        setStudent(cached.student);
        setStudentName(cached.student?.name ?? null);
        setEnrollment(cached.enrollment);
        setPayments(cached.payments ?? []);
        setNextPayment(cached.nextPayment ?? null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50">
        <Spinner size="lg" color="student.600" />
      </Box>
    );
  }

  const hasEnrollment = Boolean(enrollment);
  const hasPendingPayments = payments.some(
    (payment) => payment.status === AccountStatus.OPEN,
  );
  const hasOpenEnrollmentFee = payments.some(
    (payment) => isEnrollmentFee(payment) && payment.status === AccountStatus.OPEN,
  );

  const pendingAmount = payments
    .filter((payment) => payment.status === AccountStatus.OPEN)
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const cardCode =
    enrollment?.status === EnrollmentStatus.ACTIVE ? enrollment.cardCode : null;
  const canShowPass = Boolean(cardCode) && !hasOpenEnrollmentFee;

  async function handleExportCardPdf() {
    if (!student || !enrollment || !canShowPass) {
      Alert.alert('Cartão indisponível', 'Seu cartão precisa estar ativo e liberado para exportação.');
      return;
    }

    setExportingCard(true);
    try {
      const html = await buildCardPdfHtml(student, enrollment);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Carteirinha do estudante',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível gerar o PDF do cartão. ${message}`);
    } finally {
      setExportingCard(false);
    }
  }

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader title={`Olá, ${studentName ?? user?.username}`} bg="#7C3AED" />

      <ScrollView
        flex={1}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Box mb="3">
          <TopRefreshButton onPress={load} />
        </Box>

        {enrollment && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
            mb="3"
          >
            <HStack justifyContent="space-between" alignItems="center" mb="3">
              <Text
                fontSize="sm"
                fontWeight="700"
                color="coolGray.800"
                _dark={{ color: 'white' }}
              >
                Status da Matrícula
              </Text>

              <Badge
                colorScheme={
                  enrollment.status === EnrollmentStatus.ACTIVE
                    ? 'success'
                    : enrollment.status === EnrollmentStatus.CANCELED
                      ? 'error'
                      : 'coolGray'
                }
                borderRadius="full"
                variant="subtle"
              >
                {enrollment.status === EnrollmentStatus.ACTIVE
                  ? 'ATIVO'
                  : enrollment.status === EnrollmentStatus.CANCELED
                    ? 'CANCELADO'
                    : 'ENCERRADO'}
              </Badge>
            </HStack>

            <HStack space={6}>
              <VStack>
                <Text fontSize="2xs" color="coolGray.400">
                  Início
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="coolGray.700"
                  _dark={{ color: 'coolGray.300' }}
                >
                  {fmt(getEnrollmentStartDate(enrollment))}
                </Text>
              </VStack>

              {enrollment.endDate && (
                <VStack>
                  <Text fontSize="2xs" color="coolGray.400">
                    Término
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="coolGray.700"
                    _dark={{ color: 'coolGray.300' }}
                  >
                    {fmt(enrollment.endDate)}
                  </Text>
                </VStack>
              )}

              {enrollment.monthlyFee != null && (
                <VStack>
                  <Text fontSize="2xs" color="coolGray.400">
                    Mensalidade
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="coolGray.700"
                    _dark={{ color: 'coolGray.300' }}
                  >
                    {brl(enrollment.monthlyFee)}
                  </Text>
                </VStack>
              )}
            </HStack>
          </Box>
        )}

        {!cardCode && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="8"
            shadow="1"
            mb="3"
            alignItems="center"
          >
            <Icon as={Ionicons} name="card-outline" size="10" color="coolGray.300" />

            <Text
              fontSize="md"
              fontWeight="700"
              color="coolGray.700"
              _dark={{ color: 'coolGray.300' }}
              mt="3"
            >
              Cartão indisponível
            </Text>

            <Text fontSize="xs" color="coolGray.400" mt="1" textAlign="center">
              {hasEnrollment
                ? 'Sua matrícula está ativa, mas ainda existem pagamentos pendentes ou restrições para liberar o passe.'
                : 'Você não possui uma matrícula ativa no momento.'}
            </Text>

            <Pressable
              onPress={load}
              bg="student.600"
              px="6"
              py="3"
              borderRadius="xl"
              mt="5"
              _pressed={{ bg: 'student.700' }}
            >
              <Text fontSize="sm" fontWeight="600" color="white">
                Atualizar status
              </Text>
            </Pressable>
          </Box>
        )}

        {cardCode && hasPendingPayments && !canShowPass && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="8"
            shadow="1"
            mb="3"
            alignItems="center"
          >
            <Icon as={Ionicons} name="close-circle" size="10" color="red.500" />

            <Text
              fontSize="md"
              fontWeight="700"
              color="coolGray.700"
              _dark={{ color: 'coolGray.300' }}
              mt="3"
            >
              Pagamentos pendentes
            </Text>

            <Text fontSize="xs" color="coolGray.400" mt="1" textAlign="center">
              Você possui pagamentos pendentes no valor de:
            </Text>

            <Text fontSize="2xl" fontWeight="800" color="red.500" mt="3">
              {brl(pendingAmount)}
            </Text>

            <Text fontSize="xs" color="coolGray.400" mt="3" textAlign="center">
              Regularize seus pagamentos para acessar seu cartão de transporte.
            </Text>
          </Box>
        )}

        {cardCode && canShowPass && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="6"
            shadow="2"
            mb="3"
            alignItems="center"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
            >
              Passe Digital
            </Text>

            <Text fontSize="xs" color="coolGray.500" mt="1" mb="5">
              Apresente ao embarcar!
            </Text>

            <Box bg="white" p="4" borderRadius="xl">
              <QRCode
                value={cardCode}
                size={180}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </Box>

            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.500"
              mt="4"
              style={{ letterSpacing: 2 }}
            >
              {cardCode}
            </Text>

            <HStack alignItems="center" space={1} mt="2">
              <Icon as={Ionicons} name="checkmark-circle" size="5" color="green.500" />
              <Text fontSize="xs" fontWeight="600" color="green.500">
                Passe ativo
              </Text>
            </HStack>

            <Button
              mt="5"
              colorScheme="green"
              borderRadius="lg"
              onPress={handleExportCardPdf}
              isLoading={exportingCard}
              leftIcon={<Ionicons name="document-text-outline" size={16} color="white" />}
            >
              Exportar PDF
            </Button>
          </Box>
        )}

        {nextPayment && (
          <Box
            bg="white"
            _dark={{ bg: 'coolGray.800' }}
            borderRadius="2xl"
            p="4"
            shadow="1"
          >
            <Text
              fontSize="sm"
              fontWeight="700"
              color="coolGray.800"
              _dark={{ color: 'white' }}
              mb="2"
            >
              Próximo Pagamento
            </Text>

            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text
                  fontSize="xl"
                  fontWeight="700"
                  color="coolGray.800"
                  _dark={{ color: 'white' }}
                >
                  {brl(nextPayment.amount)}
                </Text>

                <Text fontSize="xs" color="coolGray.500">
                  Vence em {fmt(nextPayment.dueDate)}
                </Text>
              </VStack>

              <Badge colorScheme="warning" borderRadius="full" variant="subtle">
                <Text fontSize="2xs" fontWeight="700">
                  PENDENTE
                </Text>
              </Badge>
            </HStack>
          </Box>
        )}
      </ScrollView>
    </Box>
  );
}
