import { z } from 'zod';
import { payerRegistrationSchema } from '../payer.schema';

export type CreatePayerDTO = z.infer<typeof payerRegistrationSchema>;