import { z } from 'zod';
import { UserRole } from '../../shared/enums/user-role.enum';

export const userRegistrationSchema = z.object({
    username: z.string().trim().min(3, "O username deve ter pelo menos 3 caracteres").max(20, "O username não pode ter mais de 20 caracteres")
        .regex(/^[a-zA-Z0-9_]+$/, "O username só pode conter letras, números e underscore"),
    email: z.email("Email inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100, "A senha não pode exceder 100 caracteres"),
    role: z.enum(UserRole)
});

export const userUpdateSchema = z.object({
    username: z.string().trim().min(3, "O username deve ter pelo menos 3 caracteres").max(20, "O username não pode ter mais de 20 caracteres")
        .regex(/^[a-zA-Z0-9_]+$/, "O username só pode conter letras, números e underscore").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100, "A senha não pode exceder 100 caracteres").optional(),
    role: z.enum(UserRole).optional(),
});

export const userListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    username: z.string().trim().min(1, 'Username não pode ser vazio').optional(),
    email: z.email('Email inválido').trim().optional(),
    role: z.string().trim().min(1, 'Role não pode ser vazio').optional(),
    active: z.enum(['true', 'false', '1', '0']).transform((val) => val === 'true' || val === '1' ? 1 : 0).optional()
});

