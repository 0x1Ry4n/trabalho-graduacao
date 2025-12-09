import { Service, Inject } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { UpdateVehicleDTO, VehicleRegistrationDTO } from "./dto/index.dto";
import { Vehicle } from "./interfaces/Vehicle";
import { VehicleFilters, VehicleInsert } from "./vehicle.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import VehicleRepository from "./repository/vehicle.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class VehicleService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "vehicle";

    constructor(
        @Inject(() => VehicleRepository)
        private readonly vehicleRepository: VehicleRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) throw new ApiError(`Veículo não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, vehicle, this.LIST_CACHE_TTL);

        return vehicle;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const vehicles = await this.vehicleRepository.list();
        await this.cacheService.set(cacheKey, vehicles, this.LIST_CACHE_TTL);

        return vehicles;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: VehicleFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<Vehicle> | null>(cacheKey);
        if (cached) {
            return cached;
        }

        const vehicles = await this.vehicleRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, vehicles, this.LIST_CACHE_TTL);

        return vehicles;
    }

    async create(dto: VehicleRegistrationDTO) {
        const vehicle = await this.vehicleRepository.transaction(async (tx) => {
            const plateExists = await this.vehicleRepository.findByPlate(dto.plate);
            if (plateExists) throw new ApiError('Placa já cadastrada!', StatusCodes.BAD_REQUEST);

            const data: VehicleInsert = {
                ...dto,
                active: 1
            }

            const vehicle = await this.vehicleRepository.create(data, tx);

            return vehicle;
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return vehicle;
    }

    async update(id: number, dto: UpdateVehicleDTO) {
        const vehicleExists = await this.vehicleRepository.findById(id);
        if (!vehicleExists) throw new ApiError('Veículo não encontrado!', StatusCodes.BAD_REQUEST);

        const vehicle = await this.vehicleRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return vehicle;
    }

    async delete(id: number) {
        const vehicleExists = await this.vehicleRepository.findById(id);
        if (!vehicleExists) throw new ApiError('Veículo não encontrado!', StatusCodes.BAD_REQUEST);

        const vehicle = await this.vehicleRepository.delete(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return vehicle;
    }

    async activate(id: number) {
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) throw new ApiError('Veículo não encontrado!', StatusCodes.BAD_REQUEST);

        await this.vehicleRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async inactivate(id: number) {
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) throw new ApiError('Veículo não encontrado!', StatusCodes.BAD_REQUEST);

        await this.vehicleRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }
}