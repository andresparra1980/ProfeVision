"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// removed local PDF preview/export
import { Separator } from "@/components/ui/separator";
import TextExportDialog from "../../components/TextExportDialog";
import { buildExamTex, type LatexOptions } from "@/lib/latex/buildExamTex";

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

export default function ExportExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetails | null>(null);
  // removed local PDF preview state
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textExportContent, setTextExportContent] = useState("");
  const [textExportHtmlContent, setTextExportHtmlContent] = useState("");
  // LaTeX export options
  const [latexFontSize, setLatexFontSize] = useState<"8pt"|"10pt"|"12pt">("8pt");
  const [latexColumns, setLatexColumns] = useState<1|2|3>(2);
  const [latexOrientation, setLatexOrientation] = useState<"portrait"|"landscape">("portrait");
  const [latexPaper, setLatexPaper] = useState<"letter"|"a4"|"legal">("letter");
  const [compiling, setCompiling] = useState(false);

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
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast({
        title: t('common.error'),
        description: t('exams.messages.loadError'),
        variant: "destructive",
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
        // Ensure single spacing for options when pasting into Word
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
      // Spacer between questions
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
    // metadata
    const selectedGroup = exam.examen_grupo?.find(eg => eg.grupo.id === selectedGroupId);
    const opts: LatexOptions = {
      fontSize: latexFontSize,
      columns: latexColumns,
      orientation: latexOrientation,
      paper: latexPaper,
      institutionName: exam.materias.entidad?.nombre,
      subjectName: exam.materias.nombre,
      title: exam.titulo,
      groupName: selectedGroup?.grupo?.nombre ?? null,
      dateText: exam.created_at ? format(new Date(exam.created_at), "d 'de' MMMM 'de' yyyy", { locale: es }) : null,
      description: exam.descripcion ?? undefined,
      instructions: exam.instrucciones ?? undefined,
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

  // Compilar en el servidor usando el endpoint local con Tectonic
  const handleCompileServer = async () => {
    try {
      if (!exam) return;
      setCompiling(true);
      const selectedGroup = exam.examen_grupo?.find((eg) => eg.grupo.id === selectedGroupId);
      const opts: LatexOptions = {
        fontSize: latexFontSize,
        columns: latexColumns,
        orientation: latexOrientation,
        paper: latexPaper,
        institutionName: exam.materias.entidad?.nombre,
        subjectName: exam.materias.nombre,
        title: exam.titulo,
        groupName: selectedGroup?.grupo?.nombre ?? null,
        dateText: exam.created_at ? format(new Date(exam.created_at), "d 'de' MMMM 'de' yyyy", { locale: es }) : null,
        description: exam.descripcion ?? undefined,
        instructions: exam.instrucciones ?? undefined,
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
        toast({ title: t("common.error"), description: msg, variant: "destructive" });
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
      toast({ title: t("exams.messages.success"), description: t("exams.export.success") });
    } catch (e) {
      console.error(e);
      toast({ title: t("common.error"), description: t("exams.export.error"), variant: "destructive" });
    } finally {
      setCompiling(false);
    }
  };

  // removed local PDF export (React-PDF)

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

  // removed preview overlay

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
            {exam.materias?.nombre} | {t('exams.export.title')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('exams.export.availableFormats')}</CardTitle>
            <CardDescription>
              {t('exams.export.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Selector de grupo al inicio (solo si hay más de un grupo) */}
            {exam.examen_grupo && exam.examen_grupo.length > 1 && (
              <div className="space-y-2">
                <Label>{t('exams.export.group')}</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">{t('exams.export.selectGroup')}</option>
                  {exam.examen_grupo.map((eg) => (
                    <option key={eg.grupo.id} value={eg.grupo.id}>
                      {eg.grupo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-lg font-semibold">{t('exams.export.questionSheet')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('exams.export.questionSheetDesc')}
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="secondary"
                  onClick={openTextExport}
                  disabled={Boolean(exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId)}
                  title={exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId ? t('exams.export.selectGroup') : undefined}
                >
                  {t('exams.export.exportText')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTex}
                  disabled={Boolean(exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId)}
                  title={exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId ? t('exams.export.selectGroup') : undefined}
                >
                  <FileText className="mr-2 h-4 w-4" /> {t('exams.export.downloadTex')}
                </Button>
                <Button
                  variant="default"
                  onClick={handleCompileServer}
                  disabled={compiling || Boolean(exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId)}
                  title={exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId ? t('exams.export.selectGroup') : undefined}
                >
                  <Printer className="mr-2 h-4 w-4" /> {compiling ? t('common.loading') : t('exams.export.downloadPDF')}
                </Button>
              </div>
              {exam.examen_grupo && exam.examen_grupo.length > 1 && !selectedGroupId && (
                <p className="text-sm text-muted-foreground">{t('exams.export.selectGroupHint')}</p>
              )}
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

            {/* Selector de grupo movido arriba */}
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