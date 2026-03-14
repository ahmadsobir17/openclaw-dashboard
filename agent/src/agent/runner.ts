import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger.js';
import { validateCookies } from '../utils/cookieValidator.js';
import { withRateLimit } from '../utils/rateLimiter.js';
import { scrapeAccount } from './scraper.js';
import { processScrapeResults } from './processor.js';
import { sendReport, sendAlert, initializeTelegram } from './reporter.js';
import * as db from '../db/queries.js';
import { sanitizeCookiesForPlaywright } from '../utils/cookieSanitizer.js';

const TOP_N = parseInt(process.env.TOP_N || '10', 10);
const MAX_POSTS = parseInt(process.env.MAX_POSTS || '50', 10);
const COOLDOWN_BETWEEN_ACCOUNTS_MS = 30000;

function getConfigPath(filename: string): string {
  const envPath = process.env[filename.toUpperCase().replace('.', '_') as keyof typeof process.env];
  if (envPath) {
    return path.resolve(envPath);
  }
  return path.resolve(process.cwd(), 'config', filename);
}

export async function runMonitor(): Promise<void> {
  const startTime = Date.now();
  logger.info('=== Monitor run started ===');

  try {
    // Set config paths
    const cookiesPath = getConfigPath('instagram_cookies.json');
    process.env.COOKIES_PATH = cookiesPath;

    // Validate cookies
    const cookiesValid = await validateCookies();
    if (!cookiesValid) {
      await sendAlert('⚠️ Instagram Cookie Expired!\n\nPlease update config/instagram_cookies.json\nThen run: docker compose restart openclaw-agent');
      await logRun(startTime, 0, 'failed', 'Cookies expired');
      return;
    }

    // Load accounts
    const accounts = await db.getActiveAccounts();
    if (accounts.length === 0) {
      logger.warn('No active accounts to monitor');
      await logRun(startTime, 0, 'skipped', 'No active accounts');
      return;
    }

    // Load cookies
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    const sanitizedCookies = sanitizeCookiesForPlaywright(cookies);

    // Initialize Telegram
    initializeTelegram();

    // Scrape accounts sequentially
    const results: Array<{ username: string; posts: any[]; error?: string }> = [];
    for (const account of accounts) {
      logger.info(`Processing @${account.username}`);

      const result = await withRateLimit(
        () => scrapeAccount(account.username, sanitizedCookies, MAX_POSTS),
        COOLDOWN_BETWEEN_ACCOUNTS_MS,
        COOLDOWN_BETWEEN_ACCOUNTS_MS + 5000
      );

      results.push(result);
    }

    // Process results
    const { posts, totalAccounts, totalPosts } = processScrapeResults(results, TOP_N);

    // Upsert posts to database
    for (const post of posts) {
      await db.upsertPost(post);
    }
    logger.info(`Upserted ${posts.length} posts to database`);

    // Get top post for summary
    const topPost = posts[0];
    const topViews = topPost?.views;
    const topUrl = topPost?.permalink;

    // Log run
    const durationMs = Date.now() - startTime;
    await logRun(startTime, posts.length, 'success', undefined, totalAccounts, totalPosts, topUrl, topViews);

    // Send report
    await sendReport(
      posts,
      totalAccounts,
      totalPosts,
      durationMs,
      topUrl,
      topViews
    );

    logger.info(`=== Monitor run completed in ${durationMs}ms ===`);
  } catch (error) {
    logger.error('Monitor run failed:', error);
    const durationMs = Date.now() - startTime;
    await logRun(startTime, 0, 'failed', error instanceof Error ? error.message : String(error));
    await sendAlert(`Monitor run failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function logRun(
  startTime: number,
  postsFetched: number,
  status: string,
  errorMessage?: string,
  accountsCount: number = 0,
  totalPosts: number = 0,
  topPostUrl?: string,
  topViews?: bigint
) {
  const durationMs = Date.now() - startTime;
  await db.logMonitorRun({
    accountsCount,
    postsFetched,
    topPostUrl,
    topViews,
    status,
    errorMessage,
    durationMs,
  });
}
