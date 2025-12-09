import { and, asc, count, eq, ilike, SQL } from "drizzle-orm";
import { Service } from "typedi";
import { driversTable } from "../../../config/db/db.schema";
import { Driver } from "../interfaces/Driver";
import { DriverFilters, DriverInsert, DriverUpdate } from "../driver.types";
import { IDriverRepository } from "./IDriverRepository";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class DriverRepository extends BaseRepository<Driver> implements IDriverRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.id, id))
            .limit(1);

        return driver ?? null;
    }

    async findByUserId(userId: number, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.userId, userId));

        return driver ?? null;
    }

    async findByEmail(email: string, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.email, email));

        return driver ?? null;
    }


    async findByPhone(phone: string, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.phone, phone));

        return driver ?? null;
    }

    async findByCPF(cpf: string, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.cpf, cpf));

        return driver ?? null;
    }

    async findByCNPJ(cnpj: string, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.cnpj, cnpj));

        return driver ?? null;
    }

    async findByRG(rg: string, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(driversTable)
            .where(eq(driversTable.rg, rg));

        return driver ?? null;
    }

    async create(data: DriverInsert, tx?: DbTransaction): Promise<Driver> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .insert(driversTable)
            .values(data)
            .returning();

        return driver;
    }

    async update(id: number, data: DriverUpdate, tx?: DbTransaction): Promise<Driver | null> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .update(driversTable)
            .set(data)
            .where(eq(driversTable.id, id))
            .returning();

        return driver ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(driversTable)
            .set({
                active: 1
            })
            .where(eq(driversTable.id, id))
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(driversTable)
            .set({
                active: 0
            })
            .where(eq(driversTable.id, id))
    }

    async list(tx?: DbTransaction): Promise<Driver[]> {
        const dbInstance = this.getDb(tx);

        return await dbInstance.select().from(driversTable);
    }

    async listWithFiltersPaginated(
        page: number = 1,
        pageSize: number = 10,
        filters?: DriverFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<Driver> | null> {

        const dbInstance = this.getDb(tx);

        let driversQuery = dbInstance
            .select()
            .from(driversTable)
            .$dynamic();

        if (filters?.search) {
            const { name, motherName, cpf, cnpj, rg,
                licenseNumber, email, phone, birthDate, city,
                neighborhood, address, cep, companyName, contractType,
                salary, admissionDate, rescissionDate, active
            } = filters.search;

            const conditions: SQL[] = [];

            if (name) conditions.push(ilike(driversTable.name, `%${name}%`));
            if (motherName) conditions.push(ilike(driversTable.motherName, `%${motherName}%`));
            if (cpf) conditions.push(ilike(driversTable.cpf, `%${cpf}%`));
            if (cnpj) conditions.push(ilike(driversTable.cnpj, `%${cnpj}%`));
            if (rg) conditions.push(ilike(driversTable.rg, `%${rg}%`));
            if (licenseNumber) conditions.push(ilike(driversTable.licenseNumber, `%${licenseNumber}%`));
            if (email) conditions.push(ilike(driversTable.email, `%${email}%`));
            if (phone) conditions.push(ilike(driversTable.phone, `%${phone}%`));
            if (birthDate) conditions.push(eq(driversTable.birthDate, birthDate));
            if (city) conditions.push(ilike(driversTable.city, `%${city}%`));
            if (neighborhood) conditions.push(ilike(driversTable.neighborhood, `%${neighborhood}%`));
            if (address) conditions.push(ilike(driversTable.address, `%${address}%`));
            if (cep) conditions.push(ilike(driversTable.cep, `%${cep}%`));
            if (companyName) conditions.push(ilike(driversTable.companyName, `%${companyName}%`));
            if (contractType) conditions.push(eq(driversTable.contractType, contractType));
            if (salary) conditions.push(eq(driversTable.salary, salary));
            if (admissionDate) conditions.push(eq(driversTable.admissionDate, admissionDate));
            if (rescissionDate) conditions.push(eq(driversTable.rescissionDate, rescissionDate));
            if (active !== undefined) conditions.push(eq(driversTable.active, active));
            if (conditions.length) {
                driversQuery = driversQuery.where(and(...conditions));
            }
        }

        const driversTotalCountQuery = dbInstance
            .select({ count: count() })
            .from(driversTable);

        return paginateQuery<Driver>(
            driversQuery,
            driversTotalCountQuery,
            asc(driversTable.id),
            { page, pageSize }
        );
    }
}
