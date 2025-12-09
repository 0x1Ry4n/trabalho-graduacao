import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { AccountReceivable } from "../interfaces/AccountReceivable";
import { IAccountReceivableRepository } from "./IAccountReceivableRepository";
import { accountsReceivableTable, enrollmentsTable, pricesTable } from "../../../config/db/db.schema";
import { and, asc, count, desc, eq, SQL, sql } from "drizzle-orm";
import { AccountStatus } from "../../../shared/enums/account-status.enum";
import { AccountReceivableFilters, AccountReceivableInsert, AccountReceivableUpdate, PriceTableInsert, PriceTableUpdate } from "../account_receivable.types";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";
import { AccountReceivableType } from "../../../shared/enums/account-receivable-type.enum";
import { PriceTable } from "../interfaces/PriceTable";

@Service()
export default class AccountReceivableRepository extends BaseRepository<AccountReceivable> implements IAccountReceivableRepository {
    async findById(id: number, tx?: DbTransaction): Promise<AccountReceivable | null> {
        const dbInstance = this.getDb(tx);

        const [accountReceivable] = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)
            .where(eq(accountsReceivableTable.id, id))
            .limit(1);

        if (!accountReceivable) return null;

        return {
            ...accountReceivable,
            dueDate: new Date(accountReceivable.dueDate),
            paymentDate: accountReceivable.paymentDate ? new Date(accountReceivable.paymentDate) : null,
            paymentProofType: accountReceivable.paymentProofType ?? undefined,
            paymentProofUrl: accountReceivable.paymentProofUrl ?? undefined,
            description: accountReceivable.description ?? null,
            enrollmentId: accountReceivable.enrollmentId ?? null,
        };
    }

    async findByStudentId(studentId: number, tx?: DbTransaction): Promise<AccountReceivable[] | null> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)
            .innerJoin(enrollmentsTable, eq(enrollmentsTable.id, accountsReceivableTable.enrollmentId))
            .where(eq(enrollmentsTable.studentId, studentId));


        if (!rows.length) return null;

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async findByEnrollmentId(enrollmentId: number, tx?: DbTransaction): Promise<AccountReceivable[] | null> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)
            .where(eq(accountsReceivableTable.enrollmentId, enrollmentId));

        if (!rows.length) return null;

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async findByCardCode(cardCode: string, tx?: DbTransaction): Promise<AccountReceivable[] | null> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)
            .innerJoin(enrollmentsTable, eq(enrollmentsTable.id, accountsReceivableTable.enrollmentId))
            .where(eq(enrollmentsTable.cardCode, cardCode));

        if (!rows.length) return null;

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async findByStatus(status: AccountStatus, tx?: DbTransaction): Promise<AccountReceivable[] | null> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)
            .where(eq(accountsReceivableTable.status, status));

        if (!rows.length) return null;

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async create(data: AccountReceivableInsert, tx?: DbTransaction): Promise<Partial<AccountReceivable>> {
        const dbInstance = this.getDb(tx);

        const [accountReceivable] = await dbInstance
            .insert(accountsReceivableTable)
            .values(data)
            .returning();

        return {
            ...accountReceivable,
            amount: Number(accountReceivable.amount),
            dueDate: new Date(accountReceivable.dueDate),
            paymentDate: accountReceivable.paymentDate ? new Date(accountReceivable.paymentDate) : null,
            paymentProofType: accountReceivable.paymentProofType ?? undefined,
            paymentProofUrl: accountReceivable.paymentProofUrl ?? undefined,
            description: accountReceivable.description ?? null,
            enrollmentId: accountReceivable.enrollmentId ?? null,
        };
    }

    async createMany(data: AccountReceivableInsert[], tx?: DbTransaction): Promise<Partial<AccountReceivable[]> | null> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .insert(accountsReceivableTable)
            .values(data)
            .returning();

        return rows.map((row) => ({
            ...row,
            amount: Number(row.amount),
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async update(id: number, data: AccountReceivableUpdate, tx?: DbTransaction): Promise<Partial<AccountReceivable> | null> {
        const dbInstance = this.getDb(tx);

        const [accountReceivable] = await dbInstance
            .update(accountsReceivableTable)
            .set(data)
            .where(eq(accountsReceivableTable.id, id))
            .returning();

        return {
            ...accountReceivable,
            amount: Number(accountReceivable.amount),
            dueDate: new Date(accountReceivable.dueDate),
            paymentDate: accountReceivable.paymentDate ? new Date(accountReceivable.paymentDate) : null,
            paymentProofType: accountReceivable.paymentProofType ?? undefined,
            paymentProofUrl: accountReceivable.paymentProofUrl ?? undefined,
            description: accountReceivable.description ?? null,
            enrollmentId: accountReceivable.enrollmentId ?? null,
        };
    }

    async list(tx?: DbTransaction): Promise<AccountReceivable[]> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                accountReceivableType: accountsReceivableTable.accountReceivableType,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
                createdAt: accountsReceivableTable.createdAt,
                updatedAt: accountsReceivableTable.updatedAt
            })
            .from(accountsReceivableTable)

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
            paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
            paymentProofType: row.paymentProofType ?? undefined,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            description: row.description ?? null,
            enrollmentId: row.enrollmentId ?? null,
        }));
    }

    async listWithFiltersPaginated(page: number, pageSize: number, filters?: AccountReceivableFilters, tx?: DbTransaction): Promise<PaginatedDocument<AccountReceivable> | null> {
        const dbInstance = this.getDb(tx);

        let query = dbInstance
            .select({
                id: accountsReceivableTable.id,
                enrollmentId: accountsReceivableTable.enrollmentId,
                payerId: accountsReceivableTable.payerId,
                amount: sql<number>`cast(${accountsReceivableTable.amount} as numeric)`,
                dueDate: accountsReceivableTable.dueDate,
                paymentType: accountsReceivableTable.paymentType,
                status: accountsReceivableTable.status,
                paymentDate: accountsReceivableTable.paymentDate,
                paymentProofType: accountsReceivableTable.paymentProofType,
                paymentProofUrl: accountsReceivableTable.paymentProofUrl,
                description: accountsReceivableTable.description,
            })
            .from(accountsReceivableTable)
            .$dynamic();

        if (filters?.search) {
            const {
                enrollmentId,
                payerId,
                status,
                paymentType,
                dueDateFrom,
                dueDateTo,
                paymentDateFrom,
                paymentDateTo,
            } = filters.search;

            const conditions: SQL[] = [];

            if (enrollmentId) conditions.push(eq(accountsReceivableTable.enrollmentId, enrollmentId));
            if (payerId) conditions.push(eq(accountsReceivableTable.payerId, payerId));
            if (status) conditions.push(eq(accountsReceivableTable.status, status));
            if (paymentType) conditions.push(eq(accountsReceivableTable.paymentType, paymentType));
            if (dueDateFrom) conditions.push(sql`${accountsReceivableTable.dueDate} >= ${dueDateFrom}`);
            if (dueDateTo) conditions.push(sql`${accountsReceivableTable.dueDate} <= ${dueDateTo}`);
            if (paymentDateFrom) conditions.push(sql`${accountsReceivableTable.paymentDate} >= ${paymentDateFrom}`);
            if (paymentDateTo) conditions.push(sql`${accountsReceivableTable.paymentDate} <= ${paymentDateTo}`);
            if (conditions.length) query = query.where(and(...conditions));
        }

        const totalCountQuery = dbInstance
            .select({ count: count() })
            .from(accountsReceivableTable);

        const paginated = await paginateQuery<AccountReceivable>(
            query,
            totalCountQuery,
            asc(accountsReceivableTable.id),
            { page, pageSize }
        );

        if (!paginated) return null;

        return {
            ...paginated,
            data: paginated.data.map((row) => ({
                ...row,
                dueDate: new Date(row.dueDate),
                paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
                paymentProofType: row.paymentProofType ?? undefined,
                paymentProofUrl: row.paymentProofUrl ?? undefined,
                description: row.description ?? null,
                enrollmentId: row.enrollmentId ?? null,
            })),
        };
    }

    async createPriceTable(data: PriceTableInsert, tx?: DbTransaction): Promise<PriceTable> {
        const dbInstance = this.getDb(tx);

        const [priceTable] = await dbInstance
            .insert(pricesTable)
            .values(data)
            .returning();

        return {
            ...priceTable,
            price: Number(priceTable.price),
            dueDate: new Date(priceTable.dueDate),
        };
    }

    async updatePriceTable(id: number, data: PriceTableUpdate, tx?: DbTransaction): Promise<PriceTable> {
        const dbInstance = this.getDb(tx);

        const [priceTable] = await dbInstance
            .update(pricesTable)
            .set(data)
            .where(eq(pricesTable.id, id))
            .returning();

        return {
            ...priceTable,
            price: Number(priceTable.price),
            dueDate: new Date(priceTable.dueDate),
        };
    }

    async findPriceTableById(id: number, tx?: DbTransaction): Promise<PriceTable | null> {
        const dbInstance = this.getDb(tx);

        const [priceTable] = await dbInstance
            .select({
                id: pricesTable.id,
                price: sql<number>`cast(${pricesTable.price} as numeric)`,
                type: pricesTable.type,
                paymentType: pricesTable.paymentType,
                dueDate: pricesTable.dueDate,
                active: pricesTable.active,
                createdAt: pricesTable.createdAt
            })
            .from(pricesTable)
            .where(eq(pricesTable.id, id))
            .orderBy(desc(pricesTable.createdAt))
            .limit(1);

        if (!priceTable) return null;

        return {
            ...priceTable,
            dueDate: new Date(priceTable.dueDate),
        };
    }

    async findPriceTableByType(type: AccountReceivableType, tx?: DbTransaction): Promise<PriceTable | null> {
        const dbInstance = this.getDb(tx);

        const [priceTable] = await dbInstance
            .select({
                id: pricesTable.id,
                price: sql<number>`cast(${pricesTable.price} as numeric)`,
                type: pricesTable.type,
                paymentType: pricesTable.paymentType,
                dueDate: pricesTable.dueDate,
                active: pricesTable.active,
                createdAt: pricesTable.createdAt
            })
            .from(pricesTable)
            .where(eq(pricesTable.type, type))
            .orderBy(desc(pricesTable.createdAt))
            .limit(1);

        if (!priceTable) return null;

        return {
            ...priceTable,
            dueDate: new Date(priceTable.dueDate),
        };
    }

    async listPriceTables(tx?: DbTransaction): Promise<PriceTable[]> {
        const dbInstance = this.getDb(tx);

        const rows = await dbInstance
            .select({
                id: pricesTable.id,
                price: sql<number>`cast(${pricesTable.price} as numeric)`,
                type: pricesTable.type,
                paymentType: pricesTable.paymentType,
                dueDate: pricesTable.dueDate,
                active: pricesTable.active,
                createdAt: pricesTable.createdAt
            })
            .from(pricesTable)
            .orderBy(desc(pricesTable.createdAt));

        return rows.map((row) => ({
            ...row,
            dueDate: new Date(row.dueDate),
        }));
    }
}

