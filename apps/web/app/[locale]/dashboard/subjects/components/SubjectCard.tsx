import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  dashboardCardClassName,
  dashboardCardSectionClassName,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, School } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Database } from "@/lib/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas?: {
    id: string;
    nombre: string;
  };
};

interface SubjectCardProps {
  materia: Materia;
  onEdit: (_: Materia) => void;
  onDelete: (_: Materia) => void;
}

export function SubjectCard({ materia, onEdit, onDelete }: SubjectCardProps) {
  const t = useTranslations('dashboard.common');
  const tSubjects = useTranslations('dashboard.subjects');
  const hasDescription = Boolean(materia.descripcion);

  return (
    <Card className={dashboardCardClassName + " flex h-full flex-col"}>
      <CardHeader className="min-h-[9.5rem] justify-between space-y-3 pb-4">
        <div className="min-w-0 space-y-1">
          <CardDescription className="text-xs uppercase tracking-[0.18em]">
            {tSubjects('subjectLabel')}
          </CardDescription>
          <CardTitle className="text-xl leading-tight break-words">{materia.nombre}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={dashboardCardSectionClassName + " flex min-h-[8rem] flex-1 flex-col justify-between space-y-4 pt-4"}>
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {tSubjects('form.institutionLabel')}
          </p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <School className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-relaxed">
              {materia.entidades_educativas?.nombre || tSubjects('form.institutionNone')}
            </span>
          </div>
        </div>

        {hasDescription && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {tSubjects('form.descriptionLabel')}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {materia.descripcion}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="min-h-[4.75rem] items-center gap-3 border-t border-border/15 px-4 pt-4 dark:border-white/10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-full w-1/2 justify-center rounded-xl px-4"
                onClick={() => onEdit(materia)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t('edit')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('edit')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-full w-1/2 justify-center rounded-xl px-4 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                onClick={() => onDelete(materia)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('delete')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('delete')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
