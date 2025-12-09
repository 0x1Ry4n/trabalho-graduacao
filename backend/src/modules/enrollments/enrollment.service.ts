import { Inject, Service } from "typedi";
import { ApiError } from "../../shared/errors/error";
import { StatusCodes } from "http-status-codes";
import { EnrollmentFilters } from "./enrollment.types";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import { Enrollment } from "./interfaces/Enrollment";
import { CreateEnrollmentDTO } from "./dto/create-enrollment.dto";
import { UpdateEnrollmentDTO } from "./dto/update-enrollment.dto";
import { EnrollmentStatus } from "../../shared/enums/enrollment-status.enum";
import { generateUniqueCode } from "../../shared/utils/unique-code-generator.utils";
import { PayerType } from "../../shared/enums/payer-type.enum";
import { AccountReceivableType } from "../../shared/enums/account-receivable-type.enum";
import { PaymentType } from "../../shared/enums/payment-type.enum";
import { AccountStatus } from "../../shared/enums/account-status.enum";
import EnrollmentRepository from "./repository/enrollment.repository";
import CacheService from "../../shared/services/cache.service";
import StudentRepository from "../students/repository/student.repository";
import CollegeRepository from "../colleges/repository/college.repository";
import AccountReceivableService from "../account_receivable/account_receivable.service";
import PayerRepository from "../payers/repository/payer.repository";
import AccountReceivableRepository from "../account_receivable/repository/account_receivable.repository";

