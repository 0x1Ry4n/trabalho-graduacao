import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { Route } from "../interfaces/Route";
import { IRouteRepository } from "./IRouteRepository";
import { routesTable, routeStopsTable, stopsTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, ilike, isNull, SQL } from "drizzle-orm";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { RouteFilters, RouteInsert, RouteUpdate } from "../route.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class RouteRepository extends BaseRepository<Route> implements IRouteRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Route | null> {
        const dbInstance = this.getDb(tx);

        const [route] = await dbInstance
            .select()
            .from(routesTable)
            .where(eq(routesTable.id, id))
            .limit(1);

        return route ?? null;
    }

    async findByName(name: string, tx?: DbTransaction): Promise<Route | null> {
        const dbInstance = this.getDb(tx);

        const [route] = await dbInstance
            .select()
            .from(routesTable)
            .where(eq(routesTable.name, name))
            .limit(1);

        return route ?? null;
    }

    async create(data: RouteInsert, tx?: DbTransaction): Promise<Route> {
        const dbInstance = this.getDb(tx);

        const [route] = await dbInstance
            .insert(routesTable)
            .values(data)
            .returning();

        return route;
    }

    async update(id: number, data: RouteUpdate, tx?: DbTransaction): Promise<Route | null> {
        const dbInstance = this.getDb(tx);

        const [route] = await dbInstance
            .update(routesTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(routesTable.id, id))
            .returning();

        return route ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(routesTable)
            .set({ active: 1 })
            .where(eq(routesTable.id, id));
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(routesTable)
            .set({ active: 0 })
            .where(eq(routesTable.id, id));
    }

    async delete(id: number, tx?: DbTransaction): Promise<Route | null> {
        const dbInstance = this.getDb(tx);

        const [route] = await dbInstance
            .update(routesTable)
            .set({ active: 0, deletedAt: new Date() })
            .where(eq(routesTable.id, id))
            .returning();

        return route ?? null;
    }

    async list(tx?: DbTransaction): Promise<Route[]> {
        const dbInstance = this.getDb(tx);
        return await dbInstance.select().from(routesTable).where(isNull(routesTable.deletedAt));
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: RouteFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<Route> | null> {
        const dbInstance = this.getDb(tx);

        let routesQuery = dbInstance
            .select()
            .from(routesTable)
            .$dynamic();

        const conditions: SQL[] = [isNull(routesTable.deletedAt)];

        if (filters?.search) {
            const { name, vehicleId, driverId, active } = filters.search;

            if (name) conditions.push(ilike(routesTable.name, `%${name}%`));
            if (vehicleId) conditions.push(eq(routesTable.vehicleId, vehicleId));
            if (driverId) conditions.push(eq(routesTable.driverId, driverId));
            if (active !== undefined) conditions.push(eq(routesTable.active, active));
        }

        routesQuery = routesQuery.where(and(...conditions));

        const routesTotalCountQuery = await dbInstance
            .select({ count: count() })
            .from(routesTable)
            .where(isNull(routesTable.deletedAt));

        return paginateQuery<Route>(
            routesQuery,
            routesTotalCountQuery,
            asc(routesTable.id),
            { page, pageSize }
        );
    }

    async getStops(routeId: number, tx?: DbTransaction) {
        const dbInstance = this.getDb(tx);

        const routeStops = await dbInstance
            .select({
                id: stopsTable.id,
                routeStopId: routeStopsTable.id,
                routeId: routeStopsTable.routeId,
                stopId: routeStopsTable.stopId,
                name: stopsTable.name,
                address: stopsTable.address,
                city: stopsTable.city,
                neighborhood: stopsTable.neighborhood,
                cep: stopsTable.cep,
                latitude: stopsTable.latitude,
                longitude: stopsTable.longitude,
                createdAt: stopsTable.createdAt,
                updatedAt: stopsTable.updatedAt,
                stopOrder: routeStopsTable.stopOrder,
                estimatedArrival: routeStopsTable.estimatedArrival,
            })
            .from(routeStopsTable)
            .innerJoin(stopsTable, eq(routeStopsTable.stopId, stopsTable.id))
            .where(eq(routeStopsTable.routeId, routeId))
            .orderBy(asc(routeStopsTable.stopOrder));

        const stopsById = new Map<number, (typeof routeStops)[number]>();

        for (const stop of routeStops) {
            stopsById.set(stop.id, stop);
        }

        return Array.from(stopsById.values());
    }

    async addStop(routeId: number, stopId: number, stopOrder: number, estimatedArrival: number, tx?: DbTransaction) {
        const dbInstance = this.getDb(tx);

        // Verificar se a parada já existe na rota
        const existing = await dbInstance
            .select()
            .from(routeStopsTable)
            .where(and(eq(routeStopsTable.routeId, routeId), eq(routeStopsTable.stopId, stopId)))
            .limit(1);

        if (existing.length > 0) {
            throw new Error("Parada já adicionada à rota");
        }

        const [routeStop] = await dbInstance
            .insert(routeStopsTable)
            .values({
                routeId,
                stopId,
                stopOrder,
                estimatedArrival,
            })
            .returning();

        return routeStop;
    }

    async removeStop(routeId: number, stopId: number, tx?: DbTransaction) {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .delete(routeStopsTable)
            .where(and(eq(routeStopsTable.routeId, routeId), eq(routeStopsTable.stopId, stopId)));
    }

    async updateStopOrder(routeId: number, stopId: number, newOrder: number, estimatedArrival: number, tx?: DbTransaction) {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(routeStopsTable)
            .set({
                stopOrder: newOrder,
                estimatedArrival,
                updatedAt: new Date(),
            })
            .where(and(eq(routeStopsTable.routeId, routeId), eq(routeStopsTable.stopId, stopId)));
    }
}
