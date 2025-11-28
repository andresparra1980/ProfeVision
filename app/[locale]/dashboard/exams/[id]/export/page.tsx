"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, Printer, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

import TextExportDialog from "../../components/TextExportDialog";
import { buildExamTex, type LatexOptions, type LatexLabels } from "@/lib/latex/buildExamTex";
import type { AnswerSheetLabels } from "@/components/exam/pdf-generator";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Student } from "@/lib/types/database";
import { useChecklistItem, useOnboarding } from "@/lib/contexts/onboarding-context";

// Importar el componente PDF de forma dinámica
const PDFGenerator = dynamic(
  () => import('@/components/exam/pdf-generator').then(mod => mod.PDFGenerator),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-32" />
  }
);

// Tipos
interface ExamDetails {
  id: string;
  titulo: string;
  descripcion: string | null;
  instrucciones: string | null;
  duracion_minutos: number;
  puntaje_total: number;
  created_at: string;
  materias: {
    id: string;
    nombre: string;
    profesor: {
      id: string;
      nombres: string;
      apellidos: string;
      cargo: string;
    };
    entidad: {
      id: string;
      nombre: string;
      tipo: string;
    }
  };
  preguntas: Array<{
    id: string;
    texto: string;
    puntaje: number;
    orden: number;
    tipo_pregunta: {
      nombre: string;
    };
    opciones_respuesta: Array<{
      id: string;
      texto: string;
      es_correcta: boolean;
      orden: number;
    }>;
  }>;
  examen_grupo?: Array<{
    grupo: {
      id: string;
      nombre: string;
    };
    fecha_aplicacion: string | null;
    duracion_minutos: number;
  }>;
}

interface Group {
  id: string;
  nombre: string;
  materia: {
    nombre: string;
  };
  estudiantes: Student[];
}

interface GroupWithEstudiantes {
  grupos: {
    id: string;
    nombre: string;
    materias: {
      nombre: string;
    };
    estudiantes: Array<{
      estudiante: Student;
    }>;
  };
}

