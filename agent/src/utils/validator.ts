import fs from 'fs';
import path from 'path';
import logger from './logger.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function validateStartup(): Promise<void> {
  const errors: string[] = [];

  // Validate cookies file
  const cookiesPath = path.resolve(process.cwd(), 'config', 'instagram_cookies.json');
  if (!fs.existsSync(cookiesPath)) {
    errors.push('config/instagram_cookies.json not found');
  } else {
    try {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      if (!Array.isArray(cookies) || cookies.length === 0) {
        errors.push('instagram_cookies.json must be a non-empty array');
      } else {
        const requiredFields = ['name', 'value', 'domain'];
        for (const cookie of cookies) {
          for (const field of requiredFields) {
            if (!(field in cookie)) {
              errors.push(`Cookie missing required field '${field}': ${cookie.name || 'unknown'}`);
            }
          }
        }
      }
    } catch (err) {
      errors.push(`instagram_cookies.json is not valid JSON: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Validate accounts file
  const accountsPath = path.resolve(process.cwd(), 'config', 'accounts.json');
  if (!fs.existsSync(accountsPath)) {
    errors.push('config/accounts.json not found');
  } else {
    try {
      const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
      if (!Array.isArray(accounts) || accounts.length === 0) {
        errors.push('accounts.json must be a non-empty array');
      } else {
        const activeAccounts = accounts.filter((a: any) => a.isActive !== false);
        if (activeAccounts.length === 0) {
          errors.push('accounts.json must have at least one active account');
        }
      }
    } catch (err) {
      errors.push(`accounts.json is not valid JSON: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Environment variable ${envVar} is required`);
    }
  }

  if (errors.length > 0) {
    logger.error('Startup validation failed:', errors);
    throw new ValidationError(`Startup validation failed: ${errors.join('; ')}`);
  }

  logger.info('Startup validation passed');
}
