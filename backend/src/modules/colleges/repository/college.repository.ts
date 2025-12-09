import { and, asc, count, eq, ilike, SQL } from "drizzle-orm";
import { Service } from "typedi";
import { collegesTable } from "../../../config/db/db.schema";
import { College } from "../interfaces/College";
import { CollegeFilters, CollegeInsert, CollegeUpdate } from "../college.types";
import { ICollegeRepository } from "./ICollegeRepository";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class CollegeRepository extends BaseRepository<College> implements ICollegeRepository {
    async findById(id: number, tx?: DbTransaction): Promise<College | null> {
        const dbInstance = this.getDb(tx);

        const [college] = await dbInstance
            .select()
            .from(collegesTable)
            .where(eq(collegesTable.id, id))
            .limit(1);

        return college ?? null;
    }

    async findByName(collegeName: string, tx?: DbTransaction): Promise<College | null> {
        const dbInstance = this.getDb(tx);

        const [college] = await dbInstance
            .select()
            .from(collegesTable)
            .where(ilike(collegesTable.name, `%${collegeName}%`))
            .limit(1);

        return college ?? null;
    }

    async list(tx?: DbTransaction): Promise<College[]> {
        const dbInstance = this.getDb(tx);

        return dbInstance.select().from(collegesTable);
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: CollegeFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<College> | null> {
        const dbInstance = this.getDb(tx);

        let collegesQuery = dbInstance
            .select({
                id: collegesTable.id,
                name: collegesTable.name,
                city: collegesTable.city,
                neighborhood: collegesTable.neighborhood,
                address: collegesTable.address,
                cep: collegesTable.cep,
                contactEmail: collegesTable.contactEmail,
                contactPhone: collegesTable.contactPhone,
                active: collegesTable.active,
                createdAt: collegesTable.createdAt,
                updatedAt: collegesTable.updatedAt
            })
            .from(collegesTable)
            .$dynamic()

        if (filters?.search) {
            const { name, city, neighborhood, address, cep,
                contactEmail, contactPhone, active
            } = filters.search;

            const conditions: SQL[] = [];

            if (name) conditions.push(ilike(collegesTable.name, `%${name}%`));
            if (city) conditions.push(ilike(collegesTable.city, `%${city}%`));
            if (neighborhood) conditions.push(ilike(collegesTable.neighborhood, `%${neighborhood}%`));
            if (address) conditions.push(ilike(collegesTable.address, `%${address}%`));
            if (cep) conditions.push(ilike(collegesTable.cep, `%${cep}%`));
            if (contactEmail) conditions.push(ilike(collegesTable.contactEmail, `%${contactEmail}%`))
            if (contactPhone) conditions.push(ilike(collegesTable.contactPhone, `%${contactPhone}%`))
            if (active !== undefined) conditions.push(eq(collegesTable.active, active));

            if (conditions.length) {
                collegesQuery = collegesQuery.where(and(...conditions));
            }
        }

        const collegesTotalCountQuery = dbInstance
            .select({ count: count() })
            .from(collegesTable);

        return paginateQuery<College>(
            collegesQuery,
            collegesTotalCountQuery,
            asc(collegesTable.id),
            { page, pageSize }
        )
    }

    async create(data: CollegeInsert, tx?: DbTransaction): Promise<College> {
        const dbInstance = this.getDb(tx);

        const [college] = await dbInstance
            .insert(collegesTable)
            .values(data)
            .returning();

        return college;
    }

    async update(
        id: number,
        data: CollegeUpdate,
        tx?: DbTransaction
    ): Promise<College | null> {
        const dbInstance = this.getDb(tx);

        const [college] = await dbInstance
            .update(collegesTable)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(collegesTable.id, id))
            .returning();

        return college ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(collegesTable)
            .set({
                active: 1
            })
            .where(eq(collegesTable.id, id));
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(collegesTable)
            .set({
                active: 0
            })
            .where(eq(collegesTable.id, id));
    }
}
