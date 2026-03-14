import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Convert bigint fields in recentRuns
    const serializableRuns = recentRuns.map(run => ({
      ...run,
      topViews: run.topViews ? Number(run.topViews) : null,
    }));

    return NextResponse.json({
      totalPosts,
      totalViews: totalViews._sum.views ? Number(totalViews._sum.views) : 0,
      totalAccounts,
      activeAccounts,
      recentRuns: serializableRuns,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
