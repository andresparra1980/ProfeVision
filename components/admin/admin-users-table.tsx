'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

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
  CheckCircle2,
  XCircle,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

  const copyEmail = useCallback((email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(t('emailCopied'));
  }, [t]);

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
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm truncate">
                {user.nombres} {user.apellidos}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  {user.email_confirmed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {user.email_confirmed ? t('emailConfirmed') : t('emailNotConfirmed')}
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => copyEmail(user.email)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  <span>{t('copyEmail')}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{user.email}</TooltipContent>
            </Tooltip>
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
  }, [t, formatDate, copyEmail]);

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

  return (
    <TooltipProvider>
      {/* Desktop View */}
      <Card className="hidden lg:block p-3">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground mb-2">
          <div
            className="flex-1 min-w-[200px] flex items-center cursor-pointer hover:text-foreground"
            onClick={() => onSort?.('name')}
          >
            {t('user')}
            <SortIcon field="name" currentField={sortField} order={sortOrder} />
          </div>
          <div className="w-24 text-center">{t('tier')}</div>
          {statsIcons.map(({ key, icon: Icon, color }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className="w-12 flex justify-center">
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t(key)}</TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-12 flex justify-center cursor-pointer"
                onClick={() => onSort?.('activity')}
              >
                <Activity className="h-4 w-4 text-emerald-500" />
                <SortIcon field="activity" currentField={sortField} order={sortOrder} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{t('activity')}</TooltipContent>
          </Tooltip>
          <div
            className="w-24 flex items-center cursor-pointer hover:text-foreground"
            onClick={() => onSort?.('created_at')}
          >
            {t('registered')}
            <SortIcon field="created_at" currentField={sortField} order={sortOrder} />
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {users.map((user, index) => {
            const activity = calculateActivity(user);
            const isEven = index % 2 === 0;
            return (
              <div
                key={user.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border',
                  isEven ? 'bg-muted/30' : 'bg-background'
                )}
              >
                {/* User name + email icon */}
                <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                  <span className="font-medium truncate">
                    {user.nombres} {user.apellidos}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {user.email_confirmed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {user.email_confirmed ? t('emailConfirmed') : t('emailNotConfirmed')}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => copyEmail(user.email)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{user.email}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Tier */}
                <div className="w-24 flex justify-center">
                  <Badge className={cn('text-xs', tierColors[user.subscription_tier] || tierColors.free)}>
                    {user.subscription_tier}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="w-12 text-center text-sm">{user.stats.entities}</div>
                <div className="w-12 text-center text-sm">{user.stats.subjects}</div>
                <div className="w-12 text-center text-sm">{user.stats.groups}</div>
                <div className="w-12 text-center text-sm">{user.stats.exams}</div>
                <div className="w-12 text-center text-sm">{user.stats.scans}</div>
                <div className="w-12 text-center text-sm font-semibold">{activity}</div>

                {/* Date */}
                <div className="w-24 text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </div>
              </div>
            );
          })}
        </div>
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
