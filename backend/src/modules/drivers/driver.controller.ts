import { Request, Response } from "express";
import { Inject, Service } from "typedi";
import DriverService from "./driver.service";
import SendResponse from "../../shared/utils/response.utils";
import { DriverFilters, DriverListPaginatedQuery } from "./driver.types";
import { buildFilters } from "../../shared/utils/filters.utils";

@Service()
export default class DriverController {
    constructor(
        @Inject(() => DriverService)
        private readonly driverService: DriverService
    ) { }

    async list(req: Request, res: Response) {
        const drivers = await this.driverService.list();
        return SendResponse.success(res, drivers);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, userId, name, motherName, cpf, cnpj, rg, email,
            phone, birthDate, address, cep, city, neighborhood, contractType,
            licenseNumber, companyName, salary, admissionDate, rescissionDate,
            photoUrl, residenceProofUrl
        } = req.query as unknown as DriverListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<DriverFilters, DriverListPaginatedQuery>(
            {
                userId, name, motherName, cpf, cnpj, rg, email,
                phone, birthDate, address, cep, city, neighborhood, contractType,
                licenseNumber, companyName, salary, admissionDate, rescissionDate,
                photoUrl, residenceProofUrl
            }
        );

        const result = await this.driverService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const driver = await this.driverService.findById(id);
        return SendResponse.success(res, driver);
    }

    async findByUserId(req: Request, res: Response) {
        const userId = Number(req.params.userId);
        const driver = await this.driverService.findByUserId(userId);
        if (!driver) return SendResponse.notFound(res);
        return SendResponse.success(res, driver);
    }

    async create(req: Request, res: Response) {
        const driver = await this.driverService.create(req.body);
        return SendResponse.success(res, driver);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const driver = await this.driverService.update(id, req.body);
        return SendResponse.success(res, driver);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.driverService.inactivate(id);
        return SendResponse.success(res, {});
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.driverService.activate(id);
        return SendResponse.success(res, {});
    }
}
