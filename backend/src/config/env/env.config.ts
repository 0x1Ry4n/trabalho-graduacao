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

// REDIS_ENABLED chega como string. A comparacao precisa ser explicita: a
// checagem anterior (`if (REDIS_ENABLED && ...)`) considerava a string "false"
// como verdadeira, tornando impossivel subir o servidor sem Redis configurado.
const REDIS_ENABLED = (process.env.REDIS_ENABLED ?? "false").trim().toLowerCase() === "true";

const REDIS_HOST = process.env.REDIS_HOST;

if (REDIS_ENABLED && !REDIS_HOST) {
    throw new Error("REDIS_HOST is not defined. Please define the redis host if redis should be enabled to initalize the server")
}

const REDIS_PORT = process.env.REDIS_PORT;

if (REDIS_ENABLED && !REDIS_PORT) {
    throw new Error("REDIS_PORT is not defined. Please define the redis port if redis should be enabled to initalize the server")
}

const SESSION_STORAGE_METHOD = (process.env.SESSION_STORAGE_METHOD ?? "database").trim().toLowerCase();

if (!["database", "redis"].includes(SESSION_STORAGE_METHOD)) {
    throw new Error(`Invalid SESSION_STORAGE_METHOD: "${SESSION_STORAGE_METHOD}". Use "database" or "redis"`)
}

// Senha e opcional: instancias locais/dev normalmente rodam sem `requirepass`.
// Os valores "null"/"none" (usados nos .env de exemplo) sao tratados como ausencia
// de senha em vez de virarem uma senha literal enviada ao servidor.
const RAW_REDIS_PASSWORD = (process.env.REDIS_PASSWORD ?? "").trim();
const REDIS_PASSWORD =
    RAW_REDIS_PASSWORD === "" ||
        RAW_REDIS_PASSWORD.toLowerCase() === "null" ||
        RAW_REDIS_PASSWORD.toLowerCase() === "none"
        ? undefined
        : RAW_REDIS_PASSWORD;

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

// ─── AbacatePay ──────────────────────────────────────────────────────────────
// A chave de API e o segredo de webhook vivem exclusivamente aqui: nada disso
// e exposto ao app. O aplicativo so conhece ids de cobranca e o `brCode`.

const ABACATEPAY_ENABLED = (process.env.ABACATEPAY_ENABLED ?? "false").trim().toLowerCase() === "true";

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;

if (ABACATEPAY_ENABLED && !ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY is not defined. Please define it to enable the payment gateway");
}

const ABACATEPAY_WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET;

if (ABACATEPAY_ENABLED && !ABACATEPAY_WEBHOOK_SECRET) {
    throw new Error("ABACATEPAY_WEBHOOK_SECRET is not defined. Without it webhook payloads cannot be authenticated");
}

const ABACATEPAY_BASE_URL = (process.env.ABACATEPAY_BASE_URL ?? "https://api.abacatepay.com/v2").trim().replace(/\/+$/, "");

if (ABACATEPAY_ENABLED && !ABACATEPAY_BASE_URL.startsWith("https://")) {
    throw new Error("ABACATEPAY_BASE_URL must use https");
}

const ABACATEPAY_TIMEOUT = process.env.ABACATEPAY_TIMEOUT ?? "15000";

// Em devMode a AbacatePay nao move dinheiro de verdade e habilita
// /transparents/simulate-payment.
const ABACATEPAY_DEV_MODE = (process.env.ABACATEPAY_DEV_MODE ?? "true").trim().toLowerCase() === "true";

// Para onde o checkout hospedado devolve o usuario. Um deep link do app
// (ex.: unipass://checkout/return) faz o navegador fechar e a tela retomar.
const ABACATEPAY_RETURN_URL = process.env.ABACATEPAY_RETURN_URL;
const ABACATEPAY_COMPLETION_URL = process.env.ABACATEPAY_COMPLETION_URL;

// Janela de validade do Pix, em minutos.
const ABACATEPAY_PIX_EXPIRES_IN_MINUTES = process.env.ABACATEPAY_PIX_EXPIRES_IN_MINUTES ?? "30";

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
        redisEnabled: REDIS_ENABLED,
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
    abacatePay: {
        enabled: ABACATEPAY_ENABLED,
        apiKey: ABACATEPAY_API_KEY,
        webhookSecret: ABACATEPAY_WEBHOOK_SECRET,
        baseUrl: ABACATEPAY_BASE_URL,
        timeout: Number(ABACATEPAY_TIMEOUT),
        devMode: ABACATEPAY_DEV_MODE,
        returnUrl: ABACATEPAY_RETURN_URL,
        completionUrl: ABACATEPAY_COMPLETION_URL,
        pixExpiresInMinutes: Number(ABACATEPAY_PIX_EXPIRES_IN_MINUTES),
    },
    admin: {
        defaultAdminUsername: DEFAULT_ADMIN_USERNAME,
        defaultAdminEmail: DEFAULT_ADMIN_EMAIL,
        defaultAdminPassword: DEFAULT_ADMIN_PASSWORD,
    }
};