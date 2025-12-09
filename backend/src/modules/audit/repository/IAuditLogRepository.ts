import { AuditLog } from "../interfaces/AuditLog";
import { AuditLogInsert, AuditLogFilters } from "../audit.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface IAuditLogRepository {
    findById(id: number, tx?: DbTransaction): Promise<AuditLog | null>;
    listByEntity(entityType: string, entityId: number, tx?: DbTransaction): Promise<AuditLog[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: AuditLogFilters, tx?: DbTransaction): Promise<PaginatedDocument<AuditLog> | null>;
    create(data: AuditLogInsert, tx?: DbTransaction): Promise<AuditLog>;
}
