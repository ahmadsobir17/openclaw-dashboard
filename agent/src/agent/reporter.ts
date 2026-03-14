import { Telegraf } from 'telegraf';
import logger from '../utils/logger.js';
import { PostData } from './scraper.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

let bot: Telegraf | null = null;

export function initializeTelegram(): void {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.warn('Telegram not configured - TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing');
    return;
  }

  bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  logger.info('Telegram bot initialized');
}

function formatNumber(num: bigint | number): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return n.toLocaleString();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getMediaTypeIcon(mediaType: string): string {
  switch (mediaType) {
    case 'video':
      return '🎬';
    case 'carousel':
      return '🖼️';
    case 'image':
      return '🖼️';
    default:
      return '📱';
  }
}

export async function sendReport(
  posts: PostData[],
  totalAccounts: number,
  totalPosts: number,
  durationMs: number,
  topPostUrl?: string,
  topViews?: bigint
): Promise<void> {
  if (!bot || !TELEGRAM_CHAT_ID) {
    logger.warn('Telegram bot not initialized, skipping report');
    return;
  }

  const now = new Date();
  const lines: string[] = [];

  lines.push('📊 Instagram Views Report');
  lines.push(`📅 ${formatDate(now)} | Top ${posts.length} Posts`);
  lines.push('');
  lines.push('━'.repeat(30));

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const views = formatNumber(post.views);
    const icon = getMediaTypeIcon(post.mediaType);
    const dateStr = post.postDate.toLocaleDateString();

    lines.push(`${i + 1}️⃣ @${post.username}`);
    lines.push(`   ${icon} ${post.mediaType.toUpperCase()} | 👁 ${views} views`);
    lines.push(`   📅 ${dateStr}`);
    lines.push(`   🔗 ${post.permalink}`);
    lines.push('');
  }

  lines.push('━'.repeat(30));
  lines.push(`✅ ${totalAccounts} accounts | ${totalPosts} posts | ${durationMs}ms`);
  lines.push(`⏱ Next run: ${getNextRunTime()}`);

  const message = lines.join('\n');

  try {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' });
    logger.info('Report sent to Telegram');
  } catch (error) {
    logger.error('Failed to send Telegram report:', error);
  }
}

function getNextRunTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  // Check if tomorrow is past
  if (tomorrow <= now) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  return tomorrow.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }) + ' 08:00 WIB';
}

export async function sendAlert(message: string): Promise<void> {
  if (!bot || !TELEGRAM_CHAT_ID) {
    logger.warn('Telegram bot not initialized, skipping alert');
    return;
  }

  try {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, `⚠️ ${message}`);
    logger.info('Alert sent to Telegram');
  } catch (error) {
    logger.error('Failed to send Telegram alert:', error);
  }
}
