import { z } from 'zod';
import { RegexPatterns } from '../../shared/utils/regex.utils';
import { CardValidationStatus } from '../../shared/enums/card-validation-status.enum';

export const studentRegistrationSchema = z.object({
    userId: z.number().int().positive(),
    name: z.string().trim().min(8, "O nome do estudante deve ter pelo menos 8 caracteres").max(150, "O nome do estudante não pode ter mais de 150 caracteres"),
    motherName: z.string().trim().min(8, "O nome do mãe deve ter pelo menos 8 caracteres").max(150, "O nome da mãe não pode ter mais de 150 caracteres"),
    cpf: z.string().max(15, "O CPF não pode ter mais de 15 caracteres").regex(RegexPatterns.cpfRegex, "CPF inválido"),
    rg: z.string().max(11, "O RG não pode ter mais de 11 caracteres").regex(RegexPatterns.rgRegex, "RG inválido"),
    cin: z.string().min(11, "O CIN deve ter pelo menos 11 caracteres").max(12, "O CIN não pode ter mais de 11 caracteres").optional(),
    phone: z.string().max(20, "O telefone não pode ter mais de 20 caracteres"),
    email: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres"),
    birthDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ),
    collegeId: z.number().int().positive("O ID da instituição deve ser um número positivo"),
    course: z.string().max(150, "O nome do curso não pode ter mais de 150 caracteres"),
    semester: z.number().int().positive("O semestre deve ser um número positivo"),
    year: z.number().int().positive("O ano deve ser um número positivo"),
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres"),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres"),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres"),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido"),
    notes: z.string().max(1000, "As anotações do estudante não podem ultrapassar 1000 caracteres").optional(),
    // photoUrl: z.string().max(255, "O caminho da imagem de perfil salva não pode ter mais de 255 caracteres"),
    // residenceProofUrl: z.string().max(255, "O caminho do comprovante de residência não pode ter mais de 255 caracteres"),
});

export const studentUpdateSchema = z.object({
    cpf: z.string().max(15, "O CPF não pode ter mais de 15 caracteres").regex(RegexPatterns.cpfRegex, "CPF inválido").optional(),
    rg: z.string().max(11, "O RG não pode ter mais de 11 caracteres").regex(RegexPatterns.rgRegex, "RG inválido").optional(),
    cin: z.string().min(11, "O CIN deve ter pelo menos 11 caracteres").max(12, "O CIN não pode ter mais de 11 caracteres").optional(),
    phone: z.string().max(20, "O telefone não pode ter mais de 20 caracteres").optional(),
    email: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres").optional(),
    birthDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ).optional(),
    collegeId: z.number().int().positive("O ID da instituição deve ser um número positivo").optional(),
    course: z.string().max(150, "O nome do curso não pode ter mais de 150 caracteres").optional(),
    semester: z.number().int().positive("O semestre deve ser um número positivo").optional(),
    year: z.number().int().positive("O ano deve ser um número positivo").optional(),
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres").optional(),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres").optional(),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres").optional(),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido").optional(),
    notes: z.string().max(1000, "As anotações do estudante não podem ultrapassar 1000 caracteres").optional(),
    photoUrl: z.string().max(255, "O caminho da imagem de perfil salva não pode ter mais de 255 caracteres").optional(),
    residenceProofUrl: z.string().max(255, "O caminho do comprovante de residência não pode ter mais de 255 caracteres").optional(),
});

export const cardValidationRegistrationSchema = z.object({
    studentId: z.number().int().positive(),
    driverId: z.number().int().positive(),
    routeId: z.number().int().positive(),
    validationTime: z.coerce.date().optional(),
    latitude: z.number().min(-90).max(90).transform(v => v?.toString()).nullable().optional(),
    longitude: z.number().min(-180).max(180).transform(v => v?.toString()).nullable().optional(),
    status: z.enum(CardValidationStatus),
});

export const studentListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    userId: z.number().int().positive(),
    name: z.string(),
    motherName: z.string(),
    cpf: z.string(),
    rg: z.string(),
    cin: z.string(),
    phone: z.string().nullable(),
    email: z.string(),
    birthDate: z.coerce.date(),
    collegeId: z.number().int().positive(),
    course: z.string(),
    semester: z.number().int().positive(),
    year: z.number().int().positive(),
    city: z.string(),
    neighborhood: z.string(),
    address: z.string(),
    cep: z.string(),
    notes: z.string(),
    active: z.string()
});

export const cardValidationPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    id: z.number().int().positive(),
    studentId: z.number().int().positive(),
    driverId: z.number().int().positive(),
    routeId: z.number().int().positive(),
    validationTime: z.coerce.date().optional(),
    latitude: z.number().transform(v => v?.toString()).nullable().optional(),
    longitude: z.number().transform(v => v?.toString()).nullable().optional(),
    status: z.string(),
});