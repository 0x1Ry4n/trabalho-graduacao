import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { CreateRouteDTO, UpdateRouteDTO } from "./dto/index.dto";
import { Route } from "./interfaces/Route";
import { RouteFilters, RouteInsert } from "./route.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import RouteRepository from "./repository/route.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class RouteService {
    private readonly LIST_CACHE_TTL = 300;
    private readonly CACHE_PREFIX = "route";

    constructor(
        @Inject(() => RouteRepository)
        private readonly routeRepository: RouteRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const route = await this.routeRepository.findById(id);
        if (!route) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, route, this.LIST_CACHE_TTL);
        return route;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const routes = await this.routeRepository.list();
        await this.cacheService.set(cacheKey, routes, this.LIST_CACHE_TTL);
        return routes;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: RouteFilters) {
        if (page < 1) throw new ApiError("O número da página deve ser maior que 0!", StatusCodes.BAD_REQUEST);
        if (pageSize < 1 || pageSize > 100) throw new ApiError("O limite de registros por página deve estar entre 1 e 100!", StatusCodes.BAD_REQUEST);

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "paginated", page, pageSize, filterKey);

        const cached = await this.cacheService.get<PaginatedDocument<Route> | null>(cacheKey);
        if (cached) return cached;

        const routes = await this.routeRepository.listWithFiltersPaginated(page, pageSize, filters);
        await this.cacheService.set(cacheKey, routes, this.LIST_CACHE_TTL);
        return routes;
    }

    async create(dto: CreateRouteDTO) {
        const route = await this.routeRepository.transaction(async (tx) => {
            const nameExists = await this.routeRepository.findByName(dto.name);
            if (nameExists) throw new ApiError("Já existe uma rota com este nome!", StatusCodes.BAD_REQUEST);

            const data: RouteInsert = { ...dto };
            return await this.routeRepository.create(data, tx);
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);
        return route;
    }

    async update(id: number, dto: UpdateRouteDTO) {
        const routeExists = await this.routeRepository.findById(id);
        if (!routeExists) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        const route = await this.routeRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return route;
    }

    async activate(id: number) {
        const route = await this.routeRepository.findById(id);
        if (!route) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.routeRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async inactivate(id: number) {
        const route = await this.routeRepository.findById(id);
        if (!route) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.routeRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async getStops(routeId: number) {
        return await this.routeRepository.getStops(routeId);
    }

    async addStop(routeId: number, stopId: number, stopOrder: number, estimatedArrival: number) {
        const routeExists = await this.routeRepository.findById(routeId);
        if (!routeExists) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        const stop = await this.routeRepository.addStop(routeId, stopId, stopOrder, estimatedArrival);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "stops", routeId));
        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", routeId));

        return stop;
    }

    async removeStop(routeId: number, stopId: number) {
        const routeExists = await this.routeRepository.findById(routeId);
        if (!routeExists) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.routeRepository.removeStop(routeId, stopId);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "stops", routeId));
        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", routeId));
    }

    async updateStopOrder(routeId: number, stopId: number, newOrder: number, estimatedArrival: number) {
        const routeExists = await this.routeRepository.findById(routeId);
        if (!routeExists) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.routeRepository.updateStopOrder(routeId, stopId, newOrder, estimatedArrival);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "stops", routeId));
        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", routeId));
    }

    async delete(id: number) {
        const routeExists = await this.routeRepository.findById(id);
        if (!routeExists) throw new ApiError("Rota não encontrada!", StatusCodes.BAD_REQUEST);

        const route = await this.routeRepository.delete(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return route;
    }
}
