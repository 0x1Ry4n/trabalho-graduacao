import { db } from "../../config/db/db.config";
import { envConfig } from "../../config/env/env.config";
import { usersTable } from "../../config/db/db.schema";
import { eq } from "drizzle-orm";
import { generateHash } from "./hash.utils";
import { UserRole } from "../enums/user-role.enum";
import { logger } from "./logger.utils";

export default async function createDefaultAdminUser(): Promise<Boolean> {
    const adminUsername = envConfig.admin.defaultAdminUsername;
    const adminEmail = envConfig.admin.defaultAdminEmail;
    const adminPassword = envConfig.admin.defaultAdminPassword;

    const [userExists] = await db
        .select({
            id: usersTable.id
        })
        .from(usersTable)
        .where(eq(usersTable.username, adminUsername))
        .limit(1);

    if (userExists) {
        logger.warn("Default admin already exists!")
        return false
    }

    const hashedPassword = await generateHash(adminPassword);

    const [user] = await db
        .insert(usersTable)
        .values({
            username: adminUsername,
            email: adminEmail,
            password: hashedPassword,
            role: UserRole.ADMIN,
            active: 1


        })
        .returning({
            id: usersTable.id
        });

    logger.info("Default admin created sucessfully!");

    return user ? true : false;
}