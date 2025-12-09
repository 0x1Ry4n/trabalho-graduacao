import { Inject, Service } from "typedi";
import { RouteFilters, RouteListPaginatedQuery } from "./route.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import RouteService from "./route.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class RouteController {
    constructor(
        @Inject(() => RouteService)
        private readonly routeService: RouteService
    ) { }

    async list(req: Request, res: Response) {
        const routes = await this.routeService.list();
        return SendResponse.success(res, routes);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, id, name, vehicleId, driverId, active } = req.query as unknown as RouteListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<RouteFilters, RouteListPaginatedQuery>({
            id, name, vehicleId, driverId, active
        });

        const result = await this.routeService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const route = await this.routeService.findById(id);
        return SendResponse.success(res, route);
    }

    async create(req: Request, res: Response) {
        const route = await this.routeService.create(req.body);
        return SendResponse.created(res, route);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const route = await this.routeService.update(id, req.body);
        return SendResponse.success(res, route);
    }

    async getStops(req: Request, res: Response) {
        const routeId = Number(req.params.id);
        const stops = await this.routeService.getStops(routeId);
        return SendResponse.success(res, stops);
    }

    async addStop(req: Request, res: Response) {
        const routeId = Number(req.params.id);
        const { stopId, stopOrder, estimatedArrival } = req.body;
        const routeStop = await this.routeService.addStop(routeId, stopId, stopOrder, estimatedArrival);
        return SendResponse.created(res, routeStop);
    }

    async removeStop(req: Request, res: Response) {
        const routeId = Number(req.params.routeId);
        const stopId = Number(req.params.stopId);
        await this.routeService.removeStop(routeId, stopId);
        return SendResponse.success(res, { message: "Parada removida da rota" });
    }

    async updateStopOrder(req: Request, res: Response) {
        const routeId = Number(req.params.routeId);
        const stopId = Number(req.params.stopId);
        const { stopOrder, estimatedArrival } = req.body;
        await this.routeService.updateStopOrder(routeId, stopId, stopOrder, estimatedArrival);
        return SendResponse.success(res, { message: "Ordem da parada atualizada" });
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.routeService.activate(id);
        return SendResponse.noContent(res);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.routeService.inactivate(id);
        return SendResponse.noContent(res);
    }

    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.routeService.delete(id);
        return SendResponse.noContent(res);
    }
}
