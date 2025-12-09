import { Request, Response } from "express";
import { Service, Inject } from "typedi";
import { CollegeFilters, CollegeListPaginatedQuery } from "./college.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import CollegeService from "./college.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class CollegeController {
    constructor(
        @Inject(() => CollegeService)
        private readonly collegeService: CollegeService
    ) { }

    async list(req: Request, res: Response) {
        const colleges = await this.collegeService.list();
        return SendResponse.success(res, colleges);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, name, neighborhood,
            address, cep, city, contactEmail, contactPhone } = req.query as unknown as CollegeListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<CollegeFilters, CollegeListPaginatedQuery>(
            { name, address, neighborhood, cep, city, contactEmail, contactPhone }
        );

        const result = await this.collegeService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const college = await this.collegeService.findById(id);
        return SendResponse.success(res, college);
    }

    async create(req: Request, res: Response) {
        const data = await this.collegeService.create(req.body);
        return SendResponse.success(res, data);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const data = await this.collegeService.update(id, req.body);
        return SendResponse.success(res, data);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.collegeService.inactivate(id);
        return SendResponse.success(res, {});
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.collegeService.activate(id);
        return SendResponse.success(res, {});
    }
}