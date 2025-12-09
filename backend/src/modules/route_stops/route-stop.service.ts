import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { CreateRouteStopDTO, UpdateRouteStopDTO } from "./dto/index.dto";
import { RouteStop } from "./interfaces/RouteStop";
import { RouteStopFilters, RouteStopInsert } from "./route-stop.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import RouteStopRepository from "./repository/route-stop.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class RouteStopService {
    private readonly LIST_CACHE_TTL = 300;
    private readonly CACHE_PREFIX = "route_stop";

    constructor(
        @Inject(() => RouteStopRepository)
        private readonly routeStopRepository: RouteStopRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const routeStop = await this.routeStopRepository.findById(id);
        if (!routeStop) throw new ApiError("Parada da rota não encontrada!", StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, routeStop, this.LIST_CACHE_TTL);
        return routeStop;
    }

    async listByRoute(routeId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "route", routeId);

        const cached = await this.cacheService.get<RouteStop[]>(cacheKey);
        if (cached) return cached;

        const stops = await this.routeStopRepository.listByRoute(routeId);
        await this.cacheService.set(cacheKey, stops, this.LIST_CACHE_TTL);
        return stops;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: RouteStopFilters) {
        if (page < 1) throw new ApiError("O número da página deve ser maior que 0!", StatusCodes.BAD_REQUEST);
        if (pageSize < 1 || pageSize > 100) throw new ApiError("O limite de registros por página deve estar entre 1 e 100!", StatusCodes.BAD_REQUEST);

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "paginated", page, pageSize, filterKey);

        const cached = await this.cacheService.get<PaginatedDocument<RouteStop> | null>(cacheKey);
        if (cached) return cached;

        const result = await this.routeStopRepository.listWithFiltersPaginated(page, pageSize, filters);
        await this.cacheService.set(cacheKey, result, this.LIST_CACHE_TTL);
        return result;
    }

    async create(dto: CreateRouteStopDTO) {
        const routeStop = await this.routeStopRepository.transaction(async (tx) => {
            const alreadyExists = await this.routeStopRepository.findByRouteAndStop(dto.routeId, dto.stopId);
            if (alreadyExists) throw new ApiError("Esta parada já está cadastrada nesta rota!", StatusCodes.BAD_REQUEST);

            const orderExists = await this.routeStopRepository.findByRouteAndOrder(dto.routeId, dto.stopOrder);
            if (orderExists) throw new ApiError("Já existe uma parada com esta ordem nesta rota!", StatusCodes.BAD_REQUEST);

            const data: RouteStopInsert = { ...dto };
            return await this.routeStopRepository.create(data, tx);
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);
        return routeStop;
    }

    async update(id: number, dto: UpdateRouteStopDTO) {
        const routeStopExists = await this.routeStopRepository.findById(id);
        if (!routeStopExists) throw new ApiError("Parada da rota não encontrada!", StatusCodes.BAD_REQUEST);

        if (dto.stopOrder !== undefined) {
            const orderConflict = await this.routeStopRepository.findByRouteAndOrder(routeStopExists.routeId, dto.stopOrder);
            if (orderConflict && orderConflict.id !== id) {
                throw new ApiError("Já existe uma parada com esta ordem nesta rota!", StatusCodes.BAD_REQUEST);
            }
        }

        const routeStop = await this.routeStopRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return routeStop;
    }

    async delete(id: number) {
        const routeStopExists = await this.routeStopRepository.findById(id);
        if (!routeStopExists) throw new ApiError("Parada da rota não encontrada!", StatusCodes.BAD_REQUEST);

        const routeStop = await this.routeStopRepository.delete(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:route:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return routeStop;
    }
}
