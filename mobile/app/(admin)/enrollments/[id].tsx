import React, { useEffect, useState } from 'react';
import {
    Box, VStack, HStack, Text, ScrollView, Pressable, Icon, Badge, Button, useToast, Image,
} from 'native-base';
import { Alert, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { enrollmentsApi } from '../../../src/api/enrollments';
import { paymentsApi } from '../../../src/api/payments';
import { AccountReceivable, AccountReceivableType, AccountStatus, Enrollment, EnrollmentStatus } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LoadingSpinner, InfoRow } from '../../../src/components/shared';
import { formatRG, maskCPF, maskCurrency, maskPhone } from '../../../src/utils/masks';
import { BASE_URL, SECURE_KEYS } from '../../../src/api/client';

function statusLabel(s: EnrollmentStatus) {
    return s === 'ACTIVE' ? 'Ativo' : s === 'CANCELED' ? 'Cancelado' : 'Encerrado';
}

function statusColor(s: EnrollmentStatus) {
    return s === 'ACTIVE' ? 'success' : s === 'CANCELED' ? 'error' : 'coolGray';
}

function isPaidEnrollmentFee(payment: AccountReceivable, enrollmentId: string) {
    const paymentType = (payment as any).accountReceivableType ?? (payment as any).type;
    const paymentDescription = String(payment.description ?? '').toLowerCase();

    return (
        String(payment.enrollmentId) === String(enrollmentId) &&
        (
            paymentType === AccountReceivableType.ENROLLMENT_FEE ||
            paymentDescription.includes('matr')
        ) &&
        String(payment.status ?? '').toUpperCase() === AccountStatus.PAID
    );
}

function isEnrollmentFee(payment: AccountReceivable, enrollmentId: string) {
    const paymentType = (payment as any).accountReceivableType ?? (payment as any).type;
    const paymentDescription = String(payment.description ?? '').toLowerCase();

    return (
        String(payment.enrollmentId) === String(enrollmentId) &&
        (
            paymentType === AccountReceivableType.ENROLLMENT_FEE ||
            paymentDescription.includes('matr')
        )
    );
}

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

function escapeHtml(value?: string | number | null) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getEnrollmentPhotoUrl(enrollment: Enrollment) {
    return enrollment.student?.photoUrl || enrollment.photoUrl || '';
}

async function buildCardPdfHtml(enrollment: Enrollment) {
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

    const studentName = escapeHtml(enrollment.student?.name ?? 'Aluno');
    const course = escapeHtml(enrollment.course);
    const cpf = escapeHtml(enrollment.student?.cpf ? maskCPF(enrollment.student.cpf) : '');
    const startDate = escapeHtml(formatDateBR(enrollment.startDate) ?? 'Não informado');
    const cardCode = escapeHtml(enrollment.cardCode);
    const photoUrl = escapeHtml(getEnrollmentPhotoUrl(enrollment));

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
                <div class="title">Carteirinha da Matrícula</div>
                <div class="card">
                    <div class="header">
                        <strong>Transporte Universitário</strong>
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
                                <div class="label">Código</div>
                                <div class="value code">${cardCode}</div>
                                ${cpf ? `<div class="label">CPF</div><div class="value">${cpf}</div>` : ''}
                                <div class="label">Início</div>
                                <div class="value">${startDate}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
}

