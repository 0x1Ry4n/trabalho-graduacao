import { InferInsertModel } from "drizzle-orm";
import { routeStopsTable } from "../../config/db/db.schema";
import { z } from "zod";
import { routeStopListPaginatedSchema } from "./route-stop.schema";
import { RouteStop } from "./interfaces/RouteStop";

export type RouteStopInsert = InferInsertModel<typeof routeStopsTable>;
export type RouteStopUpdate = Partial<RouteStopInsert>;
export type RouteStopListPaginatedQuery = z.infer<typeof routeStopListPaginatedSchema>;
export type RouteStopFilters = {
    search?: Partial<RouteStop>
}
