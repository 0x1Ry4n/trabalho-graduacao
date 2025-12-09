import { z } from 'zod';
import { PaymentType } from '../../shared/enums/payment-type.enum';
import { AccountStatus } from '../../shared/enums/account-status.enum';
import { PaymentProofType } from '../../shared/enums/payment-proof-type.enum';
import { AccountReceivableType } from '../../shared/enums/account-receivable-type.enum';

export const accountReceivableRegistrationSchema = z.object({
    payerId: z.number().int().positive(),
    enrollmentId: z.number().int().positive(),
    description: z.string().max(200, "A descrição da conta a pagar não pode ter mais de 200 caracteres"),
    amount: z.number(),
    dueDate: z.coerce.date(),
    accountReceivableType: z.enum(AccountReceivableType),
    paymentType: z.enum(PaymentType).default(PaymentType.ANY),
    status: z.enum(AccountStatus).default(AccountStatus.OPEN),
    paymentDate: z.coerce.date().optional().nullable(),
    paymentProofUrl: z.url().max(255, "A URL do comprovante de pagamento não pode ter mais de 255 caracteres").optional(),
    paymentProofType: z.enum(PaymentProofType).optional()
});

export const accountReceivableUpdateSchema = z.object({
    paymentType: z.enum(PaymentType).default(PaymentType.ANY).optional(),
    status: z.enum(AccountStatus).default(AccountStatus.OPEN).optional(),
    paymentDate: z.date().optional().nullable().optional(),
    paymentProofType: z.enum(PaymentProofType).optional(),
    paymentProofUrl: z.url().max(255, "A URL do comprovante de pagamento não pode ter mais de 255 caracteres").optional(),
    active: z.number().optional(),
});

export const priceTableRegistrationSchema = z.object({
    price: z.number().positive(),
    type: z.enum(AccountReceivableType),
    paymentType: z.enum(PaymentType).default(PaymentType.ANY),
    dueDate: z.coerce.date(),
    active: z.number().default(1),
});

export const priceTableUpdateSchema = z.object({
    price: z.number().positive().optional(),
    dueDate: z.coerce.date().optional(),
    active: z.number().default(1).optional(),
});

export const accountReceivableListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    payerId: z.number().int().positive(),
    enrollmentId: z.number().int().positive(),
    description: z.string(),
    amount: z.number(),
    dueDate: z.date(),
    accountReceivableType: z.enum(AccountReceivableType),
    paymentType: z.enum(PaymentType),
    status: z.enum(AccountStatus),
    paymentDate: z.date().nullable(),
    paymentProofUrl: z.url(),
    paymentProofType: z.enum(PaymentProofType).nullable()
})