'use client';

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
  // Combine trends data for the chart
  const chartData = stats.trends.users_by_month.map((item, index) => ({
    month: formatMonth(item.month),
    usuarios: item.count,
    examenes: stats.trends.exams_by_month[index]?.count ?? 0,
    escaneos: stats.trends.scans_by_month[index]?.count ?? 0,
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Tendencias (Últimos 6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                dataKey="usuarios"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Usuarios"
              />
              <Line
                type="monotone"
                dataKey="examenes"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Exámenes"
              />
              <Line
                type="monotone"
                dataKey="escaneos"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Escaneos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(monthNum) - 1]} ${year.slice(2)}`;
}
