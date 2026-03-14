'use client';

import { MonitorRun } from '@prisma/client';

interface RunsTableProps {
  runs: MonitorRun[];
}

export function RunsTable({ runs }: RunsTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Run At
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Accounts
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Posts Fetched
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Error
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3">{formatDate(run.runAt)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(run.status)}`}>
                  {run.status}
                </span>
              </td>
              <td className="px-4 py-3">{run.accountsCount}</td>
              <td className="px-4 py-3">{run.postsFetched}</td>
              <td className="px-4 py-3">{run.durationMs}ms</td>
              <td className="px-4 py-3 max-w-xs truncate text-red-600">
                {run.errorMessage || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
