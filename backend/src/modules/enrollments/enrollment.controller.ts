import { Inject, Service } from "typedi";
import { Request, Response } from "express";
import { EnrollmentFilters, EnrollmentListPaginatedQuery } from "./enrollment.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import EnrollmentService from "./enrollment.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class EnrollmentController {
    constructor(
        @Inject(() => EnrollmentService)
        private readonly enrollmentService: EnrollmentService
    ) { }

    async list(req: Request, res: Response) {
        const enrollments = await this.enrollmentService.list();
        return SendResponse.success(res, enrollments);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, id, studentId, cardCode,
            course, collegeId, semester, year, status
        } = req.query as unknown as EnrollmentListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<EnrollmentFilters, EnrollmentListPaginatedQuery>({
            id, studentId, cardCode, course, collegeId,
            semester, year, status
        });

        const result = await this.enrollmentService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const enrollment = await this.enrollmentService.findById(id);
        return SendResponse.success(res, enrollment);
    }

    async findByStudentId(req: Request, res: Response) {
        const studentId = Number(req.params.studentId);
        const enrollments = await this.enrollmentService.findByStudentId(studentId);
        return SendResponse.success(res, enrollments);
    }

    async create(req: Request, res: Response) {
        const enrollment = await this.enrollmentService.create(req.body);
        return SendResponse.success(res, enrollment);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const enrollment = await this.enrollmentService.update(id, req.body);
        return SendResponse.success(res, enrollment);
    }
}