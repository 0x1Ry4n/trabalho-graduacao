import { Service, Inject } from 'typedi';
import { generateHash } from '../../shared/utils/hash.utils';
import { UserRegistrationDTO } from './dto/index.dto';
import { ApiError } from '../../shared/errors/error';
import { StatusCodes } from 'http-status-codes';
import { UserFilters } from './user.types';
import { logger } from '../../shared/utils/logger.utils';
import { PaginatedDocument } from '../../shared/utils/pagination/pagination.types';
import { UserWithoutPassword } from './interfaces/UserWithoutPassword';
import UserRepository from './repository/user.repository';
import CacheService from '../../shared/services/cache.service';

@Service()
export default class UserService {
    private readonly LIST_CACHE_TTL = 300; // 5 minutos
    private readonly CACHE_PREFIX = "user";

    constructor(
        @Inject(() => UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(() => CacheService)
        private readonly cacheService: CacheService
    ) { }

    async findById(id: number) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "id", id);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for user ID: ${id}`);
            return cached;
        }

        const user = await this.userRepository.findById(id);
        if (!user) throw new ApiError(`Usuário não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, user, this.LIST_CACHE_TTL);

        return user;
    }

    async findByEmail(email: string) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "email", email);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for user email: ${email}`);
            return cached;
        }

        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new ApiError(`Usuário não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, user, this.LIST_CACHE_TTL);

        return user;
    }

    async findByUsername(username: string) {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "username", username);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for username: ${username}`);
            return cached;
        }

        const user = await this.userRepository.findByUsername(username);
        if (!user) throw new ApiError(`Usuário não encontrado!`, StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, user, this.LIST_CACHE_TTL);

        return user;
    }

    async create(data: UserRegistrationDTO) {
        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) throw new ApiError('Email já cadastrado!', StatusCodes.BAD_REQUEST);

        const usernameExists = await this.userRepository.findByUsername(data.username);
        if (usernameExists) throw new ApiError('Username já existente!', StatusCodes.BAD_REQUEST);

        const hashedPassword = await generateHash(data.password);

        const result = await this.userRepository.create({
            ...data,
            password: hashedPassword,
            active: 1,
        });

        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);

        return result;
    }

    async list() {
        const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, "list", "all");

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            logger.info("Cache hit for user list");
            return cached;
        }

        const users = await this.userRepository.list();
        if (!users) throw new ApiError('Usuários não encontrados!', StatusCodes.BAD_REQUEST);

        await this.cacheService.set(cacheKey, users, this.LIST_CACHE_TTL);

        return users;
    }

    async listWithFiltersPaginated(page: number = 1, pageSize: number = 10, filters?: UserFilters) {
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

        const cached = await this.cacheService.get<PaginatedDocument<UserWithoutPassword> | null>(cacheKey);
        if (cached) {
            logger.info(`Cache hit for paginated users: page ${page}`);
            return cached;
        }

        const users = await this.userRepository.listWithFiltersPaginated(page, pageSize, filters);

        await this.cacheService.set(cacheKey, users, this.LIST_CACHE_TTL);

        return users;
    }

    async activate(id: number) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new ApiError('Usuário não encontrado!', StatusCodes.BAD_REQUEST);

        await this.userRepository.activate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        if (user.email) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "email", user.email));
        }
        if (user.username) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "username", user.username));
        }
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }

    async update(id: number, data: Partial<UserRegistrationDTO & { active?: number }>) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new ApiError('Usuário não encontrado!', StatusCodes.BAD_REQUEST);

        if (data.email && data.email !== user.email) {
            const emailExists = await this.userRepository.findByEmail(data.email);
            if (emailExists && emailExists.id !== id) {
                throw new ApiError('Email já cadastrado!', StatusCodes.BAD_REQUEST);
            }
        }

        if (data.username && data.username !== user.username) {
            const usernameExists = await this.userRepository.findByUsername(data.username);
            if (usernameExists && usernameExists.id !== id) {
                throw new ApiError('Username já existente!', StatusCodes.BAD_REQUEST);
            }
        }

        const updateData: any = { ...data };

        if (data.password) {
            updateData.password = await generateHash(data.password);
        } else {
            delete updateData.password;
        }

        const updatedUser = await this.userRepository.update(id, updateData);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        if (user.email) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "email", user.email));
        }
        if (user.username) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "username", user.username));
        }
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);

        return updatedUser;
    }

    async inactivate(id: number) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new ApiError('Usuário não encontrado!', StatusCodes.BAD_REQUEST);

        await this.userRepository.inactivate(id);

        await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "id", id));
        if (user.email) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "email", user.email));
        }
        if (user.username) {
            await this.cacheService.delete(this.cacheService.generateKey(this.CACHE_PREFIX, "username", user.username));
        }
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
        await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:paginated:*`);
    }
}