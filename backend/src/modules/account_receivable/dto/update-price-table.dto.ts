import { z } from 'zod';
import { priceTableUpdateSchema } from '../account_receivable.schema';

export type UpdatePriceTableDTO = z.infer<typeof priceTableUpdateSchema>;