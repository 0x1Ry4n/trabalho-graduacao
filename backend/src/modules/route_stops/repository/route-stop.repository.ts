import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { RouteStop } from "../interfaces/RouteStop";
import { IRouteStopRepository } from "./IRouteStopRepository";
import { routeStopsTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, SQL } from "drizzle-orm";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { RouteStopFilters, RouteStopInsert, RouteStopUpdate } from "../route-stop.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class RouteStopRepository extends BaseRepository<RouteStop> implements IRouteStopRepository {
    async findById(id: number, tx?: DbTransaction): Promise<RouteStop | null> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .select()
            .from(routeStopsTable)
            .where(eq(routeStopsTable.id, id))
            .limit(1);

        return routeStop ?? null;
    }

    async findByRouteAndStop(routeId: number, stopId: number, tx?: DbTransaction): Promise<RouteStop | null> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .select()
            .from(routeStopsTable)
            .where(and(
                eq(routeStopsTable.routeId, routeId),
                eq(routeStopsTable.stopId, stopId)
            ))
            .limit(1);

        return routeStop ?? null;
    }

    async findByRouteAndOrder(routeId: number, stopOrder: number, tx?: DbTransaction): Promise<RouteStop | null> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .select()
            .from(routeStopsTable)
            .where(and(
                eq(routeStopsTable.routeId, routeId),
                eq(routeStopsTable.stopOrder, stopOrder)
            ))
            .limit(1);

        return routeStop ?? null;
    }

    async listByRoute(routeId: number, tx?: DbTransaction): Promise<RouteStop[]> {
        const dbInstance = this.getDb(tx);

        return await dbInstance
            .select()
            .from(routeStopsTable)
            .where(eq(routeStopsTable.routeId, routeId))
            .orderBy(asc(routeStopsTable.stopOrder));
    }

    async create(data: RouteStopInsert, tx?: DbTransaction): Promise<RouteStop> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .insert(routeStopsTable)
            .values(data)
            .returning();

        return routeStop;
    }

    async update(id: number, data: RouteStopUpdate, tx?: DbTransaction): Promise<RouteStop | null> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .update(routeStopsTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(routeStopsTable.id, id))
            .returning();

        return routeStop ?? null;
    }

    async delete(id: number, tx?: DbTransaction): Promise<RouteStop | null> {
        const dbInstance = this.getDb(tx);

        const [routeStop] = await dbInstance
            .delete(routeStopsTable)
            .where(eq(routeStopsTable.id, id))
            .returning();

        return routeStop ?? null;
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: RouteStopFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<RouteStop> | null> {
        const dbInstance = this.getDb(tx);

        let query = dbInstance
            .select()
            .from(routeStopsTable)
            .$dynamic();

        if (filters?.search) {
            const { routeId, stopId } = filters.search;
            const conditions: SQL[] = [];

            if (routeId) conditions.push(eq(routeStopsTable.routeId, routeId));
            if (stopId) conditions.push(eq(routeStopsTable.stopId, stopId));

            if (conditions.length) {
                query = query.where(and(...conditions));
            }
        }

        const totalCountQuery = await dbInstance
            .select({ count: count() })
            .from(routeStopsTable);

        return paginateQuery<RouteStop>(
            query,
            totalCountQuery,
            asc(routeStopsTable.stopOrder),
            { page, pageSize }
        );
    }
}
