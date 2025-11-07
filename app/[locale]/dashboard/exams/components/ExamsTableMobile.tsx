import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Printer,
  FileOutput,
  Users,
  Eye,
  Upload,
  Plus,
  FileText, // Kept for empty state
  Link,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SimilarExamModal from "./SimilarExamModal";
import SimilarExamMetadataDialog, { SimilarExamMeta } from "./SimilarExamMetadataDialog";
import EditableExamTitle from "./EditableExamTitle";
import { monoFont } from "@/lib/fonts";
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
      <p className={`${monoFont}`}>
        {exam.materias?.nombre || "Sin materia"}
      </p>

      {/* Group pills - below title and subject */}
      {exam.examen_grupo && exam.examen_grupo.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-start">
          {exam.examen_grupo.map((asignacion: Exam["examen_grupo"][number]) => (
            <span
              key={asignacion.grupo.id}
              className="inline-flex items-center justify-center rounded-full bg-secondary text-white px-2 py-0.5 text-[10px] font-medium shadow-sm"
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
        <div>{getStatusBadge(exam.estado, t)}</div>
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
}

function ExamCardContent({
  exam,
  router,
  onOpenDeleteDialog,
  onStartSimilar,
}: ExamCardContentProps) {
  const t = useTranslations('dashboard.exams');
  
  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto py-2 px-2"
        onClick={() => {
          router.push({
            pathname: '/dashboard/exams/[id]/edit',
            params: { id: exam.id },
          });
        }}
      >
        <Pencil className="mr-2 h-4 w-4" /> {t('actions.edit')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto py-2 px-2 text-purple-600 dark:text-purple-400"
        onClick={() => onStartSimilar(exam.id)}
      >
        <Plus className="mr-2 h-4 w-4" /> {t('actions.createSimilarExam', { defaultValue: 'Create similar exam' })}
      </Button>
      {exam.estado === "borrador" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2 text-red-500 dark:text-red-400"
          onClick={() => onOpenDeleteDialog(exam.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> {t('actions.delete')}
        </Button>
      )}
              <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2"
          onClick={() => {
            router.push({
              pathname: '/dashboard/exams/[id]/export',
              params: { id: exam.id },
            });
          }}
        >
          <Printer className="mr-2 h-4 w-4" /> {t('actions.print')}
      </Button>
                             <Button
           variant="ghost"
           size="sm"
           className="w-full justify-start h-auto py-2 px-2"
           onClick={() => {
             router.push({
               pathname: '/dashboard/exams/[id]/responses',
               params: { id: exam.id },
             });
           }}
         >
           <FileOutput className="mr-2 h-4 w-4" /> {t('actions.generateSheets')}
      </Button>
              <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2"
          onClick={() => {
            router.push({
              pathname: '/dashboard/exams/[id]/assign',
              params: { id: exam.id },
            });
          }}
        >
          <Users className="mr-2 h-4 w-4" /> {t('actions.assignGroups')}
      </Button>
              <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2"
          onClick={() => {
            router.push({
              pathname: '/dashboard/exams/[id]/link-grade-component',
              params: { id: exam.id },
            });
          }}
        >
          <Link className="mr-2 h-4 w-4" /> {t('actions.linkComponentFull')}
      </Button>
      {exam.estado === "publicado" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2 text-purple-500 font-semibold"
          onClick={() => {
            router.push({
              pathname: '/dashboard/exams/[id]/results',
              params: { id: exam.id },
            });
          }}
        >
          <Eye className="mr-2 h-4 w-4" /> {t('actions.viewResults')}
        </Button>
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatusBadge = (status: string, t: any) => {
  const baseStyle: React.CSSProperties = {
    padding: "3px 8px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.025em",
    transform: "rotate(-5deg)",
    display: "inline-block",
    position: "relative",
    borderRadius: "3px",
    textTransform: "uppercase" as const,
  };

  switch (status) {
    case "borrador":
      return (
        <span
          style={{
            ...baseStyle,
            background: "color-mix(in srgb, var(--accent) 80%, transparent)",
            color: "black",
            boxShadow:
              "inset 0 -2px 0 color-mix(in srgb, var(--accent) 30%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {t('status.draft')}
        </span>
      );
    case "publicado":
      return (
        <span
          style={{
            ...baseStyle,
            background: "color-mix(in srgb, var(--primary) 80%, transparent)",
            color: "black",
            boxShadow:
              "inset 0 -2px 0 color-mix(in srgb, var(--primary) 40%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {t('status.published')}
        </span>
      );
    case "cerrado":
      return (
        <span
          style={{
            ...baseStyle,
            background:
              "color-mix(in srgb, var(--destructive) 80%, transparent)",
            color: "black",
            boxShadow:
              "inset 0 -2px 0 color-mix(in srgb, var(--destructive) 40%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {t('status.completed')}
        </span>
      );
    default:
      return (
        <span
          style={{
            ...baseStyle,
            background: "color-mix(in srgb, var(--muted) 80%, transparent)",
            color: "black",
            boxShadow:
              "inset 0 -2px 0 color-mix(in srgb, var(--muted) 40%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
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
  setShowImportDialog,
  handleCreateExam,
  searchQuery,
  setSearchQuery,
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
        className="w-full bg-card dark:bg-card placeholder:text-muted-foreground max-w-sm"
      />
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
              <div className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('import')}
                </Button>
                <Button onClick={handleCreateExam} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('create')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : isMultiColumn ? (
        // Multi-column layout: always expanded
        <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 items-start auto-rows-min">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="border-2 rounded-md shadow-sm bg-card h-fit"
              style={getStatusBorderStyle(exam.estado)}
            >
              <div className="p-4">
                <ExamCardHeader exam={exam} t={t} onTitleSave={handleTitleSave} />
              </div>
              <div className="p-4 border-t bg-muted/20">
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
                  onStartSimilar={startSimilarJob}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single column layout: collapsible accordion
        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredExams.map((exam) => (
            <AccordionItem
              value={exam.id}
              key={exam.id}
              className="border rounded-md shadow-sm bg-card h-fit"
              style={getStatusBorderStyle(exam.estado)}
            >
              <AccordionTrigger className="p-4 hover:no-underline">
                <ExamCardHeader exam={exam} t={t} onTitleSave={handleTitleSave} />
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t bg-muted/20">
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
                  onStartSimilar={startSimilarJob}
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
