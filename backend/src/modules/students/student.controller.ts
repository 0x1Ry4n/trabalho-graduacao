import { Request, Response } from "express";
import { Service, Inject } from "typedi";
import { CardValidationFilters, CardValidationListPaginatedQuery, StudentFilters, StudentListPaginatedQuery } from "./student.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import StudentService from "./student.service";
import SendResponse from "../../shared/utils/response.utils";
import { logger } from "../../shared/utils/logger.utils";

@Service()
export default class StudentController {
    constructor(
        @Inject(() => StudentService)
        private readonly studentService: StudentService
    ) { }

    async list(req: Request, res: Response) {
        const students = await this.studentService.list();
        return SendResponse.success(res, students);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, userId, name, motherName, cpf, rg, cin, email, phone,
            birthDate, collegeId, course, semester, year, city,
            neighborhood, address, cep, notes, active } = req.query as unknown as StudentListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<StudentFilters, StudentListPaginatedQuery>(
            {
                userId, name, motherName, cpf, rg, cin, email, phone,
                birthDate, collegeId, course, semester, year,
                city, neighborhood, address, cep, notes, active
            },
            {
                birthDate: { transform: (v) => new Date(v) },
            }
        );

        const result = await this.studentService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const student = await this.studentService.findById(id);
        return SendResponse.success(res, student);
    }

    async findByUserId(req: Request, res: Response) {
        const userId = Number(req.params.userId);
        const student = await this.studentService.findByUserId(userId);
        if (!student) return SendResponse.notFound(res);
        return SendResponse.success(res, student);
    }

    async create(req: Request, res: Response) {
        logger.info(req.body);
        const student = await this.studentService.create(req.body);
        return SendResponse.success(res, student);
    }

    async createCardValidation(req: Request, res: Response) {
        const studentId = Number(req.params.id);
        const cardValidation = await this.studentService.createCardValidation({ ...req.body, studentId });
        return SendResponse.success(res, cardValidation);
    }

    async listCardValidationsByStudentId(req: Request, res: Response) {
        const studentId = Number(req.params.id);
        const cardValidations = await this.studentService.listCardValidationsByStudentId(studentId);
        return SendResponse.success(res, cardValidations);
    }

    async listCardValidationsByStudentIdPaginated(req: Request, res: Response) {
        const studentId = Number(req.params.id);
        let { page, pageSize, driverId, routeId, status, validationTime } = req.query as unknown as CardValidationListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<CardValidationFilters, CardValidationListPaginatedQuery>(
            { driverId, routeId, status, validationTime },
            {
                validationTime: { transform: (v) => new Date(v) },
                driverId: { transform: (v) => Number(v) },
                routeId: { transform: (v) => Number(v) },
            }
        );

        const result = await this.studentService.listCardValidationsByStudentIdWithFiltersPaginated(studentId, page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const student = await this.studentService.update(id, req.body);
        return SendResponse.success(res, student);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.studentService.inactivate(id);
        return SendResponse.success(res, {});
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.studentService.activate(id);
        return SendResponse.success(res, {});
    }
}