export default function EnrollmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [payments, setPayments] = useState<AccountReceivable[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCardPreview, setShowCardPreview] = useState(false);
    const [exportingCard, setExportingCard] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const toast = useToast();

    useEffect(() => { if (id) load(); }, [id]);

    async function load() {
        try {
            const [enrollmentResult, paymentsResult] = await Promise.allSettled([
                enrollmentsApi.getById(id!),
                paymentsApi.list(),
            ]);

            if (enrollmentResult.status === 'fulfilled') {
                setEnrollment(enrollmentResult.value);
            }

            if (paymentsResult.status === 'fulfilled') {
                setPayments(Array.isArray(paymentsResult.value) ? paymentsResult.value : []);
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar a matrícula.');
        } finally {
            setLoading(false);
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

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        return data.url ?? data.data?.url;
    }

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
            });
            if (result.canceled) return;

            const fileUrl = await uploadFile(result.assets[0]);
            if (!fileUrl) throw new Error('Upload without URL');

            const updated = await enrollmentsApi.update(id!, {
                status: enrollment?.status,
                collegeEnrollmentUrl: fileUrl,
            });
            setEnrollment((current) => current ? { ...current, ...updated } : updated);
            toast.show({ description: 'Arquivo anexado com sucesso!', placement: 'top' });
        } catch (error) {
            Alert.alert('Erro', 'Falha ao anexar arquivo.');
        }
    };

    function handleToggleEnrollmentStatus() {
        if (!enrollment) return;

        const nextStatus = enrollment.status === EnrollmentStatus.ACTIVE
            ? EnrollmentStatus.CANCELED
            : EnrollmentStatus.ACTIVE;

        Alert.alert(
            enrollment.status === EnrollmentStatus.ACTIVE ? 'Inativar matrícula' : 'Reativar matrícula',
            enrollment.status === EnrollmentStatus.ACTIVE
                ? 'Tem certeza que deseja inativar esta matrícula?'
                : 'Tem certeza que deseja reativar esta matrícula?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: enrollment.status === EnrollmentStatus.ACTIVE ? 'Inativar' : 'Reativar',
                    style: enrollment.status === EnrollmentStatus.ACTIVE ? 'destructive' : 'default',
                    onPress: async () => {
                        setUpdatingStatus(true);
                        try {
                            const updated = await enrollmentsApi.update(id!, { status: nextStatus });
                            setEnrollment((current) => current ? { ...current, ...updated, status: nextStatus } : updated);
                            toast.show({ description: 'Status da matrícula atualizado!', placement: 'top' });
                        } catch {
                            Alert.alert('Erro', 'Não foi possível atualizar o status da matrícula.');
                        } finally {
                            setUpdatingStatus(false);
                        }
                    },
                },
            ]
        );
    }

    function handleToggleCardPreview(canGenerateCard: boolean) {
        if (!canGenerateCard) {
            Alert.alert('Carteirinha bloqueada', 'Marque a taxa de matrícula como paga para visualizar a carteirinha.');
            return;
        }

        setShowCardPreview((current) => !current);
    }

    async function handleExportCardPdf(canGenerateCard: boolean) {
        if (!enrollment) return;

        if (!canGenerateCard) {
            Alert.alert('Carteirinha bloqueada', 'Marque a taxa de matrícula como paga para exportar a carteirinha em PDF.');
            return;
        }

        setExportingCard(true);
        try {
            const html = await buildCardPdfHtml(enrollment);
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Carteirinha da matrícula',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                toast.show({ description: `PDF gerado: ${uri}`, placement: 'top' });
            }
        } catch (error) {
            console.error('Erro ao gerar PDF da carteirinha:', error);
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            Alert.alert('Erro', `Não foi possível gerar o PDF da carteirinha. ${message}`);
        } finally {
            setExportingCard(false);
        }
    }

    if (loading) return <LoadingSpinner color="admin.600" />;

    if (!enrollment) return null;

    const hasPaidEnrollmentFee = payments.some((payment) => isPaidEnrollmentFee(payment, enrollment.id));
    const enrollmentFeePayment = payments.find((payment) => isEnrollmentFee(payment, enrollment.id));
    const canGenerateCard = hasPaidEnrollmentFee;
    const enrollmentPhotoUrl = getEnrollmentPhotoUrl(enrollment);
    const isActiveEnrollment = enrollment.status === EnrollmentStatus.ACTIVE;

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title={`Matrícula ${enrollment.cardCode}`}
                bg="#1E40AF"
                showBack
                showMenu={false}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <HStack justifyContent="space-between" alignItems="flex-start">
                        <VStack>
                            <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>Status da Matrícula</Text>
                            <Text fontSize="xs" color="coolGray.500" mt="1">Código: {enrollment.cardCode}</Text>
                            <Text fontSize="xs" color={hasPaidEnrollmentFee ? 'green.600' : 'amber.600'} mt="1">
                                Taxa de matrícula: {hasPaidEnrollmentFee ? 'paga' : 'pendente'}
                            </Text>
                        </VStack>
                        <VStack alignItems="flex-end" space={2}>
                            <Badge
                                colorScheme={statusColor(enrollment.status)}
                                borderRadius="full" variant="subtle"
                            >
                                {statusLabel(enrollment.status)}
                            </Badge>
                            <Pressable
                                px="4"
                                py="2"
                                bg={isActiveEnrollment ? 'red.50' : 'green.50'}
                                _pressed={{ bg: isActiveEnrollment ? 'red.100' : 'green.100' }}
                                borderRadius="lg"
                                opacity={updatingStatus ? 0.6 : 1}
                                disabled={updatingStatus}
                                onPress={handleToggleEnrollmentStatus}
                            >
                                <Text fontSize="xs" fontWeight="700" color={isActiveEnrollment ? 'red.500' : 'green.500'}>
                                    {isActiveEnrollment ? 'Inativar' : 'Reativar'}
                                </Text>
                            </Pressable>
                        </VStack>
                    </HStack>
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <HStack justifyContent="space-between" alignItems="center" space={3}>
                        <VStack flex={1}>
                            <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }}>
                                Carteirinha da matrícula
                            </Text>
                            <Text fontSize="xs" color="coolGray.500" mt="1">
                                {canGenerateCard
                                    ? 'Prévia liberada para conferência e exportação.'
                                    : 'Disponível após o pagamento da taxa de matrícula.'}
                            </Text>
                        </VStack>
                        <Pressable
                            onPress={() => handleToggleCardPreview(canGenerateCard)}
                            px="3"
                            py="2"
                            bg={canGenerateCard ? 'admin.50' : 'coolGray.100'}
                            _pressed={{ bg: canGenerateCard ? 'admin.100' : 'coolGray.200' }}
                            borderRadius="lg"
                        >
                            <HStack alignItems="center" space={1}>
                                <Ionicons
                                    name={showCardPreview && canGenerateCard ? 'eye-off-outline' : 'eye-outline'}
                                    size={16}
                                    color={canGenerateCard ? '#1D4ED8' : '#6B7280'}
                                />
                                <Text fontSize="2xs" fontWeight="700" color={canGenerateCard ? 'admin.700' : 'coolGray.500'}>
                                    {showCardPreview && canGenerateCard ? 'Fechar prévia' : 'Abrir prévia'}
                                </Text>
                            </HStack>
                        </Pressable>
                    </HStack>
                    {showCardPreview && canGenerateCard && (
                        <EnrollmentCardPreview
                            enrollment={enrollment}
                            onExportPdf={() => handleExportCardPdf(canGenerateCard)}
                            exporting={exportingCard}
                        />
                    )}
                </Box>

                {enrollment.student && (
                    <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                        <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Dados do Aluno</Text>
                        <HStack alignItems="center" justifyContent="space-between" mb="4" space={3}>
                            <HStack alignItems="center" space={3} flex={1}>
                                {enrollmentPhotoUrl ? (
                                    <Image
                                        source={{ uri: enrollmentPhotoUrl }}
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
                                    <Text fontSize="xs" color="coolGray.500">Foto do cadastro</Text>
                                    <Text fontSize="sm" fontWeight="700" color="coolGray.800" _dark={{ color: 'white' }} numberOfLines={1}>
                                        {enrollmentPhotoUrl ? 'Com anexo' : 'Sem anexo'}
                                    </Text>
                                </VStack>
                            </HStack>
                        </HStack>
                        <InfoRow label="Nome" value={enrollment.student.name} />
                        <InfoRow label="CPF" value={maskCPF(enrollment.student.cpf)} />
                        <InfoRow label="RG" value={formatRG(enrollment.student.rg)} />
                        <InfoRow label="Telefone" value={maskPhone(enrollment.student.phone)} />
                        <InfoRow label="E-mail" value={enrollment.student.email} />
                    </Box>
                )}

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Informações Acadêmicas</Text>
                    <InfoRow label="Curso" value={enrollment.course} />
                    <InfoRow label="Semestre" value={enrollment.semester?.toString()} />
                    <InfoRow label="Ano" value={enrollment.year?.toString()} />
                    {enrollment.monthlyFee && (
                        <InfoRow label="Mensalidade" value={maskCurrency(String(enrollment.monthlyFee))} />
                    )}
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Datas</Text>
                    <InfoRow label="Data de Início" value={formatDateBR(enrollment.startDate)} />
                    {enrollment.endDate && (
                        <InfoRow label="Data de Encerramento" value={formatDateBR(enrollment.endDate)} />
                    )}
                    <InfoRow label="Data de Criação" value={formatDateBR(enrollment.createdAt)} />
                    <InfoRow label="Última Atualização" value={formatDateBR(enrollment.updatedAt)} />
                </Box>

                <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="4" shadow="1" mb="3">
                    <Text fontSize="sm" fontWeight="700" mb="3" color="coolGray.800" _dark={{ color: 'white' }}>Documentos</Text>
                    <VStack space={2}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text fontSize="sm">Comprovante de Matrícula</Text>
                            {enrollment.collegeEnrollmentUrl ? (
                                <HStack space={2}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        colorScheme="admin"
                                        onPress={() => Linking.openURL(enrollment.collegeEnrollmentUrl!)}
                                        borderRadius="xl"
                                        leftIcon={<Ionicons name="open-outline" size={16} color="#1D4ED8" />}
                                    >
                                        Abrir
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme="admin"
                                        onPress={pickDocument}
                                        borderRadius="xl"
                                        leftIcon={<Ionicons name="document-attach-outline" size={16} color="white" />}
                                    >
                                        Trocar
                                    </Button>
                                </HStack>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="admin"
                                    onPress={pickDocument}
                                    borderRadius="xl"
                                    leftIcon={<Ionicons name="document-attach-outline" size={16} color="#1D4ED8" />}
                                >
                                    Anexar
                                </Button>
                            )}
                        </HStack>
                    </VStack>
                </Box>
            </ScrollView>
        </Box>
    );
}

