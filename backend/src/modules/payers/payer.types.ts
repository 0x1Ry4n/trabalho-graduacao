import { InferInsertModel } from "drizzle-orm";
import { payersTable } from "../../config/db/db.schema";

export type PayerInsert = InferInsertModel<typeof payersTable>;