import { chromium, Browser, BrowserContext } from 'playwright';
import logger from '../utils/logger.js';
import { delay, randomDelay } from '../utils/rateLimiter.js';

export interface PostData {
  id: string;
  username: string;
  mediaType: string;
  views: bigint;
  likes: number;
  comments: number;
  permalink: string;
  postDate: Date;
}

export interface ScrapeResult {
  username: string;
  posts: PostData[];
  error?: string;
}

export async function scrapeAccount(
  username: string,
  cookies: any[],
  maxPosts: number = 50
): Promise<ScrapeResult> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    logger.info(`Scraping account @${username}`);

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
      userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${120 + Math.floor(Math.random() * 20)}.0.0.0 Safari/537.36`,
    });

    await context.addCookies(cookies);
    const page = await context.newPage();

    // Navigate to reels page
    const reelsUrl = `https://www.instagram.com/${username}/reels/`;
    await page.goto(reelsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Check if account exists
    const content = await page.content();
    if (content.includes('Page Not Found') || content.includes('Sorry, this page isn\'t available')) {
      logger.warn(`Account @${username} not found`);
      return { username, posts: [], error: 'Account not found' };
    }

    // Check if private
    if (content.includes('This Account is Private') || content.includes('Follow to see their photos')) {
      logger.warn(`Account @${username} is private`);
      return { username, posts: [], error: 'Account is private' };
    }

    // Scroll to load posts
    const posts = await scrollAndExtractPosts(page, maxPosts);

    // Fetch detailed info for each post
    const detailedPosts: PostData[] = [];
    for (const post of posts.slice(0, 10)) { // Limit detailed fetching to top 10
      try {
        const detail = await fetchPostDetails(page, post.url, username);
        if (detail) {
          detailedPosts.push(detail);
        }
        await delay(randomDelay(1000, 3000));
      } catch (err) {
        logger.warn(`Failed to fetch details for post ${post.url}:`, err);
      }
    }

    logger.info(`Scraped @${username}: ${detailedPosts.length} posts`);
    return { username, posts: detailedPosts };
  } catch (error) {
    logger.error(`Error scraping @${username}:`, error);
    return { username, posts: [], error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrollAndExtractPosts(
  page: any,
  maxPosts: number,
  maxEmptyScrolls: number = 3
): Promise<Array<{ url: string; viewCount?: bigint; thumbnail?: string }>> {
  const posts: Array<{ url: string; viewCount?: bigint; thumbnail?: string }> = [];
  let emptyScrollCount = 0;
  let lastHeight = 0;

  while (posts.length < maxPosts && emptyScrollCount < maxEmptyScrolls) {
    // Extract post elements from grid
    const postElements = await page.$$('article a[href*="/p/"], article a[href*="/reel/"]');

    for (const element of postElements) {
      if (posts.length >= maxPosts) break;

      try {
        const href = await element.getAttribute('href');
        if (!href) continue;

        const fullUrl = href.startsWith('http') ? href : `https://www.instagram.com${href}`;

        // Check if already seen
        if (posts.some(p => p.url === fullUrl)) continue;

        // Try to get view count from parent elements
        let viewCount: bigint | undefined;
        try {
          const parent = await element.evaluate((el: any) => {
            let parent = el.parentElement;
            for (let i = 0; i < 5; i++) {
              if (!parent) break;
              const text = parent.textContent || '';
              if (/\d+[KM]? views?/i.test(text)) {
                return text;
              }
              parent = parent.parentElement;
            }
            return null;
          });

          if (parent) {
            viewCount = parseViewCount(parent);
          }
        } catch (err) {
          // Ignore view count extraction errors
        }

        posts.push({ url: fullUrl, viewCount });
      } catch (err) {
        // Ignore individual post extraction errors
      }
    }

    // Scroll down
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await delay(randomDelay(2000, 4000));

    // Check for empty scrolls
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) {
      emptyScrollCount++;
    } else {
      emptyScrollCount = 0;
    }
    lastHeight = newHeight;
  }

  return posts;
}

async function fetchPostDetails(page: any, url: string, username: string): Promise<PostData | null> {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!response || !response.ok()) return null;

    // Wait for content
    await delay(2000);

    const content = await page.content();

    // Check if deleted
    if (content.includes('Sorry, this page isn\'t available')) {
      return null;
    }

    // Extract metadata
    const [views, likes, comments, mediaType, dateStr] = await Promise.all([
      extractViewCount(page),
      extractStat(page, 'likes'),
      extractStat(page, 'comments'),
      extractMediaType(page),
      extractPostDate(page),
    ]);

    // Generate post ID from URL
    const idMatch = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
    const id = idMatch ? `${idMatch[1]}-${idMatch[2]}` : url;

    return {
      id,
      username,
      mediaType: mediaType || 'unknown',
      views: views || 0n,
      likes: likes || 0,
      comments: comments || 0,
      permalink: url,
      postDate: dateStr ? new Date(dateStr) : new Date(),
    };
  } catch (error) {
    logger.warn(`Error fetching post details for ${url}:`, error);
    return null;
  }
}

async function extractViewCount(page: any): Promise<bigint | null> {
  try {
    const text = await page.evaluate(() => {
      // Look for view count in various selectors
      const selectors = [
        'section span:has-text("views")',
        '[data-testid="post-view-count"]',
        'div._aacl:has-text("views")',
        'span:has-text("views")',
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el.textContent;
      }
      return null;
    });

    if (text) {
      return parseViewCount(text);
    }

    // Alternative: parse from JSON data
    const jsonData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          return JSON.parse(script.textContent);
        } catch {
          // ignore
        }
      }
      return null;
    });

    if (jsonData && jsonData.interactionStatistic) {
      const count = jsonData.interactionStatistic.userInteractionCount;
      if (typeof count === 'number') return BigInt(count);
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

async function extractStat(page: any, statType: 'likes' | 'comments'): Promise<number> {
  try {
    const text = await page.evaluate((type: any) => {
      const xpath = `//*[contains(text(), "${type}") or contains(@aria-label, "${type}")]`;
      const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      return el ? el.textContent : null;
    }, statType);

    if (text) {
      const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : num;
    }
  } catch (error) {
    // Ignore
  }
  return 0;
}

async function extractMediaType(page: any): Promise<string> {
  try {
    const isVideo = await page.$('video');
    if (isVideo) return 'video';
    const isCarousel = await page.$('[data-testid="carousel"]');
    if (isCarousel) return 'carousel';
    return 'image';
  } catch {
    return 'unknown';
  }
}

async function extractPostDate(page: any): Promise<string | null> {
  try {
    const time = await page.$('time');
    if (time) {
      const datetime = await time.getAttribute('datetime');
      return datetime || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

function parseViewCount(text: string): bigint {
  const clean = text.toLowerCase().replace(/[^0-9km]/g, '').trim();
  let num = parseFloat(clean.replace('k', '').replace('m', ''));

  if (text.toLowerCase().includes('k')) {
    num *= 1000;
  }
  if (text.toLowerCase().includes('m')) {
    num *= 1000000;
  }

  return BigInt(Math.floor(num));
}
