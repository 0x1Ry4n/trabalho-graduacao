import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { CreateStudentRouteDTO, UpdateStudentRouteDTO } from "./dto/index.dto";
import { StudentRoute } from "./interfaces/StudentRoute";
import { StudentRouteFilters, StudentRouteInsert } from "./student-route.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import StudentRouteRepository from "./repository/student-route.repository";
import CacheService from "../../shared/services/cache.service";
import { RoutePeriod } from "../../shared/enums/route-period.enum";
import { UserRole } from "../../shared/enums/user-role.enum";
import StudentRepository from "../students/repository/student.repository";
import RouteRepository from "../routes/repository/route.repository";
import RouteStopRepository from "../route_stops/repository/route-stop.repository";

@Service()
export default class StudentRouteService {
    private readonly LIST_CACHE_TTL = 300;
    private readonly CACHE_PREFIX = "student_route";

    constructor(
        @Inject(() => StudentRouteRepository)
        private readonly studentRouteRepository: StudentRouteRepository,
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => RouteRepository)
        private readonly routeRepository: RouteRepository,
        @Inject(() => RouteStopRepository)
        private readonly routeStopRepository: RouteStopRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const studentRoute = await this.studentRouteRepository.findById(id);
        if (!studentRoute) throw new ApiError("Rota do estudante nao encontrada!", StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, studentRoute, this.LIST_CACHE_TTL);
        return studentRoute;
    }

    async listByStudent(studentId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "student", studentId);

        const cached = await this.cacheService.get<StudentRoute[]>(cacheKey);
        if (cached) return cached;

        const studentRoutes = await this.studentRouteRepository.listByStudent(studentId);
        await this.cacheService.set(cacheKey, studentRoutes, this.LIST_CACHE_TTL);
        return studentRoutes;
    }

    async listByRoute(routeId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "route", routeId);

        const cached = await this.cacheService.get<StudentRoute[]>(cacheKey);
        if (cached) return cached;

        const studentRoutes = await this.studentRouteRepository.listByRoute(routeId);
        await this.cacheService.set(cacheKey, studentRoutes, this.LIST_CACHE_TTL);
        return studentRoutes;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: StudentRouteFilters) {
        if (page < 1) throw new ApiError("O numero da pagina deve ser maior que 0!", StatusCodes.BAD_REQUEST);
        if (pageSize < 1 || pageSize > 100) throw new ApiError("O limite de registros por pagina deve estar entre 1 e 100!", StatusCodes.BAD_REQUEST);

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "paginated", page, pageSize, filterKey);

        const cached = await this.cacheService.get<PaginatedDocument<StudentRoute> | null>(cacheKey);
        if (cached) return cached;

        const result = await this.studentRouteRepository.listWithFiltersPaginated(page, pageSize, filters);
        await this.cacheService.set(cacheKey, result, this.LIST_CACHE_TTL);
        return result;
    }

    async create(dto: CreateStudentRouteDTO, user?: { id: number; role: UserRole }) {
        const studentRoute = await this.studentRouteRepository.transaction(async (tx) => {
            if (user?.role === UserRole.STUDENT) {
                const student = await this.studentRepository.findByUserId(user.id, tx);

                if (!student || student.id !== dto.studentId) {
                    throw new ApiError("Estudante nao autorizado para esta rota!", StatusCodes.FORBIDDEN);
                }
            }

            const routeStop = await this.routeStopRepository.findById(dto.routeStopId, tx);
            if (!routeStop) {
                throw new ApiError("Parada da rota nao encontrada!", StatusCodes.BAD_REQUEST);
            }

            const route = await this.routeRepository.findById(routeStop.routeId, tx);
            if (!route || route.active !== 1) {
                throw new ApiError("Rota indisponivel para selecao!", StatusCodes.BAD_REQUEST);
            }

            const alreadyExists = await this.studentRouteRepository.findByStudentRouteStopAndPeriod(
                dto.studentId,
                dto.routeStopId,
                dto.routePeriod as RoutePeriod,
                tx
            );
            if (alreadyExists) {
                throw new ApiError("Este estudante ja esta cadastrado nesta parada de rota para este periodo!", StatusCodes.BAD_REQUEST);
            }

            const data: StudentRouteInsert = { ...dto, routePeriod: dto.routePeriod as RoutePeriod };
            return await this.studentRouteRepository.create(data, tx);
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);
        return studentRoute;
    }

    async update(id: number, dto: UpdateStudentRouteDTO, user?: { id: number; role: UserRole }) {
        const studentRouteExists = await this.studentRouteRepository.findById(id);
        if (!studentRouteExists) throw new ApiError("Rota do estudante nao encontrada!", StatusCodes.BAD_REQUEST);

        if (user?.role === UserRole.STUDENT) {
            const student = await this.studentRepository.findByUserId(user.id);

            if (!student || student.id !== studentRouteExists.studentId) {
                throw new ApiError("Estudante nao autorizado para esta rota!", StatusCodes.FORBIDDEN);
            }
        }

        if (dto.routeStopId) {
            const routeStop = await this.routeStopRepository.findById(dto.routeStopId);
            if (!routeStop) {
                throw new ApiError("Parada da rota nao encontrada!", StatusCodes.BAD_REQUEST);
            }
        }

        const studentRoute = await this.studentRouteRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:student:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return studentRoute;
    }

    async activate(id: number) {
        const studentRoute = await this.studentRouteRepository.findById(id);
        if (!studentRoute) throw new ApiError("Rota do estudante nao encontrada!", StatusCodes.BAD_REQUEST);

        await this.studentRouteRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:student:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async inactivate(id: number) {
        const studentRoute = await this.studentRouteRepository.findById(id);
        if (!studentRoute) throw new ApiError("Rota do estudante nao encontrada!", StatusCodes.BAD_REQUEST);

        await this.studentRouteRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:student:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async delete(id: number) {
        const studentRouteExists = await this.studentRouteRepository.findById(id);
        if (!studentRouteExists) throw new ApiError("Rota do estudante nao encontrada!", StatusCodes.BAD_REQUEST);

        const studentRoute = await this.studentRouteRepository.delete(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:student:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return studentRoute;
    }
}
