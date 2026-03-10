import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-muted/35 shadow-[0_26px_58px_-36px_rgba(15,23,42,0.42)] dark:border-border/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-xl">{materia.nombre}</CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => onEdit(materia)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t('edit')}</span>
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
                    className="rounded-xl"
                    onClick={() => onDelete(materia)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('delete')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('delete')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {materia.entidades_educativas && (
          <div className="flex items-center text-sm text-muted-foreground">
            <School className="mr-1 h-3 w-3" />
            <span>{materia.entidades_educativas.nombre}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="border-t border-border/35 bg-muted/25 pt-4 dark:border-border/45 dark:bg-muted/15">
        {materia.descripcion && (
          <p className="text-sm text-muted-foreground">{materia.descripcion}</p>
        )}
      </CardContent>
    </Card>
  );
}
