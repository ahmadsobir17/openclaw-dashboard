import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 text-white',
  green: 'from-green-500 to-green-600 text-white',
  purple: 'from-purple-500 to-purple-600 text-white',
  orange: 'from-orange-500 to-orange-600 text-white',
  red: 'from-red-500 to-red-600 text-white',
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatsCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-700/50 bg-[#1e2433] shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-br shadow-sm',
              colorClasses[color]
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
