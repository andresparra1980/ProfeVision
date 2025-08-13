import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pencil, 
  Users, 
  Calculator, 
  BookOpen, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Calendar 
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Database } from "@/lib/types/database";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & {
  materias: {
    id: string;
    nombre: string;
    entidades_educativas: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  estudiantes_count: { count: number } | number;
  entidad_id?: string;
  estado: 'activo' | 'archivado';
};

interface GroupCardProps {
  grupo: Grupo;
  onEditAction: (_grupo: Grupo) => void;
  onToggleArchiveAction: (_grupo: Grupo) => void;
  onDeleteAction: (_grupoId: string, _grupoNombre: string) => void;
}

export function GroupCard({ grupo, onEditAction, onToggleArchiveAction, onDeleteAction }: GroupCardProps) {
  const t = useTranslations('dashboard.groups.card');
  
  return (
    <Card key={grupo.id} className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              <span className="truncate block">{grupo.nombre}</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="text-sm">
                {t('subject')}: {grupo.materias?.nombre || t('notAssigned')}
              </div>
              <div className="text-sm">
                {t('entity')}: {grupo.materias?.entidades_educativas?.nombre || t('notAssigned')}
              </div>
              {grupo.periodo_escolar && (
                <div className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {t('period')}: {grupo.periodo_escolar}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditAction(grupo)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('editGroup')}
              </DropdownMenuItem>
              <Link href={`/dashboard/groups/${grupo.id}/students`} className="w-full">
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  {t('manageStudents')}
                </DropdownMenuItem>
              </Link>
              <Link href={`/dashboard/groups/${grupo.id}/grades`} className="w-full">
                <DropdownMenuItem>
                  <Calculator className="h-4 w-4 mr-2" />
                  {t('gradeTable')}
                </DropdownMenuItem>
              </Link>
              <Link href={`/dashboard/groups/${grupo.id}/grading-scheme`} className="w-full">
                <DropdownMenuItem>
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t('gradingScheme')}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleArchiveAction(grupo)}>
                {grupo.estado === 'activo' ? (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    {t('archive')}
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    {t('activate')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteAction(grupo.id, grupo.nombre)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            <span>
              {typeof grupo.estudiantes_count === 'number' 
                ? grupo.estudiantes_count 
                : grupo.estudiantes_count?.count || 0} {t('students')}
            </span>
          </div>
          {grupo.descripcion && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {grupo.descripcion}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}