import { chromium, Browser, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import logger from './logger.js';
import { sanitizeCookiesForPlaywright } from './cookieSanitizer.js';

const INSTAGRAM_EDIT_URL = 'https://www.instagram.com/accounts/edit/';
const LOGIN_INDICATORS = ['/accounts/login/', 'Log in', 'Sign up'];

export async function validateCookies(): Promise<boolean> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    logger.info('Validating Instagram cookies...');

    const chromiumExecutable = process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

    browser = await chromium.launch({
      headless: true,
      executablePath: chromiumExecutable,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
      ],
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Load cookies from file
    const cookiesPath = process.env.COOKIES_PATH
      ? path.resolve(process.env.COOKIES_PATH)
      : path.resolve(process.cwd(), 'config', 'instagram_cookies.json');

    if (!fs.existsSync(cookiesPath)) {
      logger.error('Cookies file not found at:', cookiesPath);
      return false;
    }

    const cookiesData = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    // Sanitize cookies for Playwright compatibility
    const standardizedCookies = sanitizeCookiesForPlaywright(cookiesData);
    await context.addCookies(standardizedCookies);

    // Navigate to Instagram edit page (requires login)
    const response = await page.goto(INSTAGRAM_EDIT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (!response || !response.ok()) {
      logger.warn('Instagram edit page returned non-OK status:', response?.status());
      return false;
    }

    const content = await page.content();
    const url = page.url();

    // Check if redirected to login
    const isLoginPage = LOGIN_INDICATORS.some(indicator =>
      url.includes(indicator) || content.includes(indicator)
    );

    if (isLoginPage) {
      logger.error('Instagram cookies appear to be expired - redirected to login page');
      return false;
    }

    logger.info('Instagram cookies validated successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('Cookie validation exception: ' + errorMessage);
    return false;
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
