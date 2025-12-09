import 'dotenv/config';
import { envConfig } from '../env/env.config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import { logger } from '../../shared/utils/logger.utils';
import createDefaultAdminUser from '../../shared/utils/create-default-admin-user.utils';

class DatabaseConnection {
    private static instance: DatabaseConnection;
    private pool: Pool;
    private db: NodePgDatabase;

    private constructor() {
        const isProduction = envConfig.server.nodeEnv === 'production';

        const poolConfig: PoolConfig = {
            connectionString: envConfig.database.databaseUrl,
            max: envConfig.database.maxConnections,
            min: envConfig.database.minConnections,
            idleTimeoutMillis: envConfig.database.idleTimeoutMillis,
            connectionTimeoutMillis: envConfig.database.connectionTimeoutMillis,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
        };

        this.pool = new Pool(poolConfig);
        this.db = drizzle(this.pool, { logger: !isProduction });

        this.pool.on('error', (error: Error) => {
            logger.error(`A Database pool error ocurred: ${error.message}`);
        });

        this.pool.on('connect', () => {
            logger.info('Database connection established successfully');
        });

        this.healthCheck();
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public getDatabase(): NodePgDatabase {
        return this.db;
    }

    public async healthCheck(): Promise<Boolean> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            createDefaultAdminUser();
            logger.info('Database health check passed successfully');
            return true;
        } catch (error) {
            logger.error(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    public async shutdown(): Promise<void> {
        try {
            logger.info('Closing database connections...');
            await this.pool.end();
            logger.info('Database connections closed successfully');
        } catch (error) {
            logger.error(`A Database shutdown error ocurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

const dbConnection = DatabaseConnection.getInstance();

export const pool = dbConnection.getPool();
export const db = dbConnection.getDatabase();
export const healthCheck = dbConnection.healthCheck.bind(dbConnection);
export const shutdown = dbConnection.shutdown.bind(dbConnection);