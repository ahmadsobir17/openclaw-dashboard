'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MonitorRun } from '@prisma/client';

interface ViewsTrendChartProps {
  runs: MonitorRun[];
}

export function ViewsTrendChart({ runs }: ViewsTrendChartProps) {
  const data = runs
    .slice()
    .reverse()
    .map((run) => ({
      date: new Date(run.runAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Number(run.topViews || 0),
      posts: run.postsFetched,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          className="dark:stroke-gray-400"
        />
        <YAxis
          tickFormatter={(v) => v.toLocaleString()}
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
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorViews)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
