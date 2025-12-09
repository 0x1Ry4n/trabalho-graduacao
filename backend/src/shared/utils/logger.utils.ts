import { envConfig } from '../../config/env/env.config';
import pino from 'pino';

export const logger = pino({
    level: envConfig.server.nodeEnv === 'prod' ? 'info' : 'debug',
    transport:
        envConfig.server.nodeEnv !== 'prod'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
});