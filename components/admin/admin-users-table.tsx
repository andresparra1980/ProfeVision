'use client';

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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  }
  return order === 'asc'
    ? <ArrowUp className="h-4 w-4 ml-1" />
    : <ArrowDown className="h-4 w-4 ml-1" />;
}

export function AdminUsersTable({ users, loading, sortField, sortOrder, onSort }: AdminUsersTableProps) {
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
        No se encontraron usuarios
      </Card>
    );
  }

  const sortableHeader = (field: SortField, label: string, className?: string) => (
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
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {sortableHeader('name', 'Usuario')}
            <TableHead>Email</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead className="text-center">Entidades</TableHead>
            <TableHead className="text-center">Materias</TableHead>
            <TableHead className="text-center">Grupos</TableHead>
            <TableHead className="text-center">Exámenes</TableHead>
            <TableHead className="text-center">Escaneos</TableHead>
            {sortableHeader('activity', 'Actividad', 'text-center')}
            {sortableHeader('created_at', 'Registrado')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const activity = calculateActivity(user);
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.nombres} {user.apellidos}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge className={tierColors[user.subscription_tier] || tierColors.free}>
                    {user.subscription_tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{user.stats.entities}</TableCell>
                <TableCell className="text-center">{user.stats.subjects}</TableCell>
                <TableCell className="text-center">{user.stats.groups}</TableCell>
                <TableCell className="text-center">{user.stats.exams}</TableCell>
                <TableCell className="text-center">{user.stats.scans}</TableCell>
                <TableCell className="text-center font-semibold">
                  {activity}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(user.created_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
