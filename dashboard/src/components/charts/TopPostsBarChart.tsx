'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Post {
  id: string;
  username: string;
  views: bigint;
  likes: number;
}

interface TopPostsBarChartProps {
  posts: Post[];
}

export function TopPostsBarChart({ posts }: TopPostsBarChartProps) {
  const data = posts.slice(0, 10).map((post) => ({
    name: `@${post.username}`,
    views: Number(post.views),
  })).sort((a, b) => b.views - a.views);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => v.toLocaleString()}
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          className="dark:stroke-gray-400"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          className="dark:stroke-gray-400"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [value.toLocaleString(), 'Views']}
          cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
        />
        <Bar
          dataKey="views"
          radius={[0, 8, 8, 0]}
          fill="url(#barGradient)"
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
