import { z } from 'zod';
import { accountReceivableRegistrationSchema } from '../account_receivable.schema';

export type CreateAccountReceivableDTO = z.infer<typeof accountReceivableRegistrationSchema>;
