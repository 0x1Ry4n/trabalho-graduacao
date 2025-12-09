import { z } from 'zod';
import { RegexPatterns } from '../../shared/utils/regex.utils';

export const collegeRegistrationSchema = z.object({
    name: z.string().trim().max(150, "O nome da instituição de ensino não pode ter mais de 150 caracteres"),
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres"),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres"),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres"),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido"),
    contactEmail: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres").optional(),
    contactPhone: z.string().max(50, "O telefone não pode ter mais de 20 caracteres").optional(),
});

export const collegeUpdateSchema = z.object({
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres").optional(),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres").optional(),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres").optional(),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido").optional(),
    contactEmail: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres").optional(),
    contactPhone: z.string().max(50, "O telefone não pode ter mais de 20 caracteres").optional(),
});

export const collegeListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    name: z.string(),
    city: z.string(),
    neighborhood: z.string(),
    address: z.string(),
    cep: z.string(),
    contactEmail: z.string().nullable(),
    contactPhone: z.string().nullable(),
});