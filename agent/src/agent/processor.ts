import logger from '../utils/logger.js';
import { PostData } from './scraper.js';

export interface ProcessedResult {
  posts: PostData[];
  totalAccounts: number;
  totalPosts: number;
}

export function processScrapeResults(
  results: Array<{ username: string; posts: PostData[]; error?: string }>,
  topN: number = 10
): ProcessedResult {
  const allPosts: PostData[] = [];

  for (const result of results) {
    if (result.error) {
      logger.warn(`Skipping @${result.username} due to error: ${result.error}`);
      continue;
    }
    allPosts.push(...result.posts);
  }

  // Deduplicate by ID
  const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());

  // Sort by views descending
  uniquePosts.sort((a, b) => Number(b.views - a.views));

  // Return top-N
  const topPosts = uniquePosts.slice(0, topN);

  logger.info(`Processed: ${uniquePosts.length} unique posts, returning top ${topPosts.length}`);

  return {
    posts: topPosts,
    totalAccounts: results.length,
    totalPosts: uniquePosts.length,
  };
}
