'use client';

import { useState } from 'react';
import { useAdminUsers } from '@/lib/hooks/use-admin-users';
import { AdminUsersTable } from '@/components/admin/admin-users-table';
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { users, pagination, loading, error } = useAdminUsers({
    page,
    limit: 20,
    search,
    tier: tier === 'all' ? '' : tier,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <TitleCardWithDepth
          title="Usuarios"
          description="Lista de todos los usuarios registrados"
          icon={<Users className="h-6 w-6 text-blue-600" />}
        />
        <Link href="/dashboard/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por nombre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={tier || 'all'} onValueChange={(v) => { setTier(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="grandfathered">Grandfathered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <AdminUsersTable users={users} loading={loading} />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * pagination.limit) + 1}-{Math.min(page * pagination.limit, pagination.total)} de {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
