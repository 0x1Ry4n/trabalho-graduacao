import { and, asc, count, eq, ilike, SQL } from "drizzle-orm";
import { Service } from "typedi";
import { usersTable } from "../../../config/db/db.schema";
import { User } from "../interfaces/User";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { UserFilters, UserInsert, UserUpdate } from "../user.types";
import { IUserRepository } from "./IUserRepository";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { UserWithoutPassword } from "../interfaces/UserWithoutPassword";

@Service()
export default class UserRepository extends BaseRepository<User> implements IUserRepository {
    async findById(id: number, tx?: DbTransaction): Promise<UserWithoutPassword | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .select({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.id, id))
            .limit(1);

        return user ?? null;
    }

    async findByEmail(email: string, tx?: DbTransaction): Promise<User | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        return user ?? null;
    }

    async findByUsername(username: string, tx?: DbTransaction): Promise<UserWithoutPassword | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .select({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.username, username))
            .limit(1);

        return user ?? null;
    }

    async list(tx?: DbTransaction): Promise<UserWithoutPassword[]> {
        const dbInstance = this.getDb(tx);

        return dbInstance
            .select({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            })
            .from(usersTable);
    }

    async listWithFiltersPaginated(
        page: number = 1,
        pageSize: number = 10,
        filters?: UserFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<UserWithoutPassword> | null> {
        const dbInstance = this.getDb(tx);

        let usersQuery = dbInstance
            .select({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt
            })
            .from(usersTable)
            .$dynamic();

        if (filters?.search) {
            const { username, email, role, active } = filters.search;

            const conditions: SQL[] = [];

            if (username) {
                conditions.push(ilike(usersTable.username, `%${username}%`));
            }

            if (email) {
                conditions.push(ilike(usersTable.email, `%${email}%`));
            }

            if (role) {
                conditions.push(ilike(usersTable.role, `%${role}%`));
            }

            if (active !== undefined) {
                conditions.push(eq(usersTable.active, active));
            }

            if (conditions.length) {
                usersQuery = usersQuery.where(and(...conditions));
            }
        }

        const usersTotalCountQuery = dbInstance
            .select({ count: count() })
            .from(usersTable);

        return paginateQuery<UserWithoutPassword>(
            usersQuery,
            usersTotalCountQuery,
            asc(usersTable.id),
            { page, pageSize }
        )
    }

    async create(data: UserInsert, tx?: DbTransaction): Promise<UserWithoutPassword> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .insert(usersTable)
            .values(data)
            .returning({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            });

        return user;
    }

    async update(id: number, data: UserUpdate, tx?: DbTransaction): Promise<UserWithoutPassword | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .update(usersTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(usersTable.id, id))
            .returning({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            });

        return user ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<UserWithoutPassword | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .update(usersTable)
            .set({ active: 1, updatedAt: new Date() })
            .where(eq(usersTable.id, id))
            .returning({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            });

        return user ?? null;
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<UserWithoutPassword | null> {
        const dbInstance = this.getDb(tx);

        const [user] = await dbInstance
            .update(usersTable)
            .set({ active: 0, updatedAt: new Date() })
            .where(eq(usersTable.id, id))
            .returning({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                active: usersTable.active,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            });

        return user ?? null;
    }
}
