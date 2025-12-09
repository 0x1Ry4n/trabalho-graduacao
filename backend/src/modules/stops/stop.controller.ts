import { Inject, Service } from "typedi";
import { StopFilters, StopListPaginatedQuery } from "./stop.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import StopService from "./stop.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class StopController {
    constructor(
        @Inject(() => StopService)
        private readonly stopService: StopService
    ) { }

    async list(req: Request, res: Response) {
        const stops = await this.stopService.list();
        return SendResponse.success(res, stops);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, id, name, city, neighborhood } = req.query as unknown as StopListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<StopFilters, StopListPaginatedQuery>({
            id, name, city, neighborhood
        });

        const result = await this.stopService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const stop = await this.stopService.findById(id);
        return SendResponse.success(res, stop);
    }

    async create(req: Request, res: Response) {
        const stop = await this.stopService.create(req.body);
        return SendResponse.created(res, stop);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const stop = await this.stopService.update(id, req.body);
        return SendResponse.success(res, stop);
    }

    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.stopService.delete(id);
        return SendResponse.noContent(res);
    }
}
