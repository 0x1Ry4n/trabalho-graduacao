import { z } from 'zod';
import { accountReceivableUpdateSchema } from '../account_receivable.schema';

export type UpdateAccountReceivableDTO = z.infer<typeof accountReceivableUpdateSchema>;
