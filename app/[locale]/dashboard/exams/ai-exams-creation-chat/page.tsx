"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useProfesor } from "@/lib/hooks/useProfesor";

import ChatPanel from "./components/ChatPanel";
import DocumentContextBar from "./components/DocumentContextBar";
import ResultsView from "./components/ResultsView";
import { AIChatProvider } from "./components/AIChatContext";
import { useAIChat } from "./components/AIChatContext";
import { clearPersistedAIExamDraft } from "./components/AIChatContext";
import { clearLastDocumentContext } from "@/lib/persistence/browser";

// In-memory guards to prevent duplicate loads even across remounts in the same module instance
const loadedOnce = new Set<string>();
const inFlightLoads = new Set<string>();

type Materia = { id: string; nombre: string; entidades_educativas?: { nombre: string } | null };
type Grupo = { id: string; nombre: string; materia_id: string; estado: 'activo' | 'archivado' };

function SaveDraftDialog({
  open,
  onOpenChange,
  materias,
  grupos,
  existing,
}: {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  materias: Materia[];
  grupos: Grupo[];
  existing?: {
    id: string;
    titulo: string;
    materia_id?: string | null;
    duracion_minutos?: number | null;
    puntaje_total?: number | null;
  } | null;
}) {
  const { toast } = useToast();
  const t = useTranslations('ai_exams_chat');
  const { result } = useAIChat();
  const [savingDraft, setSavingDraft] = React.useState(false);
  const router = useRouter();
  const isEditing = Boolean(existing?.id);

  // For creation we require metadata; for edit we allow empty/unchanged values
  const draftSchema = React.useMemo(() => {
    if (isEditing) {
      return z.object({
        titulo: z.string().optional(),
        materia_id: z.string().optional(),
        grupo_id: z.string().optional(),
        duracion: z.number().optional(),
        puntaje_total: z.number().optional(),
      });
    }
    return z.object({
      titulo: z.string().min(3, { message: t('saveDraftDialog.form.title') + ' (min 3)' }),
      materia_id: z.string().min(1, { message: t('saveDraftDialog.form.subject') + ' ' + t('saveDraftDialog.form.selectSubject') }),
      grupo_id: z.string().min(1, { message: t('saveDraftDialog.form.group') + ' ' + t('saveDraftDialog.form.selectGroup') }),
      duracion: z.number().min(1).max(240),
      puntaje_total: z.number().min(1).max(100).default(5),
    });
  }, [isEditing]);
  type DraftFormValues = z.infer<typeof draftSchema>;

  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      titulo: existing?.titulo || (result as any)?.exam?.title || '',
      materia_id: existing?.materia_id || '',
      grupo_id: '',
      duracion: existing?.duracion_minutos ?? 60,
      puntaje_total: existing?.puntaje_total ?? 5,
    },
  });

  // If existing changes after mount, sync into form
  React.useEffect(() => {
    if (existing) {
      form.reset({
        titulo: existing.titulo || (result as any)?.exam?.title || '',
        materia_id: existing.materia_id || '',
        grupo_id: '',
        duracion: existing.duracion_minutos ?? 60,
        puntaje_total: existing.puntaje_total ?? 5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const materiaId = form.watch('materia_id');
  const gruposFiltrados = React.useMemo(
    () => grupos.filter(g => g.materia_id === materiaId && g.estado === 'activo'),
    [grupos, materiaId]
  );

  const mapAIQuestionsToApi = React.useCallback(() => {
    try {
      const examRes: any = result as any;
      const qs: any[] = examRes?.exam?.questions || [];
      const mapped = qs.map((q: any) => {
        const type = q?.type || 'multiple_choice';
        const prompt = q?.prompt || '';
        if (type === 'multiple_choice') {
          const options: string[] = Array.isArray(q?.options) ? q.options : [];
          const answer = q?.answer;
          let correctIndex: number | null = null;
          if (typeof answer === 'number') correctIndex = answer;
          else if (typeof answer === 'string') {
            const idx = options.findIndex((t) => t === answer);
            correctIndex = idx >= 0 ? idx : null;
          }
          return {
            texto: prompt,
            tipo: 'opcion_multiple',
            opciones: options.map((texto, i) => ({ texto, esCorrecta: i === correctIndex })),
          };
        }
        if (type === 'true_false') {
          let correct = false;
          if (typeof q?.answer === 'boolean') correct = q.answer;
          else if (typeof q?.answer === 'string') {
            const s = q.answer.trim().toLowerCase();
            correct = s === 'true' || s === 'verdadero' || s === 'v';
          }
          return {
            texto: prompt,
            tipo: 'verdadero_falso',
            opciones: [
              { texto: 'Verdadero', esCorrecta: correct === true },
              { texto: 'Falso', esCorrecta: correct === false },
            ],
          };
        }
        return {
          texto: prompt,
          tipo: 'respuesta_corta',
          opciones: [],
        };
      });
      return mapped;
    } catch {
      return [] as any[];
    }
  }, [result]);

  const handleSubmit = React.useCallback(async (values: DraftFormValues) => {
    try {
      setSavingDraft(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('No autorizado');

      const preguntas = mapAIQuestionsToApi();

      const url = isEditing ? `/api/exams/${existing?.id}` : '/api/exams';
      const method = isEditing ? 'PUT' : 'POST';
      const payload: any = {
        // For edit, only send fields if meaningful to avoid overwriting with empty/NaN
        descripcion: '',
        preguntas,
      };
      if (!isEditing || (values.titulo && values.titulo.trim().length > 0)) {
        payload.titulo = values.titulo;
      }
      if (!isEditing) {
        payload.materia_id = values.materia_id;
        payload.grupo_id = values.grupo_id;
      }
      if (typeof values.duracion === 'number' && !Number.isNaN(values.duracion)) {
        payload.duracion_minutos = values.duracion;
      }
      if (typeof values.puntaje_total === 'number' && !Number.isNaN(values.puntaje_total)) {
        payload.puntaje_total = values.puntaje_total;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar el borrador');
      }

      // On success: clear persisted AI draft, document context, and IndexedDB, then redirect
      try {
        clearPersistedAIExamDraft();
        clearLastDocumentContext();
      } catch (_e) {
        // ignore cleanup errors
      }
      // Clear IndexedDB stores used by our persistence layer (scoped helper)
      try {
        if (typeof window !== 'undefined') {
          await new Promise<void>((resolve) => {
            const req = window.indexedDB.open('pv_v1');
            req.onsuccess = () => {
              const db = req.result;
              const clearStore = (name: string, done: () => void) => {
                try {
                  if (!db.objectStoreNames.contains(name)) {
                    done();
                    return;
                  }
                  const tx = db.transaction([name], 'readwrite');
                  tx.oncomplete = () => done();
                  tx.onerror = () => done();
                  try {
                    tx.objectStore(name).clear();
                  } catch {
                    done();
                  }
                } catch {
                  done();
                }
              };
              clearStore('docs', () => clearStore('outputs', () => resolve()));
            };
            req.onerror = () => resolve();
          });
        }
      } catch (_e) {
        // ignore
      }

      toast({ title: isEditing ? t('saveDraftDialog.toasts.updated') : t('saveDraftDialog.toasts.saved'), description: isEditing ? t('saveDraftDialog.toasts.updatedDesc') : t('saveDraftDialog.toasts.savedDesc') });
      // Redirect to localized dashboard exams (router from i18n handles locale prefix)
      router.push('/dashboard/exams');
    } catch (e) {
      toast({ title: t('saveDraftDialog.toasts.error'), description: e instanceof Error ? e.message : t('saveDraftDialog.toasts.saveError'), variant: 'destructive' });
    } finally {
      setSavingDraft(false);
    }
  }, [existing?.id, mapAIQuestionsToApi, router, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('saveDraftDialog.edit.title') : t('saveDraftDialog.create.title')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('saveDraftDialog.edit.description') : t('saveDraftDialog.create.description')}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">{t('saveDraftDialog.form.title')}</Label>
              <Input id="titulo" placeholder={t('saveDraftDialog.form.titlePlaceholder')} {...form.register('titulo')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracion">{t('saveDraftDialog.form.duration')}</Label>
                <Input id="duracion" type="number" min={1} max={240} {...form.register('duracion', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="puntaje_total">{t('saveDraftDialog.form.totalScore')}</Label>
                <Input id="puntaje_total" type="number" min={1} max={100} {...form.register('puntaje_total', { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                {t('saveDraftDialog.form.cancel')}
              </Button>
              <Button
                type="button"
                disabled={savingDraft}
                onClick={() => form.handleSubmit(handleSubmit)()}
              >
                {savingDraft ? '…' : t('saveDraftDialog.edit.submit')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">{t('saveDraftDialog.form.title')}*</Label>
                <Input id="titulo" placeholder={t('saveDraftDialog.form.titlePlaceholder')} {...form.register('titulo')} />
                {form.formState.errors.titulo && (
                  <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="materia">{t('saveDraftDialog.form.subject')}*</Label>
                <Select
                  onValueChange={(value: string) => form.setValue('materia_id', value)}
                  value={form.watch('materia_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('saveDraftDialog.form.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}{m.entidades_educativas?.nombre ? ` - ${m.entidades_educativas.nombre}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materia_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.materia_id.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo">{t('saveDraftDialog.form.group')}*</Label>
                <Select
                  onValueChange={(value: string) => form.setValue('grupo_id', value)}
                  value={form.watch('grupo_id')}
                  disabled={!form.watch('materia_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.watch('materia_id') ? t('saveDraftDialog.form.selectGroup') : t('saveDraftDialog.form.selectSubjectFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposFiltrados.length > 0 ? (
                      gruposFiltrados.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-grupos" disabled>
                        {form.watch('materia_id') ? t('saveDraftDialog.form.noGroups') : t('saveDraftDialog.form.selectSubjectFirst')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.grupo_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.grupo_id.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">{t('saveDraftDialog.form.duration')}*</Label>
                <Input id="duracion" type="number" min={1} max={240} {...form.register('duracion', { valueAsNumber: true })} />
                {form.formState.errors.duracion && (
                  <p className="text-sm text-destructive">{form.formState.errors.duracion.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="puntaje_total">{t('saveDraftDialog.form.totalScore')}*</Label>
                <Input id="puntaje_total" type="number" min={1} max={100} {...form.register('puntaje_total', { valueAsNumber: true })} />
                {form.formState.errors.puntaje_total && (
                  <p className="text-sm text-destructive">{form.formState.errors.puntaje_total.message as string}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                {t('saveDraftDialog.form.cancel')}
              </Button>
              <Button type="submit" disabled={savingDraft}>
                {savingDraft ? '…' : t('saveDraftDialog.create.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AIExamsCreationChatPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ai_exams_chat');
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);

  // Data for draft form
  const { profesor } = useProfesor();
  const [materias, setMaterias] = React.useState<Materia[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [editingExam, setEditingExam] = React.useState<{
    id: string;
    titulo: string;
    materia_id?: string | null;
    duracion_minutos?: number | null;
    puntaje_total?: number | null;
  } | null>(null);
  const [loadedExamId, setLoadedExamId] = React.useState<string | null>(null);

  // Load materias and grupos for current profesor
  React.useEffect(() => {
    const load = async () => {
      if (!profesor) return;
      try {
        const { data: materiasData } = await supabase
          .from('materias')
          .select('id,nombre,entidades_educativas(nombre)')
          .eq('profesor_id', profesor.id)
          .order('nombre');
        setMaterias(materiasData || []);

        const { data: gruposData } = await supabase
          .from('grupos')
          .select('*')
          .eq('profesor_id', profesor.id)
          .eq('estado', 'activo')
          .order('nombre');
        setGrupos(gruposData || []);
      } catch {
        // show generic error
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar materias y grupos',
        });
      }
    };
    load();
  }, [profesor, toast]);

  // Filter groups by selected materia (handled inside SaveDraftDialog)

  // Clear IndexedDB stores used by our persistence layer
  const clearIndexedDBStores = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    await new Promise<void>((resolve) => {
      const req = window.indexedDB.open("pv_v1");
      req.onsuccess = () => {
        const db = req.result;
        const clearStore = (name: string, done: () => void) => {
          try {
            if (!db.objectStoreNames.contains(name)) {
              done();
              return;
            }
            const tx = db.transaction([name], "readwrite");
            tx.oncomplete = () => done();
            tx.onerror = () => done();
            try {
              tx.objectStore(name).clear();
            } catch {
              done();
            }
          } catch {
            done();
          }
        };
        // Clear sequentially to keep logic simple
        clearStore("docs", () => clearStore("outputs", () => resolve()));
      };
      req.onerror = () => resolve();
    });
  }, []);

  const handleConfirmClear = React.useCallback(async () => {
    setClearing(true);
    try {
      // Clear local draft JSON
      clearPersistedAIExamDraft();
      // Clear last document context (single and multi)
      clearLastDocumentContext();
      // Clear IndexedDB docs and outputs
      await clearIndexedDBStores();

      toast({
        title: t('clearToasts.successTitle'),
        description: t('clearToasts.successDesc'),
      });

      // Reload to ensure all client state/UI resets immediately
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (_e) {
      toast({
        title: t('clearToasts.errorTitle'),
        description: t('clearToasts.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  }, [clearIndexedDBStores, toast]);

  // Loader component to populate AIChatContext from an existing draft exam
  function DraftLoader() {
    const { result, setResult } = useAIChat();
    const examId = searchParams?.get('examId');
    const loadedExamIdRef = React.useRef<string | null>(null);
    const loadingRef = React.useRef(false);

    React.useEffect(() => {
      const load = async () => {
        if (!examId) return;
        // Always allow reloads even if this examId was loaded before in this instance
        if (loadingRef.current) return; // avoid concurrent loads
        // Do not block by loadedOnce; we want to be able to revisit the same exam
        if (inFlightLoads.has(examId)) return; // another effect cycle already started it
        // If we've already completed a load for this exam in this tab, skip (prevents remount loops)
        try {
          const doneOnce = typeof window !== 'undefined' ? sessionStorage.getItem('pv:loaded-exam-id') : null;
          // If we're working on the same exam and already have content, never auto-reload from DB
          const hasNonEmpty = Boolean((result as any)?.exam?.questions && (result as any).exam.questions.length > 0);
          if (doneOnce === examId && hasNonEmpty) return;
        } catch {}
        // Persistent guard across remounts (e.g., dev HMR, StrictMode double invoke)
        try {
          const loading = typeof window !== 'undefined' ? sessionStorage.getItem('pv:loading-exam-id') : null;
          const loadingTsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('pv:loading-exam-ts') : null;
          const loadingTs = loadingTsRaw ? parseInt(loadingTsRaw, 10) : 0;
          const isRecent = Date.now() - loadingTs < 15000; // 15s window considered in-flight
          if (loading === examId && isRecent) return;
          // clear stale loading markers
          if (loading === examId && !isRecent && typeof window !== 'undefined') {
            try { sessionStorage.removeItem('pv:loading-exam-id'); sessionStorage.removeItem('pv:loading-exam-ts'); } catch {}
          }
        } catch (_e) {}
        try {
          // Before loading a different exam, clear all local caches to avoid stale UI
          try {
            // Clear AI exam result cache and in-memory state
            setResult(null);
            clearPersistedAIExamDraft();
          } catch {}
          try { clearLastDocumentContext(); } catch {}
          try { await clearIndexedDBStores(); } catch {}
          // Mark the latest clicked exam with current timestamp to prioritize it
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pv:loaded-exam-id', examId);
              sessionStorage.setItem('pv:loaded-exam-ts', String(Date.now()));
            }
          } catch {}

          loadingRef.current = true;
          inFlightLoads.add(examId);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pv:loading-exam-id', examId);
              sessionStorage.setItem('pv:loading-exam-ts', String(Date.now()));
            }
          } catch (_e) {}
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) throw new Error('No autorizado');

          // Fetch exam metadata
          const examRes = await fetch(`/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!examRes.ok) throw new Error('No se pudo cargar el examen');
          const exam = await examRes.json();
          setEditingExam({
            id: exam.id,
            titulo: exam.titulo,
            materia_id: exam.materia_id ?? null,
            duracion_minutos: exam.duracion_minutos ?? null,
            puntaje_total: exam.puntaje_total ?? null,
          });

          // Fetch questions with options
          const qRes = await fetch(`/api/exams/${examId}/questions-with-options`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!qRes.ok) throw new Error('No se pudieron cargar las preguntas');
          const preguntas: Array<{
            id: string;
            texto: string;
            tipo_id: string;
            opciones: Array<{ texto: string; es_correcta: boolean; orden: number }>;
          }> = await qRes.json();

          // Map to AI chat format
          const questions = preguntas.map((p) => {
            if (p.tipo_id === 'opcion_multiple') {
              const opts = (p.opciones || []).sort((a,b) => a.orden - b.orden).map(o => o.texto);
              const correctIndex = (p.opciones || []).findIndex(o => o.es_correcta);
              return {
                type: 'multiple_choice',
                prompt: p.texto,
                options: opts,
                answer: correctIndex >= 0 ? correctIndex : 0,
              };
            }
            if (p.tipo_id === 'verdadero_falso') {
              const trueOpt = (p.opciones || []).find(o => o.texto.toLowerCase().includes('verdadero'));
              const falseOpt = (p.opciones || []).find(o => o.texto.toLowerCase().includes('falso'));
              const answer = trueOpt?.es_correcta ? true : falseOpt?.es_correcta ? false : false;
              return {
                type: 'true_false',
                prompt: p.texto,
                answer,
              };
            }
            return {
              type: 'short_answer',
              prompt: p.texto,
              answer: '',
            };
          });

          // Build a server-valid existingExam object matching API schema
          const normalizedQuestions = questions.map((q: any, idx: number) => ({
            id: `q${idx + 1}`,
            type: q.type || 'multiple_choice',
            prompt: q.prompt || '',
            options: Array.isArray(q.options) ? q.options : [],
            answer: q.answer ?? null,
            rationale: q.rationale ?? '',
            difficulty: q.difficulty ?? 'medium',
            taxonomy: q.taxonomy ?? 'understand',
            tags: Array.isArray(q.tags) ? q.tags : [],
            source: q.source ?? { documentId: null, spans: [] },
          }));

          setResult({
            exam: {
              title: exam.titulo || '',
              subject: exam.materia_id ? String(exam.materia_id) : 'general',
              level: 'general',
              language: locale || 'es',
              questions: normalizedQuestions,
            },
          } as any);
          loadedExamIdRef.current = examId;
          setLoadedExamId(examId);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pv:loaded-exam-id', examId);
              sessionStorage.setItem('pv:loaded-exam-ts', String(Date.now()));
            }
          } catch {}
          loadedOnce.add(examId);
          toast({ title: t('loadDraft.successTitle'), description: t('loadDraft.successDesc') });
        } catch (e) {
          toast({ variant: 'destructive', title: t('loadDraft.errorTitle'), description: e instanceof Error ? e.message : t('loadDraft.errorDesc') });
        } finally {
          loadingRef.current = false;
          inFlightLoads.delete(examId);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('pv:loading-exam-id');
              sessionStorage.removeItem('pv:loading-exam-ts');
            }
          } catch (_e) {}
        }
      };
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header: botón de regreso arriba, título debajo (como en results) */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/exams")}> 
          <ChevronLeft className="mr-1 h-4 w-4" /> {t('header.back')}
        </Button>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('header.title')}</h2>
          <p className="text-muted-foreground">{t('header.description', { locale })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowClearDialog(true)}>{t('header.clearChat')}</Button>
          <Button onClick={() => setShowSaveDraftDialog(true)}>{t('header.saveDraft')}</Button>
        </div>
      </div>

      {/* Contexto de documento */}
      <Card>
        <CardHeader>
          <CardTitle>{t('context.title')}</CardTitle>
          <CardDescription>{t('context.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentContextBar />
        </CardContent>
      </Card>

      {/* Chat, resultados y diálogo de guardar dentro del Provider */}
      <AIChatProvider>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t('chat.title')}</CardTitle>
              <CardDescription>{t('chat.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatPanel />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t('results.title')}</CardTitle>
              <CardDescription>{t('results.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/** Force ResultsView to remount whenever a different exam draft is loaded */}
              <ResultsView key={loadedExamId ?? 'no-exam'} />
            </CardContent>
          </Card>
        </div>

        {/* Save Draft Dialog inside Provider to access AI context */}
        <SaveDraftDialog
          open={showSaveDraftDialog}
          onOpenChange={setShowSaveDraftDialog}
          materias={materias}
          grupos={grupos}
          existing={editingExam}
        />
        {/* Loader that maps DB draft -> AI chat format */}
        <DraftLoader />
      </AIChatProvider>

      {/* Confirmación Borrar Chat */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clearDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('clearDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing}>{t('clearDialog.cancel')}</Button>
            <Button variant="destructive" onClick={handleConfirmClear} disabled={clearing}>
              {clearing ? '…' : t('clearDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save dialog is now rendered inside the provider above */}
    </div>
  );
}

