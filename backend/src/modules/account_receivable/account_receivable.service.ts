import { Inject, Service } from "typedi";
import { logger } from "../../shared/utils/logger.utils";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/errors/error";
import { AccountReceivableFilters, AccountReceivableInsert, AccountReceivableUpdate, PriceTableInsert, PriceTableUpdate } from "./account_receivable.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import { AccountReceivable } from "./interfaces/AccountReceivable";
import { CreateAccountReceivableDTO, UpdateAccountReceivableDTO } from "./dto/index.dto";
import { AccountReceivableType } from "../../shared/enums/account-receivable-type.enum";
import { CreatePriceTableDTO } from "./dto/create-price-table.dto";
import { UpdatePriceTableDTO } from "./dto/update-price-table.dto";
import { DbTransaction } from "../../shared/database/base.repository";
import AccountReceivableRepository from "./repository/account_receivable.repository";
import CacheService from "../../shared/services/cache.service";
import StudentRepository from "../students/repository/student.repository";
import PayerRepository from "../payers/repository/payer.repository";
import EnrollmentRepository from "../enrollments/repository/enrollment.repository";


@Service()
export default class AccountReceivableService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "account_receivable";

    constructor(
        @Inject(() => AccountReceivableRepository)
        private readonly accountReceivableRepository: AccountReceivableRepository,
        @Inject(() => EnrollmentRepository)
        private readonly enrollmentRepository: EnrollmentRepository,
        @Inject(() => PayerRepository)
        private readonly payerRepository: PayerRepository,
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService,
    ) { }

    // ─── Accounts Receivable Services ─────────────────────────────────────────────────────

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const accountReceivable = await this.accountReceivableRepository.findById(id);
        if (!accountReceivable) throw new ApiError(`Recebível não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, accountReceivable, this.LIST_CACHE_TTL);

        return accountReceivable;
    }

    async findByUserId(userId: number) {
        const student = await this.studentRepository.findByUserId(userId);
        if (!student) throw new ApiError(`Aluno não encontrado para o usuário!`, StatusCodes.BAD_REQUEST);

        const accountsReceivable = await this.accountReceivableRepository.findByStudentId(student.id);
        return accountsReceivable;
    }

    async findByEnrollmentId(enrollmentId: number) {
        const accountsReceivable = await this.accountReceivableRepository.findByEnrollmentId(enrollmentId);
        return accountsReceivable;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const accountsReceivable = await this.accountReceivableRepository.list();

        await this.cacheService.set(cacheKey, accountsReceivable, this.LIST_CACHE_TTL);

        return accountsReceivable;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: AccountReceivableFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<AccountReceivable> | null>(cacheKey);
        if (cached) {
            logger.info(`Cache hit for paginated account receivables: page ${page}`);
            return cached;
        }

        const accountsReceivable = await this.accountReceivableRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, accountsReceivable, this.LIST_CACHE_TTL);

        return accountsReceivable;
    }

    async create(dto: CreateAccountReceivableDTO, tx?: DbTransaction) {
        const execute = async (transaction: DbTransaction) => {
            const payer = await this.payerRepository.findById(dto.payerId, transaction);
            if (!payer || payer.studentId === null) throw new ApiError(`Pagador não encontrado!`, StatusCodes.BAD_REQUEST);

            const student = await this.studentRepository.findById(payer.studentId, transaction);
            if (!student) throw new ApiError(`Aluno não encontrado!`, StatusCodes.BAD_REQUEST);

            const enrollment = await this.enrollmentRepository.findById(dto.enrollmentId, transaction);
            if (!enrollment) throw new ApiError(`Matrícula não encontrada!`, StatusCodes.BAD_REQUEST);

            const data: AccountReceivableInsert = {
                ...dto,
                amount: dto.amount.toString(),
                dueDate: dto.dueDate.toISOString(),
                paymentDate: dto.paymentDate?.toISOString(),
                active: 1,
            };

            await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

            return await this.accountReceivableRepository.create(data, transaction);
        };

        return tx
            ? execute(tx)
            : this.accountReceivableRepository.transaction(execute);
    }

    async update(id: number, dto: UpdateAccountReceivableDTO) {
        const accountReceivable = await this.accountReceivableRepository.transaction(async (tx) => {
            const accountReceivable = await this.accountReceivableRepository.findById(id, tx);

            if (!accountReceivable) {
                throw new ApiError('Recebível não encontrado!', StatusCodes.BAD_REQUEST);
            }

            let paymentDate: string | undefined;

            if (dto.paymentDate) {
                const parsedDate = new Date(dto.paymentDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    throw new ApiError('Data de pagamento inválida!', StatusCodes.BAD_REQUEST);
                }

                paymentDate = parsedDate.toISOString();
            }

            const data: AccountReceivableUpdate = {
                ...dto,
                paymentDate,
            };

            const updated = await this.accountReceivableRepository.update(id, data, tx);

            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, 'id', id));
            await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
            await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

            return updated;
        });

        return accountReceivable;
    }

    // ─── Price Tables Services ─────────────────────────────────────────────────────────────

    async createPriceTable(dto: CreatePriceTableDTO) {
        if (dto.dueDate < new Date()) {
            throw new ApiError('A data de vencimento não pode ser anterior à data atual', StatusCodes.BAD_REQUEST);
        }

        const priceTable = await this.accountReceivableRepository.transaction(async (tx) => {
            const priceTable = await this.accountReceivableRepository.findPriceTableByType(dto.type, tx);
            if (priceTable && priceTable.active !== 0) throw new ApiError(`Já existe uma tabela de preços ativa com esse tipo!`, StatusCodes.BAD_REQUEST);

            const data: PriceTableInsert = {
                ...dto,
                price: dto.price.toString(),
                dueDate: dto.dueDate.toISOString(),
            };

            return await this.accountReceivableRepository.createPriceTable(data, tx);
        });

        return priceTable;
    }

    async updatePriceTable(id: number, dto: UpdatePriceTableDTO) {
        if (dto.dueDate && dto.dueDate < new Date()) {
            throw new ApiError('A data de vencimento não pode ser anterior à data atual', StatusCodes.BAD_REQUEST);
        }

        const priceTable = await this.accountReceivableRepository.transaction(async (tx) => {
            const priceTable = await this.accountReceivableRepository.findPriceTableById(id, tx);
            if (!priceTable) throw new ApiError("Tabela de preço não encontrada!", StatusCodes.BAD_REQUEST);
            if (priceTable.active === 0) throw new ApiError("A tabela de preço foi inativada!", StatusCodes.BAD_REQUEST);

            const data: PriceTableUpdate = {
                ...dto,
                price: dto.price !== undefined ? dto.price.toString() : undefined,
                dueDate: dto.dueDate ? dto.dueDate.toISOString() : undefined,
            };

            const updated =
                await this.accountReceivableRepository.updatePriceTable(id, data, tx);

            return updated;
        });

        return priceTable;
    }

    async findPriceTableById(id: number) {
        const priceTableExists = await this.accountReceivableRepository.findPriceTableById(id);
        if (!priceTableExists) throw new ApiError(`Tabela de preço não encontrada!`, StatusCodes.BAD_REQUEST);

        return priceTableExists;
    }

    async findPriceTableByType(type: AccountReceivableType) {
        const priceTableExists = await this.accountReceivableRepository.findPriceTableByType(type);
        if (!priceTableExists) throw new ApiError(`Tabela de preço não encontrada!`, StatusCodes.BAD_REQUEST);

        return priceTableExists;
    }

    async activatePriceTable(id: number) {
        const priceTable = await this.accountReceivableRepository.findPriceTableById(id);
        if (!priceTable) throw new ApiError(`Tabela de preço não encontrada!`, StatusCodes.BAD_REQUEST);

        return await this.accountReceivableRepository.updatePriceTable(id, { active: 1 });
    }

    async inactivatePriceTable(id: number) {
        const priceTable = await this.accountReceivableRepository.findPriceTableById(id);
        if (!priceTable) throw new ApiError(`Tabela de preço não encontrada!`, StatusCodes.BAD_REQUEST);

        return await this.accountReceivableRepository.updatePriceTable(id, { active: 0 });
    }

    async listPriceTables() {
        return await this.accountReceivableRepository.listPriceTables();
    }
}
