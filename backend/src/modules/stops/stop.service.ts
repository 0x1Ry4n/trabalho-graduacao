import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { CreateStopDTO, UpdateStopDTO } from "./dto/index.dto";
import { Stop } from "./interfaces/Stop";
import { StopFilters, StopInsert } from "./stop.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import StopRepository from "./repository/stop.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class StopService {
    private readonly LIST_CACHE_TTL = 300;
    private readonly CACHE_PREFIX = "stop";

    constructor(
        @Inject(() => StopRepository)
        private readonly stopRepository: StopRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const stop = await this.stopRepository.findById(id);
        if (!stop) throw new ApiError("Parada não encontrada!", StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, stop, this.LIST_CACHE_TTL);
        return stop;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const stops = await this.stopRepository.list();
        await this.cacheService.set(cacheKey, stops, this.LIST_CACHE_TTL);
        return stops;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: StopFilters) {
        if (page < 1) throw new ApiError("O número da página deve ser maior que 0!", StatusCodes.BAD_REQUEST);
        if (pageSize < 1 || pageSize > 100) throw new ApiError("O limite de registros por página deve estar entre 1 e 100!", StatusCodes.BAD_REQUEST);

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "paginated", page, pageSize, filterKey);

        const cached = await this.cacheService.get<PaginatedDocument<Stop> | null>(cacheKey);
        if (cached) return cached;

        const stops = await this.stopRepository.listWithFiltersPaginated(page, pageSize, filters);
        await this.cacheService.set(cacheKey, stops, this.LIST_CACHE_TTL);
        return stops;
    }

    async create(dto: CreateStopDTO) {
        const stop = await this.stopRepository.transaction(async (tx) => {
            const nameExists = await this.stopRepository.findByName(dto.name);
            if (nameExists) throw new ApiError("Já existe uma parada com este nome!", StatusCodes.BAD_REQUEST);

            const data: StopInsert = { ...dto };
            return await this.stopRepository.create(data, tx);
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);
        return stop;
    }

    async update(id: number, dto: UpdateStopDTO) {
        const stopExists = await this.stopRepository.findById(id);
        if (!stopExists) throw new ApiError("Parada não encontrada!", StatusCodes.BAD_REQUEST);

        const stop = await this.stopRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return stop;
    }

    async delete(id: number) {
        const stopExists = await this.stopRepository.findById(id);
        if (!stopExists) throw new ApiError("Parada não encontrada!", StatusCodes.BAD_REQUEST);

        const stop = await this.stopRepository.delete(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return stop;
    }
}
