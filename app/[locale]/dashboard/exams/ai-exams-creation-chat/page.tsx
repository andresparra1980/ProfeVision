"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
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

type Materia = { id: string; nombre: string; entidades_educativas?: { nombre: string } | null };
type Grupo = { id: string; nombre: string; materia_id: string; estado: 'activo' | 'archivado' };

function SaveDraftDialog({
  open,
  onOpenChange,
  materias,
  grupos,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  materias: Materia[];
  grupos: Grupo[];
}) {
  const { toast } = useToast();
  const { result } = useAIChat();
  const [savingDraft, setSavingDraft] = React.useState(false);

  const draftSchema = z.object({
    titulo: z.string().min(3, { message: 'Título requerido (mínimo 3 caracteres)' }),
    materia_id: z.string().min(1, { message: 'Materia requerida' }),
    grupo_id: z.string().min(1, { message: 'Grupo requerido' }),
    duracion: z.number().min(1).max(240),
    puntaje_total: z.number().min(1).max(100).default(5),
  });
  type DraftFormValues = z.infer<typeof draftSchema>;

  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      titulo: (result as any)?.exam?.title || '',
      materia_id: '',
      grupo_id: '',
      duracion: 60,
      puntaje_total: 5,
    },
  });

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

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          titulo: values.titulo,
          descripcion: '',
          duracion_minutos: values.duracion,
          puntaje_total: values.puntaje_total,
          materia_id: values.materia_id,
          grupo_id: values.grupo_id,
          preguntas,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar el borrador');
      }

      onOpenChange(false);
      toast({ title: 'Borrador guardado', description: 'El examen se guardó como borrador.' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo guardar el borrador', variant: 'destructive' });
    } finally {
      setSavingDraft(false);
    }
  }, [mapAIQuestionsToApi, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar borrador de examen</DialogTitle>
          <DialogDescription>
            Completa la información general para guardar este examen como borrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título*</Label>
              <Input id="titulo" placeholder="Ej. Examen de lectura" {...form.register('titulo')} />
              {form.formState.errors.titulo && (
                <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="materia">Materia*</Label>
              <Select
                onValueChange={(value: string) => form.setValue('materia_id', value)}
                value={form.watch('materia_id')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una materia" />
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
                <p className="text-sm text-destructive">{form.formState.errors.materia_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo*</Label>
              <Select
                onValueChange={(value: string) => form.setValue('grupo_id', value)}
                value={form.watch('grupo_id')}
                disabled={!form.watch('materia_id')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.watch('materia_id') ? 'Selecciona un grupo' : 'Primero selecciona una materia'} />
                </SelectTrigger>
                <SelectContent>
                  {gruposFiltrados.length > 0 ? (
                    gruposFiltrados.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-grupos" disabled>
                      {form.watch('materia_id') ? 'No hay grupos disponibles' : 'Selecciona primero una materia'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.grupo_id && (
                <p className="text-sm text-destructive">{form.formState.errors.grupo_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (min)*</Label>
              <Input id="duracion" type="number" min={1} max={240} {...form.register('duracion', { valueAsNumber: true })} />
              {form.formState.errors.duracion && (
                <p className="text-sm text-destructive">{form.formState.errors.duracion.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntaje_total">Puntaje total*</Label>
              <Input id="puntaje_total" type="number" min={1} max={100} {...form.register('puntaje_total', { valueAsNumber: true })} />
              {form.formState.errors.puntaje_total && (
                <p className="text-sm text-destructive">{form.formState.errors.puntaje_total.message as string}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingDraft}>
              {savingDraft ? 'Guardando…' : 'Guardar borrador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AIExamsCreationChatPage() {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();

  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);

  // Data for draft form
  const { profesor } = useProfesor();
  const [materias, setMaterias] = React.useState<Materia[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [gruposFiltrados, setGruposFiltrados] = React.useState<Grupo[]>([]);

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

  // Filter groups by selected materia (kept for future use if needed elsewhere)

  // Clear IndexedDB stores used by our persistence layer
  const clearIndexedDBStores = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    await new Promise<void>((resolve) => {
      const req = window.indexedDB.open("pv_v1");
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(["docs", "outputs"], "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        try {
          const docs = tx.objectStore("docs");
          const outputs = tx.objectStore("outputs");
          docs.clear();
          outputs.clear();
        } catch (_e) {
          // ignore if stores missing
          resolve();
        }
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
        title: "Datos del chat borrados",
        description: "Se limpiaron documentos, salidas y el borrador local del examen.",
      });

      // Reload to ensure all client state/UI resets immediately
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (_e) {
      toast({
        title: "Error al borrar",
        description: "No se pudo limpiar completamente el almacenamiento local.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  }, [clearIndexedDBStores, toast]);

  return (
    <div className="space-y-4">
      {/* Header: botón de regreso arriba, título debajo (como en results) */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/exams")}> 
          <ChevronLeft className="mr-1 h-4 w-4" /> Volver a Exámenes
        </Button>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Crear exámenes con IA</h2>
          <p className="text-muted-foreground">Experiencia de chat para generar bancos de preguntas y resúmenes. Idioma: {locale}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowClearDialog(true)}>Borrar Chat</Button>
          <Button onClick={() => setShowSaveDraftDialog(true)}>Guardar Borrador</Button>
        </div>
      </div>

      {/* Contexto de documento */}
      <Card>
        <CardHeader>
          <CardTitle>Contexto de documento</CardTitle>
          <CardDescription>Sube un archivo o define un documentId y genera/consulta el resumen con IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentContextBar />
        </CardContent>
      </Card>

      {/* Chat, resultados y diálogo de guardar dentro del Provider */}
      <AIChatProvider>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>Describe el examen que deseas generar y ajusta con instrucciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatPanel />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>Revisa y exporta el examen generado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsView />
            </CardContent>
          </Card>
        </div>

        {/* Save Draft Dialog inside Provider to access AI context */}
        <SaveDraftDialog
          open={showSaveDraftDialog}
          onOpenChange={setShowSaveDraftDialog}
          materias={materias}
          grupos={grupos}
        />
      </AIChatProvider>

      {/* Confirmación Borrar Chat */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar datos del chat?</DialogTitle>
            <DialogDescription>
              Esta acción limpiará documentos y salidas en el navegador, el contexto de documento y el borrador local del examen generado por IA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmClear} disabled={clearing}>
              {clearing ? "Borrando…" : "Borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save dialog is now rendered inside the provider above */}
    </div>
  );
}

