import { InferInsertModel } from "drizzle-orm";
import { auditLogsTable } from "../../config/db/db.schema";
import { z } from "zod";
import { auditLogListPaginatedSchema } from "./audit.schema";
import { AuditLog } from "./interfaces/AuditLog";
import { AuditAction } from "../../shared/enums/audit-action.enum";

export type AuditLogInsert = InferInsertModel<typeof auditLogsTable>;
export type AuditLogListPaginatedQuery = z.infer<typeof auditLogListPaginatedSchema>;
export type AuditLogFilters = {
    search?: Partial<AuditLog>
}

export type CreateAuditLogParams = {
    userId?: number;
    action: AuditAction;
    entityType: string;
    entityId: number;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
}
