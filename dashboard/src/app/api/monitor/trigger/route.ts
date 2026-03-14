import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agentUrl = process.env.AGENT_URL || 'http://localhost:4000';
    const res = await fetch(`${agentUrl.replace(/\/$/, '')}/trigger`, {
      method: 'POST',
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to trigger monitor', triggered: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ triggered: true, message: data.message });
  } catch (error) {
    console.error('Error triggering monitor:', error);
    return NextResponse.json(
      { error: 'Failed to connect to agent', triggered: false },
      { status: 500 }
    );
  }
}
