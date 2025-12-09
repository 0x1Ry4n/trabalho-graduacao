import { InferInsertModel } from "drizzle-orm";
import { studentRoutesTable } from "../../config/db/db.schema";
import { z } from "zod";
import { studentRouteListPaginatedSchema } from "./student-route.schema";
import { StudentRoute } from "./interfaces/StudentRoute";

export type StudentRouteInsert = InferInsertModel<typeof studentRoutesTable>;
export type StudentRouteUpdate = Partial<StudentRouteInsert>;
export type StudentRouteListPaginatedQuery = z.infer<typeof studentRouteListPaginatedSchema>;
export type StudentRouteFilters = {
    search?: Partial<StudentRoute> & {
        routeId?: number;
    }
}
