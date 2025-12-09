import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import { UserFilters, UserListPaginatedQuery } from './user.types';
import { buildFilters } from '../../shared/utils/filters.utils';
import UserService from './user.service';
import SendResponse from '../../shared/utils/response.utils';

@Service()
export default class UserController {
    constructor(
        @Inject(() => UserService)
        private readonly userService: UserService
    ) { }

    async list(req: Request, res: Response) {
        const users = await this.userService.list();
        return SendResponse.success(res, users);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, username, email, role, active } =
            req.query as unknown as UserListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<UserFilters, UserListPaginatedQuery>(
            { username, email, role, active }
        );

        const result = await this.userService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.notFound(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const user = await this.userService.findById(id);
        return SendResponse.success(res, user);
    }

    async getMe(req: Request, res: Response) {
        const user = await this.userService.findById(req.user!.id);
        return res.json(user);
    }

    async create(req: Request, res: Response) {
        const user = await this.userService.create(req.body);
        return SendResponse.success(res, user);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const user = await this.userService.update(id, req.body);
        return SendResponse.success(res, user);
    }

    async inactivate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.userService.inactivate(id);
        return SendResponse.success(res, {});
    }

    async activate(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.userService.activate(id);
        return SendResponse.success(res, {});
    }
}