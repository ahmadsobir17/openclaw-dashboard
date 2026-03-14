'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PostsTable } from '@/components/tables/PostsTable';
import { Input } from '@/components/ui/Input';

interface Post {
  id: string;
  username: string;
  views: number; // Converted from bigint
  likes: number;
  comments: number;
  permalink: string;
  mediaType: string;
  postDate: Date;
  fetchedAt: Date;
  account: { username: string };
}

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [filterUsername, setFilterUsername] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });
        if (filterUsername) {
          params.append('username', filterUsername);
        }
        const res = await fetch(`/api/posts?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    if (session) {
      fetchPosts();
    }
  }, [session, offset, limit, filterUsername]);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Filter by username..."
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {posts.length} of {total} posts
      </div>

      <PostsTable posts={posts} />

      <div className="flex justify-between items-center">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {Math.floor(offset / limit) + 1}
        </span>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= total}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
