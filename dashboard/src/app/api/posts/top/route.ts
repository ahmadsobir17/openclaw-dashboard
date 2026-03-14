import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { views: 'desc' },
      take: 10,
      include: { account: true },
    });

    // Convert bigint views to number for JSON serialization
    const serializablePosts = posts.map(post => ({
      ...post,
      views: Number(post.views),
      likes: post.likes,
      comments: post.comments,
    }));

    return NextResponse.json({ posts: serializablePosts });
  } catch (error) {
    console.error('Error fetching top posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top posts' },
      { status: 500 }
    );
  }
}
