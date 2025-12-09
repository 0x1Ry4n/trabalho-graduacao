import { logger } from '../../shared/utils/logger.utils';
import { scheduleMonthlyFeeJob } from './monthly-fee.job';
import { createMonthlyFeeWorker } from './monthly-fee.worker';

export async function initMonthlyFeeJobs() {
    try {
        createMonthlyFeeWorker();
        await scheduleMonthlyFeeJob();
        logger.info('[Jobs] Monthly-fee jobs successfully initialized');
    } catch (error) {
        logger.error(`[Jobs] Error initializing Monthly-fee jobs: ${error}`);
    }
}