import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';
import prisma from '@/lib/prisma';


export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where = username ? { username } : undefined;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { views: 'desc' },
        include: { account: true },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ]);

    // Convert bigint views to number for JSON serialization
    const serializablePosts = posts.map(post => ({
      ...post,
      views: Number(post.views),
      likes: post.likes,
      comments: post.comments,
    }));

    return NextResponse.json({ posts: serializablePosts, total, limit, offset });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
