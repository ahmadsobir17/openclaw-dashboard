'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Play, Settings, Cookie, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cronSchedule, setCronSchedule] = useState('0 8 * * *');
  const [topN, setTopN] = useState('10');
  const [maxPosts, setMaxPosts] = useState('50');
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleTrigger = async () => {
    setTriggering(true);
    setMessage('');
    try {
      const res = await fetch('/api/monitor/trigger', { method: 'POST' });
      if (res.ok) {
        setMessage('Monitor triggered successfully!');
      } else {
        setMessage('Failed to trigger monitor');
      }
    } catch (error) {
      setMessage('Error triggering monitor');
    } finally {
      setTriggering(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
          Settings
        </h1>
      </div>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Play className="h-5 w-5 text-green-600" />
            <span>Manual Trigger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Run the Instagram scraper immediately instead of waiting for the next scheduled run.
          </p>
          <Button
            onClick={handleTrigger}
            disabled={triggering}
            className="bg-green-600 hover:bg-green-700"
          >
            {triggering ? 'Triggering...' : 'Run Monitor Now'}
          </Button>
          {message && (
            <p className={`mt-2 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Settings className="h-5 w-5 text-amber-600" />
            <span>Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Cron Schedule
              </label>
              <Input
                value={cronSchedule}
                onChange={(e) => setCronSchedule(e.target.value)}
                placeholder="0 8 * * *"
                disabled
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Edit CRON_SCHEDULE in docker-compose.yml and restart agent.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Top N Posts
              </label>
              <Input
                value={topN}
                onChange={(e) => setTopN(e.target.value)}
                placeholder="10"
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Edit TOP_N in .env and restart agent.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Max Posts Per Account
              </label>
              <Input
                value={maxPosts}
                onChange={(e) => setMaxPosts(e.target.value)}
                placeholder="50"
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Edit MAX_POSTS in .env and restart agent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Cookie className="h-5 w-5 text-orange-600" />
            <span>Cookie Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Instagram cookies are validated on every run. If cookies expire, you&apos;ll receive a Telegram alert.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Update cookies by replacing <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">config/instagram_cookies.json</code> and restarting the agent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
