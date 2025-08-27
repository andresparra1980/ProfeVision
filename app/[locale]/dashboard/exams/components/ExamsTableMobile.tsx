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

// Reusable components
interface ExamCardHeaderProps {
  exam: Exam;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

function ExamCardHeader({ exam, t }: ExamCardHeaderProps) {
  return (
    <div className="flex-1 text-left relative">
      {/* Group pills - top right */}
      {exam.examen_grupo && exam.examen_grupo.length > 0 && (
        <div className="absolute top-0 right-0 flex flex-wrap gap-1 justify-end">
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

      {/* Title */}
      <h3 className="font-medium text-base leading-tight text-card-foreground pr-20">
        {exam.titulo}
      </h3>

      {/* Subject */}
      <p className="text-xs text-muted-foreground mt-1 mb-6">
        {exam.materias?.nombre || "Sin materia"}
      </p>

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
}

function ExamCardContent({
  exam,
  router,
  onOpenDeleteDialog,
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
      {exam.estado === "borrador" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-auto py-2 px-2"
          onClick={() => {
            router.push({
              pathname: '/dashboard/exams/ai-exams-creation-chat',
              query: { examId: exam.id },
            });
          }}
        >
          <Pencil className="mr-2 h-4 w-4" /> Editar en Chat IA
        </Button>
      )}
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

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMultiColumn(window.innerWidth >= 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="px-2 md:px-0 py-4 space-y-4">
      <Input
        placeholder={t('table.search')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-card dark:bg-card placeholder:text-muted-foreground max-w-sm"
      />
      {loading ? (
        <div className="flex justify-center items-center h-64 p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
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
                <ExamCardHeader exam={exam} t={t} />
              </div>
              <div className="p-4 border-t bg-muted/20">
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
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
                <ExamCardHeader exam={exam} t={t} />
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t bg-muted/20">
                <ExamCardContent
                  exam={exam}
                  router={router}
                  onOpenDeleteDialog={onOpenDeleteDialog}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
