import logger from './utils/logger.js';
import { validateStartup } from './utils/validator.js';
import { startHealthServer } from './health/server.js';
import { startScheduler } from './scheduler/cron.js';
import { runMonitor } from './agent/runner.js';
import { createAccount } from './db/queries.js';
import * as fs from 'fs';

async function main() {
  try {
    logger.info('Starting OpenClaw Instagram Agent...');

    // Validate startup
    await validateStartup();

    // Prisma generate and migrations are handled in Dockerfile via prisma db push

    // Initialize accounts from config file
    const accountsConfig = JSON.parse(fs.readFileSync('config/accounts.json', 'utf8'));
    for (const account of accountsConfig) {
      if (account.username && account.isActive !== false) {
        try {
          await createAccount(account.username);
          logger.info(`Ensured account exists: ${account.username}`);
        } catch (err: any) {
          if (!err.message.includes('Uniqueness')) {
            logger.error(`Failed to create account ${account.username}:`, err);
          }
        }
      }
    }

    // Start health server and scheduler only if not running a one-time monitor
    if (!process.argv.includes('monitor')) {
      // Start health server
      startHealthServer(parseInt(process.env.AGENT_PORT || '4000', 10));

      // Start scheduler
      const cronSchedule = process.env.CRON_SCHEDULE || '0 8 * * *';
      startScheduler(cronSchedule);
    }

    // If command line argument 'monitor' provided, run once and exit
    if (process.argv.includes('monitor')) {
      logger.info('Running one-time monitor...');
      await runMonitor();
      process.exit(0);
    }

    logger.info('Agent started, waiting for scheduled runs...');
  } catch (error) {
    logger.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main();
