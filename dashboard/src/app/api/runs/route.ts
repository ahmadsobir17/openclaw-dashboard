import { NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: any) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const runs = await prisma.monitorRun.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,
    });

    // Convert bigint to number for JSON serialization
    const serializableRuns = runs.map(run => ({
      ...run,
      topViews: run.topViews ? Number(run.topViews) : null,
    }));

    return NextResponse.json({ runs: serializableRuns });
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}
