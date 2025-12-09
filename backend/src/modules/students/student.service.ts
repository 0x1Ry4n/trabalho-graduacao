import PayerRepository from "../payers/repository/payer.repository";
import StudentRepository from "./repository/student.repository";
import UserRepository from "../users/repository/user.repository";
import CollegeRepository from "../colleges/repository/college.repository";
import CacheService from "../../shared/services/cache.service";
import PayerService from "../payers/payer.service";
import { CardValidationRegistrationDTO } from "./dto/create-card-validation.dto";
import { CardValidation } from "./interfaces/CardValidation";
import { Inject, Service } from "typedi";
import { logger } from "../../shared/utils/logger.utils";
import { CardValidationFilters, StudentFilters, StudentInsert } from "./student.types";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/errors/error";
import { PayerType } from "../../shared/enums/payer-type.enum";
import { StudentRegistrationDTO } from "./dto/create-student.dto";
import { UserRole } from "../../shared/enums/user-role.enum";
import { PaginatedDocument } from "../../shared/utils/pagination/pagination.types";
import { Student } from "./interfaces/Student";
import { UpdateStudentDTO } from "./dto/update-student.dto";

@Service()
export default class StudentService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "student";
    private readonly CARD_VALIDATION_CACHE_PREFIX = 'card_validations';

    constructor(
        @Inject(() => StudentRepository)
        private readonly studentRepository: StudentRepository,
        @Inject(() => UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(() => CollegeRepository)
        private readonly collegeRepository: CollegeRepository,
        @Inject(() => PayerService)
        private readonly payerService: PayerService,
        @Inject(() => PayerRepository)
        private readonly payerRepository: PayerRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for student ID: ${id}`);
            return cached;
        }

        const student = await this.studentRepository.findById(id);

        if (!student) throw new ApiError(`Aluno não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, student, this.LIST_CACHE_TTL);

        return student;
    }

    async findByUserId(userId: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "userId", userId);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for student userId: ${userId}`);
            return cached;
        }

        const student = await this.studentRepository.findByUserId(userId);
        if (!student) throw new ApiError(`Aluno não encontrado para o usuário selecionado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, student, this.LIST_CACHE_TTL);

        return student;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info("Cache hit for student list");
            return cached;
        }

        const students = await this.studentRepository.list();

        await this.cacheService.set(cacheKey, students, this.LIST_CACHE_TTL);

        return students;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: StudentFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<Student> | null>(cacheKey);
        if (cached) {
            logger.info(`Cache hit for paginated students: page ${page}`);
            return cached;
        }

        const students = await this.studentRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, students, this.LIST_CACHE_TTL);

        return students;
    }

    async listCardValidationsByStudentIdWithFiltersPaginated(studentId: number, page: number = 1, pageSize: number = 10, filters?: CardValidationFilters) {
        if (page < 1) {
            throw new ApiError('O número da página deve ser maior que 0!', StatusCodes.BAD_REQUEST)
        }

        if (pageSize < 1 || pageSize > 100) {
            throw new ApiError('O limite de registros por página deve estar entre 1 e 100!', StatusCodes.BAD_REQUEST)
        }

        const filterKey = filters ? JSON.stringify(filters) : "nofilter";
        const cacheKey = this.cacheService.generateKey(
            this.CARD_VALIDATION_CACHE_PREFIX,
            "paginated",
            page,
            pageSize,
            filterKey
        );

        const cached = await this.cacheService.get<PaginatedDocument<CardValidation> | null>(cacheKey);
        if (cached) {
            logger.info(`Cache hit for paginated card validations: page ${page}`);
            return cached;
        }

        const cardValidations = await this.studentRepository.listCardValidationsByStudentIdWithFiltersPaginated(studentId, page, pageSize, filters);

        await this.cacheService.set(cacheKey, cardValidations, this.LIST_CACHE_TTL);

        return cardValidations;
    }

    async listCardValidationsByStudentId(studentId: number): Promise<CardValidation[]> {
        const studentExists = await this.studentRepository.findById(studentId);
        if (!studentExists) throw new ApiError('O estudante selecionado não existe!');

        const cacheKey = `${this.CARD_VALIDATION_CACHE_PREFIX}:${studentId}:list`;

        const cached = await this.cacheService.get<CardValidation[]>(cacheKey);
        if (cached) return cached;

        const validations = await this.studentRepository.listCardValidationsByStudentId(studentId);

        await this.cacheService.set(cacheKey, validations);

        return validations;
    }

    async create(dto: StudentRegistrationDTO) {
        const student = await this.studentRepository.transaction(async (tx) => {
            const userExists = await this.userRepository.findById(dto.userId, tx);
            if (!userExists) throw new ApiError('O usuário selecionado não existe!');
            if (userExists.role !== UserRole.STUDENT) throw new ApiError('O usuário selecionado não foi cadastrado como estudante!')

            const emailExists = await this.studentRepository.findByEmail(dto.email, tx);
            if (emailExists) throw new ApiError('Email já cadastrado!', StatusCodes.BAD_REQUEST);

            const phoneExists = await this.studentRepository.findByPhone(dto.phone, tx);
            if (phoneExists) throw new ApiError('Telefone já cadastrado!', StatusCodes.BAD_REQUEST);

            const cpfExists = await this.studentRepository.findByCPF(dto.cpf, tx);
            if (cpfExists) throw new ApiError('CPF já cadastrado!', StatusCodes.BAD_REQUEST);

            const rgExists = await this.studentRepository.findByRG(dto.rg, tx);
            if (rgExists) throw new ApiError('RG já cadastrado!', StatusCodes.BAD_REQUEST);

            const collegeExists = await this.collegeRepository.findById(dto.collegeId, tx);
            if (!collegeExists) throw new ApiError('A instituição de ensino selecionada não existe!')

            const data: StudentInsert = {
                ...dto,
                active: 1
            }

            const student = await this.studentRepository.create(data, tx);

            return student;
        });

        // Criar payer fora da transação
        await this.payerRepository.create({
            type: PayerType.STUDENT,
            studentId: student.id,
            active: 1
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return student;
    }

    async createCardValidation(dto: CardValidationRegistrationDTO): Promise<CardValidation> {
        const studentExists = await this.studentRepository.findById(dto.studentId);
        if (!studentExists) throw new ApiError('O estudante selecionado não existe!');

        const cardValidation = await this.studentRepository.createCardValidation(dto);

        await Promise.all([
            this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`),
            this.cacheService.deletePattern(`${this.CARD_VALIDATION_CACHE_PREFIX}:${dto.studentId}:*`),
        ]);

        return cardValidation;
    }

    async update(id: number, dto: UpdateStudentDTO) {
        const student = await this.studentRepository.findById(id);
        if (!student) throw new ApiError(`Aluno não encontrado!`, StatusCodes.BAD_REQUEST)

        const updated = await this.studentRepository.update(id, dto);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return updated;
    }

    async activate(id: number) {
        const user = await this.studentRepository.findById(id);
        if (!user) throw new ApiError('Aluno não encontrado!', StatusCodes.BAD_REQUEST);

        await this.studentRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async inactivate(id: number) {
        const user = await this.studentRepository.findById(id);
        if (!user) throw new ApiError('Aluno não encontrado!', StatusCodes.BAD_REQUEST);

        await this.studentRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }
}