function EnrollmentCardPreview({
    enrollment,
    onExportPdf,
    exporting,
}: {
    enrollment: Enrollment;
    onExportPdf: () => void;
    exporting: boolean;
}) {
    if (!enrollment.cardCode) return null;

    const photoUrl = getEnrollmentPhotoUrl(enrollment);

    return (
        <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="2xl" p="2" mb="3">
            <HStack justifyContent="space-between" alignItems="center" mb="4" space={3}>
                <VStack flex={1}>
                    <Button
                        size="sm"
                        colorScheme="green"
                        borderRadius="lg"
                        onPress={onExportPdf}
                        isLoading={exporting}
                        leftIcon={<Ionicons name="document-text-outline" size={16} color="white" />}
                    >
                        Exportar PDF
                    </Button>
                </VStack>
            </HStack>

            <Box bg="#0F172A" borderRadius="2xl" overflow="hidden" borderWidth={1} borderColor="coolGray.200">
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
                        {photoUrl ? (
                            <Image
                                source={{ uri: photoUrl }}
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
                                {enrollment.student?.name ?? 'Aluno'}
                            </Text>
                            <Text color="coolGray.300" fontSize="xs" mt="1" numberOfLines={1}>
                                {enrollment.course}
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
                            {enrollment.student?.cpf ? (
                                <VStack>
                                    <Text color="coolGray.400" fontSize="2xs">CPF</Text>
                                    <Text color="white" fontSize="xs" fontWeight="600">
                                        {maskCPF(enrollment.student.cpf)}
                                    </Text>
                                </VStack>
                            ) : null}
                            <VStack>
                                <Text color="coolGray.400" fontSize="2xs">Início</Text>
                                <Text color="white" fontSize="xs" fontWeight="600">
                                    {formatDateBR(enrollment.startDate) ?? 'Não informado'}
                                </Text>
                            </VStack>
                        </VStack>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
}
