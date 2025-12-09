import { z } from "zod";
import { RegexPatterns } from "../../shared/utils/regex.utils";
import { EnrollmentStatus } from "../../shared/enums/enrollment-status.enum";

const currentYear = new Date().getFullYear();

export const enrollmentRegistrationSchema = z.object({
    studentId: z.number().int().positive(),
    collegeId: z.number().int().positive(),
    course: z.string().max(150, "O código não pode ter mais de 150 caracteres"),
    semester: z.int().positive().min(1, "Semestre inválido").max(2, "O semestre deve ser 1 ou 2"),
    year: z.int().positive().min(2000, "Ano inválido").max(currentYear + 1, "Ano inválido"),
    monthlyFee: z.number().positive().nonnegative("O valor da mensalidade não pode ser negativa"),
    enrollmentFee: z.number().positive().nonnegative("O valor da matrícula não pode ser negativa"),
    photoUrl: z.url().max(255, "A URL da foto do estudante não pode ter mais de 255 caracteres").optional().nullable(),
    residenceProofUrl: z.url().max(255, "A URL do comprovante de residência não pode ter mais de 255 caracteres").optional().nullable(),
    collegeEnrollmentUrl: z.url().max(255, "A URL do comprovante de matrícula não pode ter mais de 255 caracteres").optional().nullable(),
});

export const enrollmentUpdateSchema = z.object({
    status: z.enum(EnrollmentStatus).optional(),
    photoUrl: z.url().max(255, "A URL da foto do estudante não pode ter mais de 255 caracteres").optional(),
    residenceProofUrl: z.url().max(255, "A URL do comprovante de residência não pode ter mais de 255 caracteres").optional(),
    collegeEnrollmentUrl: z.url().max(255, "A URL do comprovante de matrícula não pode ter mais de 255 caracteres").optional(),
});

export const enrollmentListPaginatedSchema = z.object({
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
    studentName: z.string(),
    cardCode: z.string(),
    collegeId: z.string(),
    collegeName: z.string(),
    course: z.string(),
    semester: z.int().positive(),
    year: z.int().positive(),
    monthlyFee: z.number(),
    enrollmentFee: z.number(),
    status: z.enum(EnrollmentStatus),
    photoUrl: z.string(),
    residenceProofUrl: z.string(),
    collegeEnrollmentUrl: z.string()
})