import { UserFilters, UserInsert, UserUpdate } from "../user.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { UserWithoutPassword } from "../interfaces/UserWithoutPassword";
import { User } from "../interfaces/User";

export interface IUserRepository {
    findById(id: number, tx?: DbTransaction): Promise<UserWithoutPassword | null>;
    findByEmail(email: string, tx?: DbTransaction): Promise<User | null>;
    findByUsername(username: string, tx?: DbTransaction): Promise<UserWithoutPassword | null>;
    list(tx?: DbTransaction): Promise<UserWithoutPassword[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: UserFilters, tx?: DbTransaction): Promise<PaginatedDocument<UserWithoutPassword> | null>
    create(data: UserInsert, tx?: DbTransaction): Promise<UserWithoutPassword>;
    update(id: number, data: UserUpdate, tx?: DbTransaction): Promise<UserWithoutPassword | null>;
    inactivate(id: number, tx?: DbTransaction): Promise<UserWithoutPassword | null>;
}
