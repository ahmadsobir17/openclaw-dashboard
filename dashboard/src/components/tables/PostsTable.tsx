'use client';

import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  username: string;
  views: number; // Using number since JSON converts bigint to number
  likes: number;
  comments: number;
  permalink: string;
  mediaType: string;
  postDate: Date;
  fetchedAt: Date;
  account: { username: string };
}

interface PostsTableProps {
  posts: Post[];
}

export function PostsTable({ posts }: PostsTableProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toLocaleString();
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getMediaTypeBadge = (type: string) => {
    const styles = {
      VIDEO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      IMAGE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CAROUSEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      REEL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    const defaultStyle = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    return styles[type as keyof typeof styles] || defaultStyle;
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-lg font-medium">No posts found</p>
          <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Account
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Views
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Likes
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Comments
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Link
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {posts.map((post, index) => (
              <tr
                key={post.id}
                className={cn(
                  'transition-colors duration-150 hover:bg-blue-50 dark:hover:bg-gray-800',
                  index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50'
                )}
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    @{post.account.username}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-medium text-gray-900 dark:text-white">
                    {formatViews(post.views)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {post.likes.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {post.comments.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                      getMediaTypeBadge(post.mediaType)
                    )}
                  >
                    {post.mediaType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(post.postDate)}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <span className="text-sm font-medium">View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
