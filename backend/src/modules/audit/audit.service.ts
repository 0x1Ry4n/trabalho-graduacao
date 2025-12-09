import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { AuditLog } from "./interfaces/AuditLog";
import { AuditLogFilters, AuditLogInsert, CreateAuditLogParams } from "./audit.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import AuditLogRepository from "./repository/audit-log.repository";
import { logger } from "../../shared/utils/logger.utils";

@Service()
export default class AuditService {
    constructor(
        @Inject(() => AuditLogRepository)
        private readonly auditLogRepository: AuditLogRepository
    ) { }

    async log(params: CreateAuditLogParams): Promise<void> {
        try {
            const data: AuditLogInsert = {
                userId: params.userId ?? null,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                oldValues: params.oldValues ?? null,
                newValues: params.newValues ?? null,
                ipAddress: params.ipAddress ?? null,
                userAgent: params.userAgent ?? null,
            };

            await this.auditLogRepository.create(data);
        } catch (error) {
            logger.error(`Falha ao registrar log de auditoria: ${error}`);
        }
    }

    async findById(id: number) {
        const auditLog = await this.auditLogRepository.findById(id);
        if (!auditLog) throw new ApiError("Log de auditoria não encontrado!", StatusCodes.BAD_REQUEST);
        return auditLog;
    }

    async listByEntity(entityType: string, entityId: number) {
        return await this.auditLogRepository.listByEntity(entityType, entityId);
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: AuditLogFilters) {
        if (page < 1) throw new ApiError("O número da página deve ser maior que 0!", StatusCodes.BAD_REQUEST);
        if (pageSize < 1 || pageSize > 100) throw new ApiError("O limite de registros por página deve estar entre 1 e 100!", StatusCodes.BAD_REQUEST);

        return await this.auditLogRepository.listWithFiltersPaginated(page, pageSize, filters);
    }
}
