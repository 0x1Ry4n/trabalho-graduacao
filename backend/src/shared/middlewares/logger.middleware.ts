import { logger } from '../utils/logger.utils';
import pinoHttp from 'pino-http';

export const HttpLoggerMiddleware = pinoHttp({
    logger,
    customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
});