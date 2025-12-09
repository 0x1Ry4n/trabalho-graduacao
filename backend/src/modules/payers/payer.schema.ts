import { z } from 'zod';
import { PayerType } from '../../shared/enums/payer-type.enum';

export const payerRegistrationSchema = z.object({
    type: z.enum(PayerType),
    studentId: z.number().int().positive().optional(),
    companyName: z.string().max(150, "O nome da compania não pode ter mais de 150 caracteres").optional(),
});