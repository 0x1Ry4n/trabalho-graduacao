import { Inject, Service } from "typedi";
import { RouteStopFilters, RouteStopListPaginatedQuery } from "./route-stop.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import RouteStopService from "./route-stop.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class RouteStopController {
    constructor(
        @Inject(() => RouteStopService)
        private readonly routeStopService: RouteStopService
    ) { }

    async listByRoute(req: Request, res: Response) {
        const routeId = Number(req.params.routeId);
        const stops = await this.routeStopService.listByRoute(routeId);
        return SendResponse.success(res, stops);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, routeId, stopId } = req.query as unknown as RouteStopListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<RouteStopFilters, RouteStopListPaginatedQuery>({
            routeId, stopId
        });

        const result = await this.routeStopService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const routeStop = await this.routeStopService.findById(id);
        return SendResponse.success(res, routeStop);
    }

    async create(req: Request, res: Response) {
        const routeStop = await this.routeStopService.create(req.body);
        return SendResponse.created(res, routeStop);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const routeStop = await this.routeStopService.update(id, req.body);
        return SendResponse.success(res, routeStop);
    }

    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.routeStopService.delete(id);
        return SendResponse.noContent(res);
    }
}
