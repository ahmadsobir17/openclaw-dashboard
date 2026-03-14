'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RunsTable } from '@/components/tables/RunsTable';

// Using Prisma type directly for consistency
import { MonitorRun as PrismaMonitorRun } from '@prisma/client';

// Align with Prisma type (uses null for optional fields, not undefined)
type MonitorRun = PrismaMonitorRun;

export default function RunsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [runs, setRuns] = useState<MonitorRun[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await fetch('/api/runs');
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs);
        }
      } catch (error) {
        console.error('Failed to fetch runs:', error);
      }
    };

    if (session) {
      fetchRuns();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
          Monitor Runs
        </h1>
      </div>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recent Runs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {runs.length > 0 ? (
            <RunsTable runs={runs} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No runs yet</p>
              <p className="text-sm mt-1 text-center max-w-md">
                The monitor will execute on schedule or you can trigger it manually from Settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
