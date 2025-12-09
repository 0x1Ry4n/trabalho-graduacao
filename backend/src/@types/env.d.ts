declare namespace NodeJS {
    interface ProcessEnv {
        SERVER_PORT: string;
        NODE_ENV: string;
        DATABASE_URL: string;
        DATABASE_POOL_MAX: string;
        DATABASE_POOL_MIN: string;
        DATABASE_IDLE_TIMEOUT: string;
        DATABASE_CONNECTION_TIMEOUT: string;
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;
        REFRESH_JWT_SECRET: string;
        REFRESH_JWT_EXPIRES_IN: string;
        SESSION_EXPIRES_IN: string;
        SESSION_STORAGE_METHOD: string;
        COOKIE_EXPIRES_IN: string;
        DEFAULT_ADMIN_USERNAME: string;
        DEFAULT_ADMIN_EMAIL: string;
        DEFAULT_ADMIN_PASSWORD: string;
        REDIS_ENABLED: string;
        REDIS_HOST: string;
        REDIS_PASSWORD: string;
        REDIS_PORT: string;
        REDIS_MAX_RECONNECTION_ATTEMPTS: string;
        REDIS_RECONNECT_BASE_DELAY: string;
        REDIS_RECONNECT_MAX_DELAY: string;
        REDIS_CONNECT_TIMEOUT: string;
        REDIS_MAX_RETRIES_PER_REQUEST: string;
        HASH_SALT_ROUNDS: string;
    }
}
