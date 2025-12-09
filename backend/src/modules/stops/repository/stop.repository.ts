import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { Stop } from "../interfaces/Stop";
import { IStopRepository } from "./IStopRepository";
import { stopsTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, ilike, SQL } from "drizzle-orm";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { StopFilters, StopInsert, StopUpdate } from "../stop.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class StopRepository extends BaseRepository<Stop> implements IStopRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Stop | null> {
        const dbInstance = this.getDb(tx);

        const [stop] = await dbInstance
            .select()
            .from(stopsTable)
            .where(eq(stopsTable.id, id))
            .limit(1);

        return stop ?? null;
    }

    async findByName(name: string, tx?: DbTransaction): Promise<Stop | null> {
        const dbInstance = this.getDb(tx);

        const [stop] = await dbInstance
            .select()
            .from(stopsTable)
            .where(eq(stopsTable.name, name))
            .limit(1);

        return stop ?? null;
    }

    async create(data: StopInsert, tx?: DbTransaction): Promise<Stop> {
        const dbInstance = this.getDb(tx);

        const [stop] = await dbInstance
            .insert(stopsTable)
            .values(data)
            .returning();

        return stop;
    }

    async update(id: number, data: StopUpdate, tx?: DbTransaction): Promise<Stop | null> {
        const dbInstance = this.getDb(tx);

        const [stop] = await dbInstance
            .update(stopsTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(stopsTable.id, id))
            .returning();

        return stop ?? null;
    }

    async delete(id: number, tx?: DbTransaction): Promise<Stop | null> {
        const dbInstance = this.getDb(tx);

        const [stop] = await dbInstance
            .delete(stopsTable)
            .where(eq(stopsTable.id, id))
            .returning();

        return stop ?? null;
    }

    async list(tx?: DbTransaction): Promise<Stop[]> {
        const dbInstance = this.getDb(tx);
        return await dbInstance.select().from(stopsTable);
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: StopFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<Stop> | null> {
        const dbInstance = this.getDb(tx);

        let stopsQuery = dbInstance
            .select()
            .from(stopsTable)
            .$dynamic();

        if (filters?.search) {
            const { name, city, neighborhood } = filters.search;
            const conditions: SQL[] = [];

            if (name) conditions.push(ilike(stopsTable.name, `%${name}%`));
            if (city) conditions.push(ilike(stopsTable.city, `%${city}%`));
            if (neighborhood) conditions.push(ilike(stopsTable.neighborhood, `%${neighborhood}%`));

            if (conditions.length) {
                stopsQuery = stopsQuery.where(and(...conditions));
            }
        }

        const stopsTotalCountQuery = await dbInstance
            .select({ count: count() })
            .from(stopsTable);

        return paginateQuery<Stop>(
            stopsQuery,
            stopsTotalCountQuery,
            asc(stopsTable.id),
            { page, pageSize }
        );
    }
}
