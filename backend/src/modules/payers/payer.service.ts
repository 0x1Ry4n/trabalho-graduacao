import { Inject, Service } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../shared/utils/logger.utils";
import { CreatePayerDTO } from "./dto/index.dto";
import StudentRepository from "../students/repository/student.repository";
import PayerRepository from "./repository/payer.repository";
import CacheService from "../../shared/services/cache.service";

@Service()
export default class PayerService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "payer";

    constructor(
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => PayerRepository)
        private readonly payerRepository: PayerRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for payer ID: ${id}`);
            return cached;
        }

        const payer = await this.payerRepository.findById(id);

        if (!payer) throw new ApiError(`Pagador não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, payer, this.LIST_CACHE_TTL);

        return payer;
    }

    async findByStudentId(studentId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "studentId", studentId);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const payer = await this.payerRepository.findByStudentId(studentId);

        if (!payer) throw new ApiError(`Pagador não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, payer, this.LIST_CACHE_TTL);

        return payer;
    }

    async findByCompanyName(companyName: string) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "companyName", companyName);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const payer = await this.payerRepository.findByCompanyName(companyName);

        if (!payer) throw new ApiError(`Pagador não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, payer, this.LIST_CACHE_TTL);

        return payer;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const payers = await this.payerRepository.list();

        await this.cacheService.set(cacheKey, payers, this.LIST_CACHE_TTL);

        return payers;
    }

    async create(dto: CreatePayerDTO) {
        if (dto.studentId !== null && dto.studentId !== undefined) {
            const payerStudent = await this.payerRepository.findByStudentId(dto.studentId);
            if (payerStudent) throw new ApiError('Estudante já cadastrado como pagador!', StatusCodes.BAD_REQUEST);
        }

        if (dto.companyName !== null && dto.companyName !== undefined) {
            const company = await this.payerRepository.findByCompanyName(dto.companyName);
            if (company) throw new ApiError('Compania já cadastrada como pagador!', StatusCodes.BAD_REQUEST);
        }

        const payer = await this.payerRepository.create({
            ...dto,
            active: 1
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return payer;
    }
}

