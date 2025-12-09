import { AuditAction } from "../../../shared/enums/audit-action.enum";

export interface AuditLog {
    id: number;
    userId: number | null;
    action: AuditAction;
    entityType: string;
    entityId: number;
    oldValues: unknown | null;
    newValues: unknown | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}
