import { Inject, Service } from "typedi";
import { AuditLogFilters, AuditLogListPaginatedQuery } from "./audit.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import AuditService from "./audit.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class AuditController {
    constructor(
        @Inject(() => AuditService)
        private readonly auditService: AuditService
    ) { }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, userId, action, entityType, entityId } = req.query as unknown as AuditLogListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<AuditLogFilters, AuditLogListPaginatedQuery>({
            userId, action, entityType, entityId
        });

        const result = await this.auditService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const auditLog = await this.auditService.findById(id);
        return SendResponse.success(res, auditLog);
    }

    async listByEntity(req: Request, res: Response) {
        const { entityType } = req.params;
        const entityId = Number(req.params.entityId);
        const logs = await this.auditService.listByEntity(entityType, entityId);
        return SendResponse.success(res, logs);
    }
}
