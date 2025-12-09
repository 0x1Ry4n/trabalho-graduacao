import 'reflect-metadata';
import 'dotenv/config';
import { logger } from './shared/utils/logger.utils';
import { envConfig } from './config/env/env.config';
import { initMonthlyFeeJobs } from './jobs';
import app from "./app";

const SERVER_PORT = envConfig.server.serverPort;

app.listen(SERVER_PORT, async () => {
    logger.info(`Server running on port ${SERVER_PORT}...`);
    await initMonthlyFeeJobs();
});