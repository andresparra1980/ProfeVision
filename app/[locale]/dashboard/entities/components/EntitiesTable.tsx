"use client";

import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EducationalEntity {
  id: string;
  nombre: string;
  tipo: string | null;
}

interface EntitiesTableProps {
  entities: EducationalEntity[];
  searchQuery: string;
}

export function EntitiesTable({ entities, searchQuery }: EntitiesTableProps) {
  const t = useTranslations('dashboard.entities');

  // Filter entities based on search query
  const filteredEntities = entities.filter((entity) =>
    entity.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entity.tipo && entity.tipo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredEntities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{t('noResultsMessage')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead>{t('table.type')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell className="font-medium">{entity.nombre}</TableCell>
              <TableCell>{entity.tipo || t('table.notSpecified')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