@Service()
export default class EnrollmentService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "enrollment";

    constructor(
        @Inject(() => EnrollmentRepository)
        private readonly enrollmentRepository: EnrollmentRepository,
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => CollegeRepository)
        private readonly collegeRepository: CollegeRepository,
        @Inject(() => PayerRepository)
        private readonly payerRepository: PayerRepository,
        @Inject(() => AccountReceivableRepository)
        private readonly accountReceivableRepository: AccountReceivableRepository,
        @Inject(() => AccountReceivableService)
        private readonly accountReceivableService: AccountReceivableService,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const enrollment = await this.enrollmentRepository.findById(id);

        if (!enrollment) throw new ApiError(`Matrícula não encontrada!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, enrollment, this.LIST_CACHE_TTL);

        return enrollment;
    }

    async findByStudentId(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "studentId", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const enrollment = await this.enrollmentRepository.findByStudentId(id);

        if (!enrollment) throw new ApiError(`Matrícula não encontrada!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, enrollment, this.LIST_CACHE_TTL);

        return enrollment;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const enrollments = await this.enrollmentRepository.list();

        await this.cacheService.set(cacheKey, enrollments, this.LIST_CACHE_TTL);

        return enrollments;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: EnrollmentFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<Enrollment> | null>(cacheKey);
        if (cached) {
            return cached;
        }

        const enrollments = await this.enrollmentRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, enrollments, this.LIST_CACHE_TTL);

        return enrollments;
    }

    /*
        Criação de matrícula:
        - Valida ano (atual ± 1) e semestre (1 ou 2) antes da transação
        - Dentro da transação: verifica elegibilidade do aluno e da instituição
        - Bloqueia duplicidade de matrícula na mesma instituição ou no mesmo período
        - Garante existência do pagador (criando se necessário) e busca o preço na tabela
        - Cria a matrícula (ACTIVE) e o recebível (ENROLLMENT_FEE / OPEN) atomicamente, garantindo que nunca exista matrícula sem cobrança associada
    */
    async create(dto: CreateEnrollmentDTO) {
        const currentYear = new Date().getFullYear();
        if (dto.year < currentYear - 1 || dto.year > currentYear + 1) {
            throw new ApiError('O ano de matrícula está inválido', StatusCodes.BAD_REQUEST);
        }
        if (dto.semester < 1 || dto.semester > 2) {
            throw new ApiError('O semestre deve ser 1 ou 2', StatusCodes.BAD_REQUEST);
        }

        const enrollment = await this.enrollmentRepository.transaction(async (tx) => {
            const student = await this.studentRepository.findById(dto.studentId, tx);
            if (!student) throw new ApiError(`Estudante não encontrado`, StatusCodes.BAD_REQUEST);
            if (student.active === 0) throw new ApiError(`Estudante não está elegível para matrícula`, StatusCodes.BAD_REQUEST);

            const college = await this.collegeRepository.findById(dto.collegeId, tx);
            if (!college) throw new ApiError(`Instituição de ensino não encontrada`, StatusCodes.BAD_REQUEST);
            if (college.active === 0) throw new ApiError(`Instituição de ensino não está elegível para aceitar matrículas`, StatusCodes.BAD_REQUEST);

            const activeEnrollmentInCollege = await this.enrollmentRepository.findByStudentIdAndCollege(dto.studentId, dto.collegeId, tx);
            if (activeEnrollmentInCollege?.status === EnrollmentStatus.ACTIVE) {
                throw new ApiError(
                    `O aluno já possui uma matrícula ativa na instituição '${activeEnrollmentInCollege.collegeName}'`,
                    StatusCodes.CONFLICT
                );
            }

            const activeEnrollmentInPeriod = await this.enrollmentRepository.findByStudentIdAndPeriod(dto.studentId, dto.year, dto.semester, tx);
            if (activeEnrollmentInPeriod?.status === EnrollmentStatus.ACTIVE) {
                throw new ApiError(
                    `O aluno já possui uma matrícula para o período (${dto.semester}º semestre de ${dto.year}) na instituição '${activeEnrollmentInPeriod.collegeName}' cursando o curso '${activeEnrollmentInPeriod.course}'`,
                    StatusCodes.CONFLICT
                );
            }

            let payer = await this.payerRepository.findByStudentId(dto.studentId, tx);
            if (!payer) {
                payer = await this.payerRepository.create({
                    studentId: dto.studentId,
                    type: PayerType.STUDENT,
                    companyName: '',
                    active: 1,
                }, tx);
            }

            const enrollmentPriceTable = await this.accountReceivableService.findPriceTableByType(AccountReceivableType.ENROLLMENT_FEE);
            const defaultPriceTable = { price: 100.00, dueDate: '2026-04-10' };
            const priceTable = enrollmentPriceTable || defaultPriceTable;
            if (!priceTable.price) throw new ApiError(`Preço de matrícula não cadastrado na tabela de preços!`, StatusCodes.BAD_REQUEST);
            if (!priceTable.dueDate) throw new ApiError(`Data de vencimento não cadastrada na tabela de preços!`, StatusCodes.BAD_REQUEST);

            const enrollment = await this.enrollmentRepository.create({
                ...dto,
                cardCode: generateUniqueCode(12),
                monthlyFee: dto.monthlyFee.toFixed(2),
                enrollmentFee: dto.enrollmentFee.toFixed(2),
                status: EnrollmentStatus.ACTIVE,
            }, tx);

            if (!enrollment?.id) {
                throw new ApiError(`Erro ao criar matrícula`, StatusCodes.INTERNAL_SERVER_ERROR);
            }

            await this.accountReceivableService.create({
                description: `Taxa de matrícula do aluno ${student.id} - ${student.name} referente ao ${dto.semester}º semestre de ${dto.year} na instituição '${college.name}' - curso '${dto.course}'`, amount: priceTable.price,
                enrollmentId: enrollment.id,
                payerId: payer.id,
                paymentType: PaymentType.ANY,
                status: AccountStatus.OPEN,
                paymentDate: null,
                dueDate: priceTable.dueDate,
                accountReceivableType: AccountReceivableType.ENROLLMENT_FEE,
            }, tx);

            return enrollment;
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return enrollment;
    }

    async update(enrollmentId: number, dto: UpdateEnrollmentDTO) {
        const enrollment = await this.enrollmentRepository.transaction(async (tx) => {

            const enrollment = await this.enrollmentRepository.findById(enrollmentId, tx);
            if (!enrollment) throw new ApiError(`Matrícula não encontrada`, StatusCodes.NOT_FOUND);

            const updateData: UpdateEnrollmentDTO = {};

            if (dto.status !== undefined) {
                if (dto.status in EnrollmentStatus) updateData.status = dto.status;
                else throw new ApiError(`O status de matrícula inserido é inválido`, StatusCodes.BAD_REQUEST);
            }
            if (dto.photoUrl !== undefined) updateData.photoUrl = dto.photoUrl;
            if (dto.residenceProofUrl !== undefined) updateData.residenceProofUrl = dto.residenceProofUrl;
            if (dto.collegeEnrollmentUrl !== undefined) updateData.collegeEnrollmentUrl = dto.collegeEnrollmentUrl;

            return await this.enrollmentRepository.update(enrollmentId, {
                ...updateData,
            }, tx);
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return enrollment;
    }

    async generateMonthlyFees() {
        const now = new Date();

        const enrollments = await this.enrollmentRepository.findActiveWithoutMonthlyFee(now.getMonth() + 1, now.getFullYear());
        if (!enrollments?.length) return null;

        const accountReceivables = await this.accountReceivableRepository.createMany(
            enrollments
                .filter((enrollment) => enrollment.student.payerId !== null)
                .map((enrollment) => ({
                    enrollmentId: enrollment.id,
                    payerId: enrollment.student.payerId!,
                    amount: enrollment.monthlyFee,
                    accountReceivableType: AccountReceivableType.MONTHLY_FEE,
                    paymentType: PaymentType.ANY,
                    status: AccountStatus.OPEN,
                    paymentDate: null,
                    dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
                    description: `Mensalidade de ${now.toLocaleString('pt-BR', { month: 'long' })} de ${now.getFullYear()} - ${enrollment.course} - ${enrollment.collegeName}`,
                    active: 1,
                }))
        );

        return accountReceivables;
    }
}
