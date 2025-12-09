import { Inject, Service } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { DriverFilters } from "./driver.types";
import { DriverRegistrationDTO, UpdateDriverDTO } from "./dto/index.dto";
import { logger } from "../../shared/utils/logger.utils";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import { Driver } from "./interfaces/Driver";
import { UserRole } from "../../shared/enums/user-role.enum";
import DriverRepository from "./repository/driver.repository";
import CacheService from "../../shared/services/cache.service";
import UserRepository from "../users/repository/user.repository";

@Service()
export default class DriverService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "driver";

    constructor(
        @Inject(() => UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(() => DriverRepository)
        private readonly driverRepository: DriverRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const driver = await this.driverRepository.findById(id);

        if (!driver) throw new ApiError(`Motorista não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, driver, this.LIST_CACHE_TTL);

        return driver;
    }

    async findByUserId(userId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "userId", userId);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const driver = await this.driverRepository.findByUserId(userId);

        if (!driver) throw new ApiError(`Motorista não encontrado para o usuário selecionado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, driver, this.LIST_CACHE_TTL);

        return driver;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const drivers = await this.driverRepository.list();

        await this.cacheService.set(cacheKey, drivers, this.LIST_CACHE_TTL);

        return drivers;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: DriverFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<Driver> | null>(cacheKey);
        if (cached) {
            return cached;
        }

        const drivers = await this.driverRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, drivers, this.LIST_CACHE_TTL);

        return drivers;
    }

    async create(dto: DriverRegistrationDTO) {
        const userExists = await this.userRepository.findById(dto.userId);
        if (!userExists) throw new ApiError('O usuário selecionado não existe!');

        // Se usuário ainda não for motorista, considera como promoção para DRIVER
        if (userExists.role !== UserRole.DRIVER) {
            await this.userRepository.update(dto.userId, { role: UserRole.DRIVER });
            await this.cacheService.deletePattern(`user:*`);
        }

        if (dto.email !== null && dto.email !== undefined) {
            const emailExists = await this.driverRepository.findByEmail(dto.email);
            if (emailExists) throw new ApiError('Email já cadastrado!', StatusCodes.BAD_REQUEST);
        }

        if (dto.phone !== null && dto.phone !== undefined) {
            const phoneExists = await this.driverRepository.findByPhone(dto.phone);
            if (phoneExists) throw new ApiError('Telefone já cadastrado!', StatusCodes.BAD_REQUEST);
        }

        const cpfExists = await this.driverRepository.findByCPF(dto.cpf);
        if (cpfExists) throw new ApiError('CPF já cadastrado!', StatusCodes.BAD_REQUEST);

        const rgExists = await this.driverRepository.findByRG(dto.rg);
        if (rgExists) throw new ApiError('RG já cadastrado!', StatusCodes.BAD_REQUEST);

        if (dto.cnpj !== null && dto.cnpj !== undefined) {
            const cnpjExists = await this.driverRepository.findByCNPJ(dto.cnpj);
            if (cnpjExists) throw new ApiError('CNPJ já cadastrado!', StatusCodes.BAD_REQUEST);
        }

        const driver = await this.driverRepository.create(dto);

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return driver;
    }

    async update(id: number, dto: UpdateDriverDTO) {
        const driver = await this.driverRepository.findById(id);
        if (!driver) throw new ApiError(`Motorista não encontrado!`, StatusCodes.BAD_REQUEST);

        const updated = await this.driverRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return updated;
    }

    async activate(id: number) {
        const driver = await this.driverRepository.findById(id);
        if (!driver) throw new ApiError(`Motorista não encontrado!`, StatusCodes.BAD_REQUEST);

        const result = await this.driverRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return result;
    }

    async inactivate(id: number) {
        const driver = await this.driverRepository.findById(id);
        if (!driver) throw new ApiError(`Motorista não encontrado!`, StatusCodes.BAD_REQUEST);

        const result = await this.driverRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return result;
    }
}
