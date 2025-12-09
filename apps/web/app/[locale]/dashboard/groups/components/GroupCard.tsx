import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
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
import { useRouter } from "@/i18n/navigation";
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

function GroupCardHeader({ grupo, t }: { grupo: Grupo; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex-1 text-left space-y-2">
      <CardTitle className="truncate text-base leading-tight">
        {grupo.nombre}
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
      <div className="flex items-center text-sm text-muted-foreground pt-1">
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
  );
}

interface GroupCardActionsProps {
  grupo: Grupo;
  onEditAction: (_grupo: Grupo) => void;
  onToggleArchiveAction: (_grupo: Grupo) => void;
  onDeleteAction: (_grupoId: string, _grupoNombre: string) => void;
}

function GroupCardActions({ grupo, onEditAction, onToggleArchiveAction, onDeleteAction }: GroupCardActionsProps) {
  const t = useTranslations('dashboard.groups.card');
  const router = useRouter();

  return (
    <div className="space-y-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => onEditAction(grupo)}
            >
              <Pencil className="mr-2 h-4 w-4" /> {t('editGroup')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.editGroup')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => router.push({
                pathname: '/dashboard/groups/[id]/students',
                params: { id: grupo.id },
              })}
            >
              <Users className="mr-2 h-4 w-4" /> {t('manageStudents')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.manageStudents')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => router.push({
                pathname: '/dashboard/groups/[id]/grades',
                params: { id: grupo.id },
              })}
            >
              <Calculator className="mr-2 h-4 w-4" /> {t('gradeTable')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.gradeTable')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => router.push({
                pathname: '/dashboard/groups/[id]/grading-scheme',
                params: { id: grupo.id },
              })}
            >
              <BookOpen className="mr-2 h-4 w-4" /> {t('gradingScheme')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.gradingScheme')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => onToggleArchiveAction(grupo)}
            >
              {grupo.estado === 'activo' ? (
                <>
                  <Archive className="mr-2 h-4 w-4" /> {t('archive')}
                </>
              ) : (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" /> {t('activate')}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{grupo.estado === 'activo' ? t('tooltips.archive') : t('tooltips.activate')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto py-2 px-2 text-red-500 dark:text-red-400"
        onClick={() => onDeleteAction(grupo.id, grupo.nombre)}
      >
        <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
      </Button>
    </div>
  );
}

export function GroupCard({ grupo, onEditAction, onToggleArchiveAction, onDeleteAction }: GroupCardProps) {
  const t = useTranslations('dashboard.groups.card');
  
  return (
    <Card key={grupo.id} className="flex flex-col">
      <CardHeader className="pb-2">
        <GroupCardHeader grupo={grupo} t={t} />
      </CardHeader>
      <CardContent className="flex-1 border-t bg-muted/20 pt-4">
        <GroupCardActions 
          grupo={grupo}
          onEditAction={onEditAction}
          onToggleArchiveAction={onToggleArchiveAction}
          onDeleteAction={onDeleteAction}
        />
      </CardContent>
    </Card>
  );
}