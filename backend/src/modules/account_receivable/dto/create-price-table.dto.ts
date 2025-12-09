import { z } from 'zod';
import { priceTableRegistrationSchema } from '../account_receivable.schema';

export type CreatePriceTableDTO = z.infer<typeof priceTableRegistrationSchema>;