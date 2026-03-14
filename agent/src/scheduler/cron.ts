import * as cron from 'node-cron';
import logger from '../utils/logger.js';
import { runMonitor } from '../agent/runner.js';

export function startScheduler(cronExpression: string = '0 8 * * *'): void {
  logger.info(`Starting scheduler with cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, async () => {
    logger.info('Cron job triggered');
    await runMonitor();
  }, {
    timezone: process.env.TZ || 'Asia/Jakarta',
  });

  // Get the next scheduled run time (cast to any to access nextDates if not in types)
  const nextDates = (job as any).nextDates?.(1);
  if (nextDates && nextDates.length > 0) {
    logger.info(`Next run: ${nextDates[0].toISOString()}`);
  } else {
    // Fallback: calculate roughly 24 hours from now
    const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    logger.info(`Next run: ${nextRun} (estimated)`);
  }
}
