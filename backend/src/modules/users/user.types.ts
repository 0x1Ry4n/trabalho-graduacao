import { InferInsertModel } from "drizzle-orm";
import { usersTable } from "../../config/db/db.schema";
import { User } from "./interfaces/User";
import { z } from "zod";
import { userListPaginatedSchema } from "./user.schema";

export type UserInsert = InferInsertModel<typeof usersTable>;
export type UserUpdate = Partial<UserInsert>;
export type UserListPaginatedQuery = z.infer<typeof userListPaginatedSchema>;
export type UserFilters = {
    search?: Partial<User>;
}