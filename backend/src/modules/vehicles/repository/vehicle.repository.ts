import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { Vehicle } from "../interfaces/Vehicle";
import { IVehicleRepository } from "./IVehicleRepository";
import { vehiclesTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, ilike, isNull, SQL } from "drizzle-orm";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { VehicleFilters, VehicleInsert, VehicleUpdate } from "../vehicle.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class VehicleRepository extends BaseRepository<Vehicle> implements IVehicleRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Vehicle | null> {
        const dbInstance = this.getDb(tx);

        const [vehicle] = await dbInstance
            .select({
                id: vehiclesTable.id,
                model: vehiclesTable.model,
                plate: vehiclesTable.plate,
                type: vehiclesTable.type,
                capacity: vehiclesTable.capacity,
                active: vehiclesTable.active,
                notes: vehiclesTable.notes,
                createdAt: vehiclesTable.createdAt,
                updatedAt: vehiclesTable.updatedAt,
                deletedAt: vehiclesTable.deletedAt
            })
            .from(vehiclesTable)
            .where(eq(vehiclesTable.id, id))
            .limit(1);

        return vehicle ?? null;
    }

    async findByPlate(plate: string, tx?: DbTransaction): Promise<Vehicle | null> {
        const dbInstance = this.getDb(tx);

        const [vehicle] = await dbInstance
            .select({
                id: vehiclesTable.id,
                model: vehiclesTable.model,
                plate: vehiclesTable.plate,
                type: vehiclesTable.type,
                capacity: vehiclesTable.capacity,
                active: vehiclesTable.active,
                notes: vehiclesTable.notes,
                createdAt: vehiclesTable.createdAt,
                updatedAt: vehiclesTable.updatedAt,
                deletedAt: vehiclesTable.deletedAt
            })
            .from(vehiclesTable)
            .where(eq(vehiclesTable.plate, plate))
            .limit(1);

        return vehicle ?? null;
    }

    async create(data: VehicleInsert, tx?: DbTransaction): Promise<Vehicle> {
        const dbInstance = this.getDb(tx);

        const [vehicle] = await dbInstance
            .insert(vehiclesTable)
            .values(data)
            .returning();

        return vehicle;
    }

    async update(id: number, data: VehicleUpdate, tx?: DbTransaction): Promise<Vehicle | null> {
        const dbInstance = this.getDb(tx);

        const [vehicle] = await dbInstance
            .update(vehiclesTable)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(vehiclesTable.id, id))
            .returning();

        return vehicle ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(vehiclesTable)
            .set({
                active: 1
            })
            .where(eq(vehiclesTable.id, id))
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(vehiclesTable)
            .set({
                active: 0
            })
            .where(eq(vehiclesTable.id, id))
    }

    async delete(id: number, tx?: DbTransaction): Promise<Vehicle | null> {
        const dbInstance = this.getDb(tx);

        const [vehicle] = await dbInstance
            .delete(vehiclesTable)
            .where(eq(vehiclesTable.id, id))
            .returning();

        return vehicle ?? null;
    }

    async list(tx?: DbTransaction): Promise<Vehicle[]> {
        const dbInstance = this.getDb(tx);
        return await dbInstance.select().from(vehiclesTable).where(isNull(vehiclesTable.deletedAt));
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: VehicleFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<Vehicle> | null> {
        const dbInstance = this.getDb(tx);

        let vehiclesQuery = dbInstance
            .select({
                id: vehiclesTable.id,
                model: vehiclesTable.model,
                plate: vehiclesTable.plate,
                type: vehiclesTable.type,
                capacity: vehiclesTable.capacity,
                active: vehiclesTable.active,
                notes: vehiclesTable.notes,
                createdAt: vehiclesTable.createdAt,
                updatedAt: vehiclesTable.updatedAt,
                deletedAt: vehiclesTable.deletedAt
            })
            .from(vehiclesTable)
            .$dynamic();

        const conditions: SQL[] = [isNull(vehiclesTable.deletedAt)];

        if (filters?.search) {
            const {
                plate, model, capacity, notes,
                active, createdAt
            } = filters.search;

            if (plate) conditions.push(ilike(vehiclesTable.plate, plate));
            if (model) conditions.push(ilike(vehiclesTable.model, model));
            if (capacity) conditions.push(eq(vehiclesTable.capacity, capacity));
            if (notes) conditions.push(ilike(vehiclesTable.notes, notes));
            if (active !== undefined) conditions.push(eq(vehiclesTable.active, active));
            if (createdAt) conditions.push(eq(vehiclesTable.createdAt, createdAt));
        }

        vehiclesQuery = vehiclesQuery.where(and(...conditions));

        const vehiclesTotalCountQuery = await dbInstance
            .select({ count: count() })
            .from(vehiclesTable)
            .where(isNull(vehiclesTable.deletedAt));

        return paginateQuery<Vehicle>(
            vehiclesQuery,
            vehiclesTotalCountQuery,
            asc(vehiclesTable.id),
            { page, pageSize }
        )
    }
}
