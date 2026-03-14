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
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        id: `${username}-${Date.now()}`,
        username,
        isActive: true,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating account:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
