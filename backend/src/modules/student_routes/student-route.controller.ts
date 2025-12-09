import { Inject, Service } from "typedi";
import { StudentRouteFilters, StudentRouteListPaginatedQuery } from "./student-route.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { Request, Response } from "express";
import StudentRouteService from "./student-route.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class StudentRouteController {
    constructor(
        @Inject(() => StudentRouteService)
        private readonly studentRouteService: StudentRouteService
    ) { }

    async listByStudent(req: Request, res: Response) {
        const studentId = Number(req.params.studentId);
        const routes = await this.studentRouteService.listByStudent(studentId);
        return SendResponse.success(res, routes);
    }

    async listByRoute(req: Request, res: Response) {
        const routeId = Number(req.params.routeId);
        const students = await this.studentRouteService.listByRoute(routeId);
        return SendResponse.success(res, students);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, studentId, routeId, routeStopId, routePeriod, active } = req.query as unknown as StudentRouteListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<StudentRouteFilters, StudentRouteListPaginatedQuery>({
            studentId, routeId, routeStopId, routePeriod, active
        });

        const result = await this.studentRouteService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const studentRoute = await this.studentRouteService.findById(id);
        return SendResponse.success(res, studentRoute);
    }

    async create(req: Request, res: Response) {
        const studentRoute = await this.studentRouteService.create(req.body, req.user);
        return SendResponse.created(res, studentRoute);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const studentRoute = await this.studentRouteService.update(id, req.body, req.user);
        return SendResponse.success(res, studentRoute);
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.studentRouteService.activate(id);
        return SendResponse.noContent(res);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.studentRouteService.inactivate(id);
        return SendResponse.noContent(res);
    }

    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.studentRouteService.delete(id);
        return SendResponse.noContent(res);
    }
}
