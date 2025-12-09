import { Service } from "typedi";
import { db } from "../../config/db/db.config";
import { logger } from "../utils/logger.utils";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

@Service()
export abstract class BaseRepository<T> {
    protected db = db;

    protected getDb(tx?: DbTransaction) {
        return tx || db;
    }

    protected handleError(error: unknown, operation: string): never {
        logger.error(`Error in ${operation}: ${error}`);
        throw error;
    }

    public async transaction<T>(callback: (tx: DbTransaction) => Promise<T>): Promise<T> {
        return await this.db.transaction(async (tx) => {
            return await callback(tx);
        });
    }
}