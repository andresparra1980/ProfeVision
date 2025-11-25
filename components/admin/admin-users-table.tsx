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
import type { AdminUser } from '@/lib/hooks/use-admin-users';

interface AdminUsersTableProps {
  users: AdminUser[];
  loading?: boolean;
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  plus: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  grandfathered: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

export function AdminUsersTable({ users, loading }: AdminUsersTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se encontraron usuarios
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead className="text-center">Entidades</TableHead>
            <TableHead className="text-center">Materias</TableHead>
            <TableHead className="text-center">Grupos</TableHead>
            <TableHead className="text-center">Exámenes</TableHead>
            <TableHead className="text-center">Escaneos</TableHead>
            <TableHead>Registrado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.nombres} {user.apellidos}
              </TableCell>
              <TableCell className="text-muted-foreground">
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
              <TableCell className="text-muted-foreground">
                {formatDate(user.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
