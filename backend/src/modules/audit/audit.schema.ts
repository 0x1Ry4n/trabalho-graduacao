import { z } from "zod";
import { AuditAction } from "../../shared/enums/audit-action.enum";

export const auditLogListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number)
        .pipe(z.number().int().positive({ message: 'O número da página deve ser um inteiro maior que 0' })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, { message: 'O tamanho da página deve estar entre 1 e 100' })),
    userId: z.number().int().positive().optional(),
    action: z.enum(AuditAction as unknown as [string, ...string[]]).optional(),
    entityType: z.string().optional(),
    entityId: z.number().int().positive().optional(),
});
