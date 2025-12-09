import { InferInsertModel } from "drizzle-orm";
import { accountsReceivableTable, pricesTable } from "../../config/db/db.schema";
import { z } from "zod";
import { accountReceivableListPaginatedSchema } from "./account_receivable.schema";
import { IAccountReceivableFilters } from "./interfaces/AccountReceivableFilters";

export type PriceTableInsert = InferInsertModel<typeof pricesTable>;
export type PriceTableUpdate = Partial<PriceTableInsert>;
export type AccountReceivableInsert = InferInsertModel<typeof accountsReceivableTable>;
export type AccountReceivableUpdate = Partial<AccountReceivableInsert>;
export type AccountReceivableListPaginatedQuery = z.infer<typeof accountReceivableListPaginatedSchema>;
export type AccountReceivableFilters = {
    search?: Partial<IAccountReceivableFilters>
}