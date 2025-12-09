import { Service } from "typedi";
import { and, count, desc, eq, SQL } from "drizzle-orm";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";
import { auditLogsTable } from "../../../config/db/db.schema";
import { AuditAction } from "../../../shared/enums/audit-action.enum";
import { AuditLog } from "../interfaces/AuditLog";
import { AuditLogFilters, AuditLogInsert } from "../audit.types";
import { IAuditLogRepository } from "./IAuditLogRepository";

@Service()
export default class AuditLogRepository
    extends BaseRepository<AuditLog>
    implements IAuditLogRepository {

    async findById(
        id: number,
        tx?: DbTransaction
    ): Promise<AuditLog | null> {
        const db = this.getDb(tx);

        const [auditLog] = await db
            .select()
            .from(auditLogsTable)
            .where(eq(auditLogsTable.id, id))
            .limit(1);

        return auditLog ?? null;
    }

    async listByEntity(
        entityType: string,
        entityId: number,
        tx?: DbTransaction
    ): Promise<AuditLog[]> {
        const db = this.getDb(tx);

        return db
            .select()
            .from(auditLogsTable)
            .where(
                and(
                    eq(auditLogsTable.entityType, entityType),
                    eq(auditLogsTable.entityId, entityId)
                )
            )
            .orderBy(desc(auditLogsTable.createdAt));
    }

    async create(
        data: AuditLogInsert,
        tx?: DbTransaction
    ): Promise<AuditLog> {
        const db = this.getDb(tx);

        const [auditLog] = await db
            .insert(auditLogsTable)
            .values(data)
            .returning();

        return auditLog;
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: AuditLogFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<AuditLog> | null> {
        const db = this.getDb(tx);

        const conditions = this.buildFilters(filters);

        const query = db
            .select()
            .from(auditLogsTable)
            .where(
                conditions.length
                    ? and(...conditions)
                    : undefined
            )
            .$dynamic();

        const totalCountQuery = db
            .select({ count: count() })
            .from(auditLogsTable)
            .where(
                conditions.length
                    ? and(...conditions)
                    : undefined
            );

        return paginateQuery<AuditLog>(
            query,
            totalCountQuery,
            desc(auditLogsTable.createdAt),
            { page, pageSize }
        );
    }

    private buildFilters(filters?: AuditLogFilters): SQL[] {
        const conditions: SQL[] = [];

        if (!filters?.search) {
            return conditions;
        }

        const {
            userId,
            action,
            entityType,
            entityId
        } = filters.search;

        if (userId !== undefined) {
            conditions.push(
                eq(auditLogsTable.userId, Number(userId))
            );
        }
        if (action) {
            conditions.push(
                eq(auditLogsTable.action, action as AuditAction)
            );
        }

        if (entityType) {
            conditions.push(
                eq(auditLogsTable.entityType, entityType)
            );
        }

        if (entityId !== undefined) {
            conditions.push(
                eq(auditLogsTable.entityId, entityId)
            );
        }

        return conditions;
    }
}