export default function ExportExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  
  const router = useRouter();
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const dateFnsLocale = locale === 'en' ? enUS : es;
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textExportContent, setTextExportContent] = useState("");
  const [textExportHtmlContent, setTextExportHtmlContent] = useState("");
  // LaTeX export options
  const [latexFontSize, setLatexFontSize] = useState<"8pt"|"10pt"|"12pt">("8pt");
  const [latexColumns, setLatexColumns] = useState<1|2|3>(2);
  const [latexOrientation, setLatexOrientation] = useState<"portrait"|"landscape">("portrait");
  const [latexPaper, setLatexPaper] = useState<"letter"|"a4"|"legal">("letter");
  const [compiling, setCompiling] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Onboarding checklist
  const { complete: completePdfExported, isCompleted: pdfAlreadyExported } = useChecklistItem('pdf_exported');
  const { refetch } = useOnboarding();

  // i18n labels for PDF and LaTeX exports
  const answerSheetLabels: AnswerSheetLabels = {
    title: t('exams.export.answerSheetLabels.title'),
    studentInfo: t('exams.export.answerSheetLabels.studentInfo'),
    name: t('exams.export.answerSheetLabels.name'),
    identification: t('exams.export.answerSheetLabels.identification'),
    group: t('exams.export.answerSheetLabels.group'),
    subject: t('exams.export.answerSheetLabels.subject'),
    exam: t('exams.export.answerSheetLabels.exam'),
    duration: t('exams.export.answerSheetLabels.duration'),
    minutes: t('exams.export.answerSheetLabels.minutes'),
    pageOf: t('exams.export.answerSheetLabels.pageOf'),
    instructions: t('exams.export.answerSheetLabels.instructions'),
    loading: t('exams.export.answerSheetLabels.loading'),
    downloadPdf: t('exams.export.answerSheetLabels.downloadPdf'),
  };

  const latexLabels: LatexLabels = {
    group: t('exams.export.latexLabels.group'),
    instructions: t('exams.export.latexLabels.instructions'),
    duration: t('exams.export.latexLabels.duration'),
    minutes: t('exams.export.latexLabels.minutes'),
    totalScore: t('exams.export.latexLabels.totalScore'),
    pts: t('exams.export.latexLabels.pts'),
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchExamDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select(`
          *,
          materias:materia_id (
            id,
            nombre,
            entidad:entidad_id (
              id,
              nombre,
              tipo
            ),
            profesor:profesor_id (
              id,
              nombres,
              apellidos,
              cargo
            )
          ),
          preguntas (
            id,
            texto,
            puntaje,
            orden,
            tipo_pregunta:tipo_id (nombre),
            opciones_respuesta (id, texto, es_correcta, orden)
          ),
          examen_grupo (
            grupo:grupo_id (
              id,
              nombre
            ),
            fecha_aplicacion,
            duracion_minutos
          )
        `)
        .eq("id", examId)
        .single();

      if (error) throw error;
      
      // Ordenar preguntas por orden
      if (data.preguntas) {
        data.preguntas.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
        // Ordenar opciones de respuesta por orden
        data.preguntas.forEach((pregunta: { orden: number, opciones_respuesta: Array<{ orden: number }> }) => {
          if (pregunta.opciones_respuesta) {
            pregunta.opciones_respuesta.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
          }
        });
      }
      
      setExam(data as ExamDetails);
      
      // Si solo hay un grupo asignado, seleccionarlo automáticamente
      if (data.examen_grupo && data.examen_grupo.length === 1) {
        setSelectedGroupId(data.examen_grupo[0].grupo.id);
      }

      // Cargar grupos con estudiantes
      if (data.examen_grupo && data.examen_grupo.length > 0) {
        const { data: groupsData, error: groupsError } = await supabase
          .from('examen_grupo')
          .select(`
            grupos!inner (
              id,
              nombre,
              materias!inner (
                nombre
              ),
              estudiantes:estudiante_grupo!inner (
                estudiante:estudiantes!inner (
                  id,
                  nombres,
                  apellidos,
                  identificacion
                )
              )
            )
          `)
          .eq('examen_id', examId);

        if (!groupsError && groupsData) {
          const transformedGroups: Group[] = groupsData.map((item: GroupWithEstudiantes) => ({
            id: item.grupos.id,
            nombre: item.grupos.nombre,
            materia: {
              nombre: item.grupos.materias.nombre,
            },
            estudiantes: item.grupos.estudiantes.map((e) => ({
              id: e.estudiante.id,
              nombres: e.estudiante.nombres,
              apellidos: e.estudiante.apellidos,
              identificacion: e.estudiante.identificacion,
            })),
          }));
          setGroups(transformedGroups);
        }
      }
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast.error(t('common.error'), {
        description: t('exams.messages.loadError'),
      });
      router.push("/dashboard/exams");
    } finally {
      setLoading(false);
    }
  }, [examId, router, t]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  const generateTextExport = (examData: ExamDetails) => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    const lines: string[] = [];
    examData.preguntas.forEach((q, idx) => {
      const qNum = idx + 1;
      const questionText = (q.texto || "").trim();
      lines.push(`${qNum}. ${questionText}`);
      const opciones = q.opciones_respuesta || [];
      opciones.forEach((opt, oIdx) => {
        const letter = letters[oIdx] ?? String.fromCharCode(97 + oIdx);
        const optText = (opt.texto || "").trim();
        lines.push(`  ${letter}. ${optText}`);
      });
      // blank line between questions
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const generateHtmlExport = (examData: ExamDetails) => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    const parts: string[] = [];
    parts.push(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<style>' +
          'p{margin:0;}' +
          '.q{font-weight:700;margin:0 0 6px 0;}' +
          '.opt{margin:0 0 0 20px;line-height:1;}' +
        '</style>' +
      '</head><body>'
    );
    examData.preguntas.forEach((q, idx) => {
      const qNum = idx + 1;
      const questionText = escapeHtml((q.texto || "").trim());
      parts.push(`<p class="q"><strong>${qNum}. ${questionText}</strong></p>`);
      const opciones = q.opciones_respuesta || [];
      opciones.forEach((opt, oIdx) => {
        const letter = letters[oIdx] ?? String.fromCharCode(97 + oIdx);
        const optText = escapeHtml((opt.texto || "").trim());
        parts.push(`<p class="opt">${letter}. ${optText}</p>`);
      });
      parts.push('<p style="margin:0 0 10px 0">&nbsp;</p>');
    });
    parts.push("</body></html>");
    return parts.join("");
  };

  const openTextExport = () => {
    if (!exam) return;
    const content = generateTextExport(exam);
    const html = generateHtmlExport(exam);
    setTextExportContent(content);
    setTextExportHtmlContent(html);
    setTextDialogOpen(true);
  };

  const handleDownloadTex = () => {
    if (!exam) return;
    const selectedGroup = exam.examen_grupo?.find(eg => eg.grupo.id === selectedGroupId);
    const dateFormat = locale === 'en' ? "MMMM d, yyyy" : "d 'de' MMMM 'de' yyyy";
    const opts: LatexOptions = {
      fontSize: latexFontSize,
      columns: latexColumns,
      orientation: latexOrientation,
      paper: latexPaper,
      institutionName: exam.materias.entidad?.nombre,
      subjectName: exam.materias.nombre,
      title: exam.titulo,
      groupName: selectedGroup?.grupo?.nombre ?? null,
      dateText: exam.created_at ? format(new Date(exam.created_at), dateFormat, { locale: dateFnsLocale }) : null,
      description: exam.descripcion ?? undefined,
      instructions: exam.instrucciones ?? undefined,
      locale: locale as 'es' | 'en',
      labels: latexLabels,
    };
    const tex = buildExamTex({
      titulo: exam.titulo,
      descripcion: exam.descripcion,
      instrucciones: exam.instrucciones,
      duracion_minutos: exam.duracion_minutos,
      puntaje_total: exam.puntaje_total,
      materias: {
        nombre: exam.materias.nombre,
        entidad: { nombre: exam.materias.entidad.nombre }
      },
      preguntas: exam.preguntas.map(p => ({
        id: p.id,
        texto: p.texto,
        puntaje: p.puntaje,
        opciones_respuesta: (p.opciones_respuesta || []).map(o => ({ id: o.id, texto: o.texto }))
      }))
    }, opts);

    const blob = new Blob([tex], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const base = exam.titulo.toLowerCase().replace(/\s+/g, '-');
    link.href = url;
    link.download = `${base}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCompileServer = async () => {
    try {
      if (!exam) return;
      setCompiling(true);
      const selectedGroup = exam.examen_grupo?.find((eg) => eg.grupo.id === selectedGroupId);
      const dateFormat = locale === 'en' ? "MMMM d, yyyy" : "d 'de' MMMM 'de' yyyy";
      const opts: LatexOptions = {
        fontSize: latexFontSize,
        columns: latexColumns,
        orientation: latexOrientation,
        paper: latexPaper,
        institutionName: exam.materias.entidad?.nombre,
        subjectName: exam.materias.nombre,
        title: exam.titulo,
        groupName: selectedGroup?.grupo?.nombre ?? null,
        dateText: exam.created_at ? format(new Date(exam.created_at), dateFormat, { locale: dateFnsLocale }) : null,
        description: exam.descripcion ?? undefined,
        instructions: exam.instrucciones ?? undefined,
        locale: locale as 'es' | 'en',
        labels: latexLabels,
      };
      const tex = buildExamTex(
        {
          titulo: exam.titulo,
          descripcion: exam.descripcion,
          instrucciones: exam.instrucciones,
          duracion_minutos: exam.duracion_minutos,
          puntaje_total: exam.puntaje_total,
          materias: {
            nombre: exam.materias.nombre,
            entidad: { nombre: exam.materias.entidad.nombre },
          },
          preguntas: exam.preguntas.map((p) => ({
            id: p.id,
            texto: p.texto,
            puntaje: p.puntaje,
            opciones_respuesta: (p.opciones_respuesta || []).map((o) => ({ id: o.id, texto: o.texto })),
          })),
        },
        opts
      );

      const jobName = exam.titulo.toLowerCase().replace(/\s+/g, "-");
      const res = await fetch("/api/latex/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tex, options: { jobName } }),
      });
      if (!res.ok) {
        let msg = "Fallo al compilar en el servidor";
        try {
          const j = await res.json();
          msg = j?.error || msg;
          console.error("Compile error", j);
        } catch {
          // ignore
        }
        toast.error(t("common.error"), { description: msg });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${jobName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exams.messages.success"), { description: t("exams.export.success") });
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"), { description: t("exams.export.error") });
    } finally {
      setCompiling(false);
    }
  };

  // Handler when answer sheets PDF is generated
  const handleAnswerSheetsGenerated = async () => {
    if (!pdfAlreadyExported) {
      const success = await completePdfExported();
      if (success) {
        await refetch();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p>{t('exams.export.notFound')}</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/exams")}
        >
          {t('exams.export.backToExams')}
        </Button>
      </div>
    );
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const hasGroups = exam.examen_grupo && exam.examen_grupo.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard/exams")}
            className="mb-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('exams.export.backToExams')}
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{exam.titulo}</h2>
          <p className="text-muted-foreground">
            {exam.materias?.nombre} | {t('exams.export.pageTitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* SECCIÓN 1: Hojas de Respuesta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('exams.export.answerSheets.title')}
            </CardTitle>
            <CardDescription>
              {t('exams.export.answerSheets.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasGroups ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">{t('exams.export.answerSheets.noGroups')}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => router.push({ pathname: '/dashboard/exams/[id]/assign', params: { id: examId } })}
                >
                  {t('exams.actions.assignGroups')}
                </Button>
              </div>
            ) : (
              <>
                {/* Selector de grupo - siempre mostrar RadioGroup */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('exams.export.answerSheets.selectGroup')}</Label>
                  <RadioGroup value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    {exam.examen_grupo?.map((eg) => (
                      <div key={eg.grupo.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={eg.grupo.id} id={`group-${eg.grupo.id}`} />
                        <Label htmlFor={`group-${eg.grupo.id}`}>{eg.grupo.nombre}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Generador de PDF */}
                {selectedGroupId && selectedGroup && isClient && (
                  <div className="pt-2">
                    <PDFGenerator
                      exam={{
                        id: exam.id,
                        titulo: exam.titulo,
                        descripcion: exam.descripcion || undefined,
                        duracion_minutos: exam.duracion_minutos,
                        preguntas: exam.preguntas.map(p => ({
                          id: p.id,
                          texto: p.texto,
                          puntaje: p.puntaje,
                          orden: p.orden,
                          opciones_respuesta: p.opciones_respuesta.map(o => ({
                            id: o.id,
                            texto: o.texto,
                            orden: o.orden
                          }))
                        }))
                      }}
                      group={selectedGroup}
                      paperSize="LETTER"
                      fileName={`hojas-respuesta-${exam.titulo}-${selectedGroup.nombre}.pdf`}
                      onGenerated={handleAnswerSheetsGenerated}
                      labels={answerSheetLabels}
                    />

                    {/* Info como nota debajo del botón */}
                    <p className="text-xs text-muted-foreground mt-3">
                      {t('exams.export.answerSheets.info')}
                    </p>
                  </div>
                )}

                {!selectedGroupId && exam.examen_grupo && exam.examen_grupo.length > 1 && (
                  <p className="text-sm text-muted-foreground">{t('exams.export.answerSheets.selectGroupHint')}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* SECCIÓN 2: Hoja de Preguntas (opcional) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('exams.export.questionSheet.title')}
              <span className="text-xs font-normal text-muted-foreground">({t('exams.export.questionSheet.optional')})</span>
            </CardTitle>
            <CardDescription>
              {t('exams.export.questionSheet.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Botones de exportación */}
            <div className="flex gap-2 flex-wrap items-center">
              <Button
                variant="secondary"
                onClick={openTextExport}
              >
                {t('exams.export.exportText')}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTex}
              >
                <FileText className="mr-2 h-4 w-4" /> {t('exams.export.downloadTex')}
              </Button>
              <Button
                variant="default"
                onClick={handleCompileServer}
                disabled={compiling}
              >
                <Printer className="mr-2 h-4 w-4" /> {compiling ? t('common.loading') : t('exams.export.downloadPDF')}
              </Button>
            </div>

            <Separator />

            {/* Opciones de exportación */}
            <div className="grid md:grid-cols-2 gap-4 w-full">
              <div className="space-y-2">
                <Label>{t('exams.export.fontSize')}</Label>
                <RadioGroup value={latexFontSize} onValueChange={(v: string) => setLatexFontSize(v as "8pt"|"10pt"|"12pt")}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="8pt" id="l8" /><Label htmlFor="l8">8pt</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="10pt" id="l10" /><Label htmlFor="l10">10pt</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="12pt" id="l12" /><Label htmlFor="l12">12pt</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>{t('exams.export.columns')}</Label>
                <RadioGroup value={String(latexColumns)} onValueChange={(v: string) => {
                  const n = Number(v) as 1|2|3;
                  setLatexColumns(n);
                }}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="c1" /><Label htmlFor="c1">1</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="c2" /><Label htmlFor="c2">2</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="3" id="c3" /><Label htmlFor="c3">3</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>{t('exams.export.orientation')}</Label>
                <RadioGroup value={latexOrientation} onValueChange={(v: string) => setLatexOrientation(v as "portrait"|"landscape")}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="portrait" id="op" /><Label htmlFor="op">{t('exams.export.portrait')}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="landscape" id="ol" /><Label htmlFor="ol">{t('exams.export.landscape')}</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>{t('exams.export.paper')}</Label>
                <RadioGroup value={latexPaper} onValueChange={(v: string) => setLatexPaper(v as "letter"|"a4"|"legal")}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="letter" id="pl" /><Label htmlFor="pl">{t('exams.export.letter')}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="a4" id="pa4" /><Label htmlFor="pa4">{t('exams.export.a4')}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="legal" id="plegal" /><Label htmlFor="plegal">{t('exams.export.legal')}</Label></div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TextExportDialog
        _open={textDialogOpen}
        onOpenChange={setTextDialogOpen}
        content={textExportContent}
        htmlContent={textExportHtmlContent}
        title={t('exams.export.exportText')}
        description={t('exams.export.description')}
      />
    </div>
  );
}
