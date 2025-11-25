'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { AdminStats } from '@/lib/hooks/use-admin-stats';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AdminTrendsChartProps {
  stats: AdminStats;
}

export function AdminTrendsChart({ stats }: AdminTrendsChartProps) {
  const t = useTranslations('dashboard.admin.trends');
  const locale = useLocale();

  const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months = locale === 'es' ? monthsES : monthsEN;

  const formatMonth = (month: string): string => {
    const [year, monthNum] = month.split('-');
    return `${months[parseInt(monthNum) - 1]} ${year.slice(2)}`;
  };

  const chartData = stats.trends.users_by_month.map((item, index) => ({
    month: formatMonth(item.month),
    users: item.count,
    exams: stats.trends.exams_by_month[index]?.count ?? 0,
    scans: stats.trends.scans_by_month[index]?.count ?? 0,
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={t('users')}
              />
              <Line
                type="monotone"
                dataKey="exams"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={t('exams')}
              />
              <Line
                type="monotone"
                dataKey="scans"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4 }}
                name={t('scans')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
