'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  BookOpen,
  Folders,
  FileText,
  ScanLine,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/lib/hooks/use-admin-users';

export type SortField = 'activity' | 'created_at' | 'name';
export type SortOrder = 'asc' | 'desc';

interface AdminUsersTableProps {
  users: AdminUser[];
  loading?: boolean;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (_field: SortField) => void;
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  plus: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  grandfathered: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

function calculateActivity(user: AdminUser): number {
  return user.stats.subjects + user.stats.groups + user.stats.exams + user.stats.scans;
}

function SortIcon({ field, currentField, order }: { field: SortField; currentField?: SortField; order?: SortOrder }) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
  }
  return order === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1" />
    : <ArrowDown className="h-3 w-3 ml-1" />;
}

// Stats icons with tooltips for compact desktop view
const statsIcons = [
  { key: 'entities', icon: Building2, color: 'text-orange-500' },
  { key: 'subjects', icon: BookOpen, color: 'text-blue-500' },
  { key: 'groups', icon: Folders, color: 'text-green-500' },
  { key: 'exams', icon: FileText, color: 'text-purple-500' },
  { key: 'scans', icon: ScanLine, color: 'text-pink-500' },
] as const;

export function AdminUsersTable({ users, loading, sortField, sortOrder, onSort }: AdminUsersTableProps) {
  const t = useTranslations('dashboard.admin.users.table');
  const locale = useLocale();

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [locale]);

  // User card for mobile view
  const UserCard = useCallback(({ user, index }: { user: AdminUser; index: number }) => {
    const activity = calculateActivity(user);
    const isEven = index % 2 === 0;

    return (
      <div
        className={cn(
          'p-3 rounded-lg space-y-2 border',
          isEven ? 'bg-muted/30' : 'bg-background'
        )}
      >
        {/* Header: Name + Tier */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              {user.nombres} {user.apellidos}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          </div>
          <Badge className={cn('text-xs shrink-0', tierColors[user.subscription_tier] || tierColors.free)}>
            {user.subscription_tier}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Building2 className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">{t('entities')}</span>
            </div>
            <div className="text-sm font-medium">{user.stats.entities}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">{t('subjects')}</span>
            </div>
            <div className="text-sm font-medium">{user.stats.subjects}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Folders className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('groups')}</span>
            </div>
            <div className="text-sm font-medium">{user.stats.groups}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-3 w-3 text-purple-500" />
              <span className="text-xs text-muted-foreground">{t('exams')}</span>
            </div>
            <div className="text-sm font-medium">{user.stats.exams}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <ScanLine className="h-3 w-3 text-pink-500" />
              <span className="text-xs text-muted-foreground">{t('scans')}</span>
            </div>
            <div className="text-sm font-medium">{user.stats.scans}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground">{t('activity')}</span>
            </div>
            <div className="text-sm font-semibold">{activity}</div>
          </div>
        </div>

        {/* Footer: Registered date */}
        <div className="text-xs text-muted-foreground pt-1 border-t">
          {t('registered')}: {formatDate(user.created_at)}
        </div>
      </div>
    );
  }, [t, formatDate]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        {t('noUsers')}
      </Card>
    );
  }

  const sortableHeader = (field: SortField, label: React.ReactNode, className?: string) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 select-none", className)}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon field={field} currentField={sortField} order={sortOrder} />
      </div>
    </TableHead>
  );

  return (
    <TooltipProvider>
      {/* Desktop Table View */}
      <Card className="overflow-hidden hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {sortableHeader('name', t('user'), 'min-w-[150px]')}
              <TableHead className="min-w-[180px]">{t('email')}</TableHead>
              <TableHead>{t('tier')}</TableHead>
              {/* Stats columns with icons */}
              {statsIcons.map(({ key, icon: Icon, color }) => (
                <TableHead key={key} className="text-center w-12 px-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <Icon className={cn('h-4 w-4', color)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t(key)}
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              ))}
              {sortableHeader(
                'activity',
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('activity')}
                  </TooltipContent>
                </Tooltip>,
                'text-center w-12 px-2'
              )}
              {sortableHeader('created_at', t('registered'), 'min-w-[100px]')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => {
              const activity = calculateActivity(user);
              return (
                <TableRow key={user.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <span className="truncate block max-w-[200px]">
                      {user.nombres} {user.apellidos}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="truncate block max-w-[200px]">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', tierColors[user.subscription_tier] || tierColors.free)}>
                      {user.subscription_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{user.stats.entities}</TableCell>
                  <TableCell className="text-center text-sm">{user.stats.subjects}</TableCell>
                  <TableCell className="text-center text-sm">{user.stats.groups}</TableCell>
                  <TableCell className="text-center text-sm">{user.stats.exams}</TableCell>
                  <TableCell className="text-center text-sm">{user.stats.scans}</TableCell>
                  <TableCell className="text-center font-semibold text-sm">
                    {activity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <Card className="lg:hidden p-3">
        <div className="space-y-2">
          {users.map((user, index) => (
            <UserCard key={user.id} user={user} index={index} />
          ))}
        </div>
      </Card>
    </TooltipProvider>
  );
}
