import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import {
  dashboardCardClassName,
  dashboardCardSectionClassName,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Trash2,
  Printer,
  Users,
  Eye,
  WandSparkles,
  FileText, // Kept for empty state
  Link,
  Calendar,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import SimilarExamModal from "./SimilarExamModal";
import SimilarExamMetadataDialog, { SimilarExamMeta } from "./SimilarExamMetadataDialog";
import EditableExamTitle from "./EditableExamTitle";

import { ExamsPageSkeleton } from "./ExamsPageSkeleton";

// Reusable components
interface ExamCardHeaderProps {
  exam: Exam;
  t: ReturnType<typeof useTranslations>;
  onTitleSave: (_examId: string, _newTitle: string) => Promise<void>;
}

function ExamCardHeader({ exam, t, onTitleSave }: ExamCardHeaderProps) {
  return (
    <div className="flex-1 text-left space-y-2">
      {/* Title */}
      <div className="font-bold text-base leading-tight text-card-foreground">
        <EditableExamTitle
          examId={exam.id}
          initialTitle={exam.titulo}
          onSave={onTitleSave}
        />
      </div>

      {/* Subject */}
      <p className={`font-mono`}>
        {exam.materias?.nombre || "Sin materia"}
      </p>

      {/* Group pills - below title and subject */}
      {exam.examen_grupo && exam.examen_grupo.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-start">
          {exam.examen_grupo.map((asignacion: Exam["examen_grupo"][number]) => (
            <span
              key={asignacion.grupo.id}
            className="inline-flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-white shadow-sm"
            >
              {asignacion.grupo.nombre}
            </span>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="h-2" />

      {/* Bottom row: Status left, Date right */}
      <div className="flex justify-between items-center">
        <div>{getStatusBadge(exam.estado, t, isExamArchived(exam))}</div>
        <span className="text-xs text-muted-foreground flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(exam.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

interface ExamCardContentProps {
  exam: Exam;
  router: ReturnType<typeof useRouter>;
  onOpenDeleteDialog: (_examId: string) => void;
  onStartSimilar: (_examId: string) => void;
  onPublish: (_examId: string) => void;
  examsWithGrades: Set<string>;
}

function ExamCardContent({
  exam,
  router,
  onOpenDeleteDialog,
  onStartSimilar,
  onPublish,
  examsWithGrades,
}: ExamCardContentProps) {
  const t = useTranslations('dashboard.exams');

  return (
    <div className="space-y-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-xl px-2 py-2"
              onClick={() => {
                router.push({
                  pathname: '/dashboard/exams/[id]/edit',
                  params: { id: exam.id },
                });
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> {t('actions.edit')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{exam.estado === "borrador" ? t('tooltips.editDraft') : t('tooltips.editPublished')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {exam.estado === "borrador" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start rounded-xl px-2 py-2 text-primary"
                onClick={() => onPublish(exam.id)}
              >
                <Send className="mr-2 h-4 w-4" /> {t('actions.publish')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{t('tooltips.publishWarning')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-xl px-2 py-2 text-purple-600 dark:text-purple-400"
              onClick={() => onStartSimilar(exam.id)}
            >
              <WandSparkles className="mr-2 h-4 w-4" /> {t('actions.createSimilarExam', { defaultValue: 'Create similar exam' })}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.createSimilarExam')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start rounded-xl px-2 py-2"
                disabled={exam.estado !== 'publicado' || !exam.examen_grupo || exam.examen_grupo.length === 0}
                onClick={() => {
                  router.push({
                    pathname: '/dashboard/exams/[id]/export',
                    params: { id: exam.id },
                  });
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> {t('actions.exportAndPrint')}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{(exam.estado !== 'publicado' || !exam.examen_grupo || exam.examen_grupo.length === 0)
              ? t('tooltips.exportRequiresPublishedAndGroup')
              : t('tooltips.exportAndPrint')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-xl px-2 py-2"
              onClick={() => {
                router.push({
                  pathname: '/dashboard/exams/[id]/assign',
                  params: { id: exam.id },
                });
              }}
            >
              <Users className="mr-2 h-4 w-4" /> {t('actions.assignGroups')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.assignGroups')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-xl px-2 py-2"
              onClick={() => {
                router.push({
                  pathname: '/dashboard/exams/[id]/link-grade-component',
                  params: { id: exam.id },
                });
              }}
            >
              <Link className="mr-2 h-4 w-4" /> {t('actions.linkComponentFull')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t('tooltips.linkComponent')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {(exam.estado === "borrador" || (exam.estado === "publicado" && !examsWithGrades.has(exam.id))) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto w-full justify-start rounded-xl px-2 py-2 text-red-500 dark:text-red-400"
          onClick={() => onOpenDeleteDialog(exam.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> {t('actions.delete')}
        </Button>
      )}
      {exam.estado === "publicado" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full justify-start rounded-xl px-2 py-2 font-semibold text-primary"
                  disabled={!examsWithGrades.has(exam.id)}
                  onClick={() => {
                    router.push({
                      pathname: '/dashboard/exams/[id]/results',
                      params: { id: exam.id },
                    });
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> {t('actions.viewResults')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{examsWithGrades.has(exam.id) ? t('tooltips.viewResults') : t('tooltips.noResults', { defaultValue: 'No hay resultados disponibles para este examen aún.' })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Interface para los exámenes (idealmente, importar desde un archivo de tipos compartido)
interface Exam {
  id: string;
  titulo: string;
  descripcion?: string | null;
  estado: string;
  duracion_minutos: number;
  created_at: string;
  materias: {
    nombre: string;
  };
  examen_grupo: Array<{
    grupo: {
      id: string;
      nombre: string;
      estado?: string; // 'activo' | 'archivado'
    };
    fecha_aplicacion: string;
    estado: string;
  }>;
}

interface ExamsTableMobileProps {
  filteredExams: Exam[];
  loading: boolean;
  onOpenDeleteDialog: (_examId: string) => void;
  setShowImportDialog: (_show: boolean) => void;
  handleCreateExam: () => void;
  searchQuery: string;
  setSearchQuery: (_query: string) => void;
  showArchivedGroups: boolean;
  setShowArchivedGroups: (_show: boolean) => void;
  examsWithGrades: Set<string>;
}

// Helper to check if exam belongs to archived group(s)
const isExamArchived = (exam: Exam): boolean => {
  if (!exam.examen_grupo || exam.examen_grupo.length === 0) return false;
  return exam.examen_grupo.every((eg) => eg.grupo?.estado === 'archivado');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatusBadge = (status: string, t: any, archived?: boolean) => {
  const baseClass = "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]";

  // If archived, show archived badge regardless of status
  if (archived) {
    return (
      <span className={`${baseClass} border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}>
        {t('status.archived')}
      </span>
    );
  }

  switch (status) {
    case "borrador":
      return (
        <span className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-900/30 dark:text-amber-300`}>
          {t('status.draft')}
        </span>
      );
    case "publicado":
      return (
        <span className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-900/30 dark:text-emerald-300`}>
          {t('status.published')}
        </span>
      );
    case "cerrado":
      return (
        <span className={`${baseClass} border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-900/30 dark:text-rose-300`}>
          {t('status.completed')}
        </span>
      );
    default:
      return (
        <span className={`${baseClass} border-border bg-muted text-muted-foreground`}>
          {status}
        </span>
      );
  }
};

const getStatusBorderStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case "borrador":
      return {
        borderColor: `color-mix(in srgb, var(--accent) 50%, transparent)`,
      };
    case "publicado":
      return {
        borderColor: `color-mix(in srgb, var(--primary) 50%, transparent)`,
      };
    case "cerrado":
      return {
        borderColor: `color-mix(in srgb, var(--destructive) 50%, transparent)`,
      };
    default:
      return {
        borderColor: `color-mix(in srgb, var(--muted) 50%, transparent)`,
      };
  }
};

export default function ExamsTableMobile({
  filteredExams,
  loading,
  onOpenDeleteDialog,
  setShowImportDialog: _setShowImportDialog,
  handleCreateExam: _handleCreateExam,
  searchQuery,
  setSearchQuery,
  showArchivedGroups,
  setShowArchivedGroups,
  examsWithGrades,
}: ExamsTableMobileProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.exams');

  // Hook to detect if we're in multi-column layout
  const [isMultiColumn, setIsMultiColumn] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>();
  const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [pendingExamId, setPendingExamId] = useState<string | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMultiColumn(window.innerWidth >= 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleTitleSave = async (examId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("examenes")
        .update({ titulo: newTitle })
        .eq("id", examId);

      if (error) throw error;

      // Trigger a refresh or update local state if needed
      window.location.reload();
    } catch (error) {
      console.error("Error updating exam title:", error);
      throw error;
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('messages.unauthorized'));
        return;
      }

      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ estado: 'publicado' }),
      });

      if (!response.ok) {
        throw new Error('Error publishing exam');
      }

      toast.success(t('edit.messages.examPublished'));
      window.location.reload();
    } catch (error) {
      console.error("Error publishing exam:", error);
      toast.error(t('edit.messages.publishError'));
    }
  };

  const startSimilarJob = async (examId: string, meta?: SimilarExamMeta) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch(`/api/exams/similar/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sourceExamId: examId, meta }),
      });
      if (!res.ok) {
        throw new Error(`Failed to start job: ${res.status}`);
      }
      const json = (await res.json()) as { jobId: string };
      setJobId(json.jobId);
      // Build SSE URL with token for ownership validation on server
      const url = new URL(`/api/exams/similar/stream`, window.location.origin);
      url.searchParams.set("jobId", json.jobId);
      if (token) url.searchParams.set("token", token);
      setStreamUrl(url.toString());
      setSimilarOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setPendingExamId(null);
    }
  };
  // removed unused handleStartSimilar

  return (
    <div className="px-2 md:px-0 py-4 space-y-4">
      <Input
        placeholder={t('table.search')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-sm bg-card dark:bg-card placeholder:text-muted-foreground"
      />

      {/* Checkbox for showing exams from archived groups */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-archived-groups"
          checked={showArchivedGroups}
          onCheckedChange={(checked) => setShowArchivedGroups(Boolean(checked))}
          className="rounded-md border-border"
        />
        <label htmlFor="show-archived-groups" className="text-sm text-muted-foreground">
          {t('filters.showArchivedGroups')}
        </label>
      </div>

      {loading ? (
        <ExamsPageSkeleton />
      ) : filteredExams.length === 0 ? (
        <div className="p-4 text-center space-y-4 mt-8">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/50" />
          {searchQuery ? (
            <div>
              <p className="text-xl font-semibold">
                {t('messages.noResults')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('messages.tryDifferentSearch')}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-semibold">{t('messages.noExams')}</p>
              <p className="text-sm text-muted-foreground">
                {t('messages.noExamsDescription')}
              </p>
            </div>
          )}
        </div>
      ) : isMultiColumn ? (
        // Multi-column layout: always expanded
        <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start auto-rows-min">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={dashboardCardClassName + " h-fit border-2"}
              style={getStatusBorderStyle(exam.estado)}
            >
              <div className="p-4">
                <ExamCardHeader exam={exam} t={t} onTitleSave={handleTitleSave} />
              </div>
              <div className={dashboardCardSectionClassName + " p-4"}>
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
                  onStartSimilar={startSimilarJob}
                  onPublish={handlePublish}
                  examsWithGrades={examsWithGrades}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single column layout: collapsible accordion (first item expanded by default)
        <Accordion type="single" collapsible className="w-full space-y-2" defaultValue={filteredExams[0]?.id}>
          {filteredExams.map((exam) => (
            <AccordionItem
              value={exam.id}
              key={exam.id}
              className={dashboardCardClassName + " h-fit"}
              style={getStatusBorderStyle(exam.estado)}
            >
              <AccordionTrigger className="p-4 hover:no-underline">
                <ExamCardHeader exam={exam} t={t} onTitleSave={handleTitleSave} />
              </AccordionTrigger>
              <AccordionContent className={dashboardCardSectionClassName + " p-4"}>
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
                  onStartSimilar={startSimilarJob}
                  onPublish={handlePublish}
                  examsWithGrades={examsWithGrades}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <SimilarExamModal
        open={similarOpen}
        onOpenChange={setSimilarOpen}
        jobId={jobId}
        streamUrl={streamUrl}
        onCompleted={() => {
          // Refresh exams after completion to show the new draft (when backend is fully wired)
          // no-op here; parent page fetches list periodically or on demand
        }}
        onFailed={() => {
          // Could show a toast here
        }}
      />

      <SimilarExamMetadataDialog
        open={metaDialogOpen}
        onOpenChange={setMetaDialogOpen}
        onConfirm={async (meta) => {
          if (!pendingExamId) return;
          await startSimilarJob(pendingExamId, meta);
        }}
      />
    </div>
  );
}
