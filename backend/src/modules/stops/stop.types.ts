import { InferInsertModel } from "drizzle-orm";
import { stopsTable } from "../../config/db/db.schema";
import { z } from "zod";
import { stopListPaginatedSchema } from "./stop.schema";
import { Stop } from "./interfaces/Stop";

export type StopInsert = InferInsertModel<typeof stopsTable>;
export type StopUpdate = Partial<StopInsert>;
export type StopListPaginatedQuery = z.infer<typeof stopListPaginatedSchema>;
export type StopFilters = {
    search?: Partial<Stop>
}
