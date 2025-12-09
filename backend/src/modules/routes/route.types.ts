import { InferInsertModel } from "drizzle-orm";
import { routesTable } from "../../config/db/db.schema";
import { z } from "zod";
import { routeListPaginatedSchema } from "./route.schema";
import { Route } from "./interfaces/Route";

export type RouteInsert = InferInsertModel<typeof routesTable>;
export type RouteUpdate = Partial<RouteInsert>;
export type RouteListPaginatedQuery = z.infer<typeof routeListPaginatedSchema>;
export type RouteFilters = {
    search?: Partial<Route>
}
