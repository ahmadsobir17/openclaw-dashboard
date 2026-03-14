import prisma from './prisma.js';

export async function upsertPost(postData: {
  id: string;
  username: string;
  mediaType: string;
  views: bigint;
  likes: number;
  comments: number;
  permalink: string;
  postDate: Date;
}) {
  return prisma.post.upsert({
    where: { id: postData.id },
    update: postData,
    create: postData,
  });
}

export async function upsertPosts(posts: any[]) {
  const results = [];
  for (const post of posts) {
    const result = await upsertPost(post);
    results.push(result);
  }
  return results;
}

export async function logMonitorRun(data: {
  accountsCount: number;
  postsFetched: number;
  topPostUrl?: string;
  topViews?: bigint;
  status: string;
  errorMessage?: string;
  durationMs: number;
}) {
  return prisma.monitorRun.create({ data });
}

export async function getMonitorRuns(limit: number = 50) {
  return prisma.monitorRun.findMany({
    orderBy: { runAt: 'desc' },
    take: limit,
  });
}

export async function getActiveAccounts() {
  return prisma.account.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAllAccounts() {
  return prisma.account.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export async function createAccount(username: string) {
  return prisma.account.create({
    data: {
      id: `${username}-${Date.now()}`,
      username,
      isActive: true,
    },
  });
}

export async function deleteAccount(username: string) {
  return prisma.account.delete({ where: { username } });
}

export async function toggleAccountStatus(username: string, isActive: boolean) {
  return prisma.account.update({
    where: { username },
    data: { isActive },
  });
}

export async function getPosts(filters: {
  username?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { username, limit = 50, offset = 0 } = filters;

  const where = username ? { username } : undefined;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { views: 'desc' },
      take: limit,
      skip: offset,
      include: { account: true },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
}

export async function getTopPosts(limit: number = 10) {
  return prisma.post.findMany({
    orderBy: { views: 'desc' },
    take: limit,
    include: { account: true },
  });
}

export async function getStats() {
  const [totalPosts, totalViews, totalAccounts, activeAccounts, recentRuns] = await Promise.all([
    prisma.post.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.account.count(),
    prisma.account.count({ where: { isActive: true } }),
    prisma.monitorRun.findMany({
      orderBy: { runAt: 'desc' },
      take: 7,
    }),
  ]);

  return {
    totalPosts,
    totalViews: totalViews._sum.views || 0n,
    totalAccounts,
    activeAccounts,
    recentRuns,
  };
}
