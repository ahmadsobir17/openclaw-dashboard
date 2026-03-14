'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AccountsTable } from '@/components/tables/AccountsTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Account {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  _count?: { posts: number };
}

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };

    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      });

      if (res.ok) {
        setNewUsername('');
        // Refresh accounts
        const data = await res.json();
        setAccounts((prev) => [...prev, data.account]);
      } else {
        alert('Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete @${username}?`)) return;

    try {
      const res = await fetch(`/api/accounts/${username}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.username !== username));
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleToggle = async (username: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/accounts/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.username === username ? { ...a, isActive } : a))
        );
      }
    } catch (error) {
      console.error('Error toggling account:', error);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
          Accounts
        </h1>
      </div>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <Input
              placeholder="instagram_username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Add Account
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Tracked Accounts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accounts.length > 0 ? (
            <AccountsTable
              accounts={accounts}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No accounts yet</p>
              <p className="text-sm mt-1">Add your first Instagram account to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
