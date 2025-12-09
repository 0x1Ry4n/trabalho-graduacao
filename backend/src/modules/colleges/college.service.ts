import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { CreateCollegeDTO, UpdateCollegeDTO } from "./dto/index.dto";
import { CollegeFilters } from "./college.types";
import { logger } from "../../shared/utils/logger.utils";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import { College } from "./interfaces/College";
import CollegeRepository from "./repository/college.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class CollegeService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "college";

    constructor(
        @Inject(() => CollegeRepository)
        private readonly collegeRepository: CollegeRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for college ID: ${id}`);
            return cached;
        }

        const college = await this.collegeRepository.findById(id);
        if (!college) throw new ApiError(`Instituição de ensino não encontrada!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, college, this.LIST_CACHE_TTL);

        return college;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info("Cache hit for college list");
            return cached;
        }

        const colleges = await this.collegeRepository.list();

        await this.cacheService.set(cacheKey, colleges, this.LIST_CACHE_TTL);

        return colleges;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: CollegeFilters) {
        if (page < 1) {
            throw new ApiError('O número da página deve ser maior que 0!', StatusCodes.BAD_REQUEST)
        }

        if (pageSize < 1 || pageSize > 100) {
            throw new ApiError('O limite de registros por página deve estar entre 1 e 100!', StatusCodes.BAD_REQUEST)
        }

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(
            this.CACHE_PREFIX,
            "paginated",
            page,
            pageSize,
            filterKey
        );

        const cached = await this.cacheService.get<PaginatedDocument<College> | null>(cacheKey);
        if (cached) {
            logger.info(`Cache hit for paginated colleges: page ${page}`);
            return cached;
        }

        const students = await this.collegeRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, students, this.LIST_CACHE_TTL);

        return students;
    }

    async create(dto: CreateCollegeDTO) {
        const collegeExists = await this.collegeRepository.findByName(dto.name);
        if (collegeExists) throw new ApiError(`Já existe uma instituição de ensino com o nome inserido`, StatusCodes.BAD_REQUEST);

        const result = await this.collegeRepository.create({
            ...dto,
            active: 1
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return result;
    }

    async update(id: number, dto: UpdateCollegeDTO) {
        const college = await this.collegeRepository.findById(id);
        if (!college) throw new ApiError(`Instituição de ensino não encontrada!`, StatusCodes.BAD_REQUEST);

        const updated = await this.collegeRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return updated;
    }

    async activate(id: number) {
        const driver = await this.collegeRepository.findById(id);
        if (!driver) throw new ApiError(`Instituição de ensino não encontrada!`, StatusCodes.BAD_REQUEST);

        const result = await this.collegeRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return result;
    }

    async inactivate(id: number) {
        const driver = await this.collegeRepository.findById(id);
        if (!driver) throw new ApiError(`Instituição de ensino não encontrada!`, StatusCodes.BAD_REQUEST);

        const result = await this.collegeRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return result;
    }
}