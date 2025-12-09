import { Inject, Service } from "typedi";
import { VehicleFilters, VehicleListPaginatedQuery } from "./vehicle.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import VehicleService from "./vehicle.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class VehicleController {
    constructor(
        @Inject(() => VehicleService)
        private readonly vehicleService: VehicleService
    ) { }

    async list(req: Request, res: Response) {
        const vehicles = await this.vehicleService.list();
        return SendResponse.success(res, vehicles);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, id, model, plate,
            capacity, active, notes, type
        } = req.query as unknown as VehicleListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<VehicleFilters, VehicleListPaginatedQuery>({
            id, model, plate, capacity, active, notes, type
        });

        const result = await this.vehicleService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const vehicle = await this.vehicleService.findById(id);
        return SendResponse.success(res, vehicle);
    }

    async create(req: Request, res: Response) {
        const vehicle = await this.vehicleService.create(req.body);
        return SendResponse.success(res, vehicle);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const vehicle = await this.vehicleService.update(id, req.body);
        return SendResponse.success(res, vehicle);
    }

    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.vehicleService.delete(id);
        return SendResponse.noContent(res);
    }
}
