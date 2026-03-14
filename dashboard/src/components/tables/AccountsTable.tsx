'use client';

import { Account } from '@prisma/client';

interface AccountsTableProps {
  accounts: (Account & { _count?: { posts: number } })[];
  onDelete: (username: string) => Promise<void>;
  onToggle: (username: string, isActive: boolean) => Promise<void>;
}

export function AccountsTable({ accounts, onDelete, onToggle }: AccountsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Username
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Posts Tracked
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Added
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">@{account.username}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    account.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {account.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">{account._count?.posts || 0}</td>
              <td className="px-4 py-3">
                {new Date(account.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 space-x-2">
                <button
                  onClick={() => onToggle(account.username, !account.isActive)}
                  className="px-3 py-1 text-xs border rounded hover:bg-secondary"
                >
                  {account.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDelete(account.username)}
                  className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
