import { SignOptions } from "jsonwebtoken";

const SERVER_PORT = process.env.SERVER_PORT;

if (!SERVER_PORT) {
    throw new Error("SERVER_PORT is not defined. Please define a port to initialize the server")
}

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
    throw new Error("NODE_ENV is not defined. Please define a environment mode to initialize the server")
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined. Please define a database url to initialize the server")
}

const DATABASE_POOL_MAX = process.env.DATABASE_POOL_MAX ?? "20";
const DATABASE_POOL_MIN = process.env.DATABASE_POOL_MIN ?? "2";
const DATABASE_IDLE_TIMEOUT = process.env.DATABASE_IDLE_TIMEOUT ?? "30000";
const DATABASE_CONNECTION_TIMEOUT = process.env.DATABASE_CONNECTION_TIMEOUT ?? "5000";

const REDIS_ENABLED = process.env.REDIS_ENABLED;

if (!REDIS_ENABLED) {
    throw new Error("REDIS_ENABLED is not defined. Please define the flag if redis should be enabled to initalize the server")
}

const REDIS_HOST = process.env.REDIS_HOST;

if (REDIS_ENABLED && !REDIS_HOST) {
    throw new Error("REDIS_HOST is not defined. Please define the redis host if redis should be enabled to initalize the server")
}

const REDIS_PORT = process.env.REDIS_PORT;

if (REDIS_ENABLED && !REDIS_PORT) {
    throw new Error("REDIS_PORT is not defined. Please define the redis port if redis should be enabled to initalize the server")
}

const SESSION_STORAGE_METHOD = process.env.SESSION_STORAGE_METHOD ?? "database";

const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (REDIS_ENABLED && !REDIS_PASSWORD) {
    throw new Error("REDIS_PASSWORD is not defined. Please define the redis password if redis should be enabled to initalize the server")
}

const REDIS_MAX_RECONNECTION_ATTEMPTS = process.env.REDIS_MAX_RECONNECTION_ATTEMPTS ?? "10";
const REDIS_RECONNECT_BASE_DELAY = process.env.REDIS_RECONNECT_BASE_DELAY ?? "1000";
const REDIS_RECONNECT_MAX_DELAY = process.env.REDIS_RECONNECT_MAX_DELAY ?? "30000";
const REDIS_CONNECT_TIMEOUT = process.env.REDIS_CONNECT_TIMEOUT ?? "10000";
const REDIS_MAX_RETRIES_PER_REQUEST = process.env.REDIS_MAX_RETRIES_PER_REQUEST ?? "3";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined. Please define a jwt secret to initialize the server");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";

if (!/^\d+(s|m|h|d)$/.test(JWT_EXPIRES_IN)) {
    throw new Error("Invalid EXPIRES_IN format");
}

const SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN ?? "24h";

if (!/^\d+(s|m|h|d)$/.test(SESSION_EXPIRES_IN)) {
    throw new Error("Invalid SESSION_EXPIRES_IN format");
}

const COOKIE_EXPIRES_IN = process.env.COOKIE_EXPIRES_IN ?? "12h";

if (!/^\d+(s|m|h|d)$/.test(COOKIE_EXPIRES_IN)) {
    throw new Error("Invalid COOKIE_EXPIRES_IN format");
}

const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;

if (!REFRESH_JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const REFRESH_JWT_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN ?? "24h";

if (!/^\d+(s|m|h|d)$/.test(REFRESH_JWT_EXPIRES_IN)) {
    throw new Error("Invalid REFRESH_JWT_EXPIRES_IN format");
}

const HASH_SALT_ROUNDS = process.env.HASH_SALT_ROUNDS ?? "10";

if (!HASH_SALT_ROUNDS) {
    throw new Error("HASH_SALT_ROUNDS is not defined");
}

const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME;

if (!DEFAULT_ADMIN_USERNAME) {
    throw new Error("DEFAULT_ADMIN_USERNAME is not defined");
}

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;

if (!DEFAULT_ADMIN_EMAIL) {
    throw new Error("DEFAULT_ADMIN_EMAIL is not defined");
}

const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;

if (!DEFAULT_ADMIN_PASSWORD) {
    throw new Error("DEFAULT_ADMIN_PASSWORD is not defined");
}

export const envConfig = {
    server: {
        serverPort: SERVER_PORT,
        nodeEnv: NODE_ENV,
    },
    database: {
        databaseUrl: DATABASE_URL,
        maxConnections: Number(DATABASE_POOL_MAX),
        minConnections: Number(DATABASE_POOL_MIN),
        idleTimeoutMillis: Number(DATABASE_IDLE_TIMEOUT),
        connectionTimeoutMillis: Number(DATABASE_CONNECTION_TIMEOUT),
    },
    redis: {
        redisEnabled: REDIS_ENABLED === "true",
        redisHost: REDIS_HOST,
        redisPort: REDIS_PORT,
        redisPassword: REDIS_PASSWORD,
        maxReconnectionAttempts: Number(REDIS_MAX_RECONNECTION_ATTEMPTS),
        reconnectBaseDelay: Number(REDIS_RECONNECT_BASE_DELAY),
        reconnectMaxDelay: Number(REDIS_RECONNECT_MAX_DELAY),
        connectTimeout: Number(REDIS_CONNECT_TIMEOUT),
        maxRetriesPerRequest: Number(REDIS_MAX_RETRIES_PER_REQUEST),
    },
    auth: {
        cookieExpiresIn: Number(COOKIE_EXPIRES_IN.replace("ms", "")),
        sessionStorageMethod: SESSION_STORAGE_METHOD,
        sessionExpiresIn: Number(SESSION_EXPIRES_IN.replace("h", "")),
        jwtSecret: JWT_SECRET,
        jwtSignOptions: {
            expiresIn: JWT_EXPIRES_IN,
        } as SignOptions,
        refreshJwtSecret: REFRESH_JWT_SECRET,
        refreshJwtSignOptios: {
            expiresIn: REFRESH_JWT_EXPIRES_IN
        } as SignOptions,
        hashSaltRounds: Number(HASH_SALT_ROUNDS)
    },
    admin: {
        defaultAdminUsername: DEFAULT_ADMIN_USERNAME,
        defaultAdminEmail: DEFAULT_ADMIN_EMAIL,
        defaultAdminPassword: DEFAULT_ADMIN_PASSWORD,
    }
};