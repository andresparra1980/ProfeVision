import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAIChat } from "./AIChatContext";
import type { AIExamResult } from "./AIChatContext";
import { clearPersistedAIExamDraft } from "./AIChatContext";
import { clearLastDocumentContext } from "@/lib/persistence/browser";
import { clearIndexedDBStores } from "../utils/indexeddb-helpers";
import { useExamMapper } from "../hooks/useExamMapper";
import type { Materia, Grupo, EditingExam } from "../hooks/useExamDraft";
import posthog from "posthog-js";

interface SaveDraftDialogProps {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  materias: Materia[];
  grupos: Grupo[];
  existing?: EditingExam | null;
}

export function SaveDraftDialog({
  open,
  onOpenChange,
  materias,
  grupos,
  existing,
}: SaveDraftDialogProps) {
  const t = useTranslations("ai_exams_chat");
  const { result } = useAIChat();
  const { mapAIQuestionsToApi } = useExamMapper(result);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const router = useRouter();
  const isEditing = Boolean(existing?.id);
  const { completeChecklistItem } = useOnboarding();

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
      titulo: z
        .string()
        .min(3, { message: t("saveDraftDialog.form.title") + " (min 3)" }),
      materia_id: z.string().min(1, {
        message:
          t("saveDraftDialog.form.subject") +
          " " +
          t("saveDraftDialog.form.selectSubject"),
      }),
      grupo_id: z.string().min(1, {
        message:
          t("saveDraftDialog.form.group") +
          " " +
          t("saveDraftDialog.form.selectGroup"),
      }),
      duracion: z.number().min(1).max(240),
      puntaje_total: z.number().min(1).max(100).default(5),
    });
  }, [isEditing, t]);

  type DraftFormValues = z.infer<typeof draftSchema>;

  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      titulo:
        existing?.titulo ||
        (result as AIExamResult | null)?.exam?.title ||
        "",
      materia_id: existing?.materia_id || "",
      grupo_id: "",
      duracion: existing?.duracion_minutos ?? 60,
      puntaje_total: existing?.puntaje_total ?? 5,
    },
  });

  // If existing changes after mount, sync into form
  React.useEffect(() => {
    if (existing) {
      form.reset({
        titulo:
          existing.titulo ||
          (result as AIExamResult | null)?.exam?.title ||
          "",
        materia_id: existing.materia_id || "",
        grupo_id: "",
        duracion: existing.duracion_minutos ?? 60,
        puntaje_total: existing.puntaje_total ?? 5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const materiaId = form.watch("materia_id");
  const gruposFiltrados = React.useMemo(
    () =>
      grupos.filter(
        (g) => g.materia_id === materiaId && g.estado === "activo"
      ),
    [grupos, materiaId]
  );

  // Auto-select subject if only one available
  React.useEffect(() => {
    if (!isEditing && materias.length === 1) {
      form.setValue("materia_id", materias[0].id);
    }
  }, [isEditing, materias.length, materias, form]);

  // Auto-select group if only one available
  React.useEffect(() => {
    if (!isEditing && gruposFiltrados.length === 1) {
      form.setValue("grupo_id", gruposFiltrados[0].id);
    }
  }, [isEditing, gruposFiltrados.length, gruposFiltrados, form]);

  const handleSubmit = React.useCallback(
    async (values: DraftFormValues) => {
      try {
        setSavingDraft(true);
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) throw new Error("No autorizado");

        const preguntas = mapAIQuestionsToApi();

        const url = isEditing ? `/api/exams/${existing?.id}` : "/api/exams";
        const method = isEditing ? "PUT" : "POST";
        type ExamPayload = {
          titulo?: string;
          materia_id?: string;
          grupo_id?: string;
          duracion_minutos?: number;
          puntaje_total?: number;
          descripcion: string;
          preguntas: Array<{
            texto: string;
            tipo: string;
            retroalimentacion?: string;
            opciones: Array<{ texto: string; esCorrecta: boolean }>;
          }>;
        };
        const payload: ExamPayload = {
          descripcion: "",
          preguntas,
        };
        if (!isEditing || (values.titulo && values.titulo.trim().length > 0)) {
          payload.titulo = values.titulo;
        }
        if (!isEditing) {
          payload.materia_id = values.materia_id;
          payload.grupo_id = values.grupo_id;
        }
        if (
          typeof values.duracion === "number" &&
          !Number.isNaN(values.duracion)
        ) {
          payload.duracion_minutos = values.duracion;
        }
        if (
          typeof values.puntaje_total === "number" &&
          !Number.isNaN(values.puntaje_total)
        ) {
          payload.puntaje_total = values.puntaje_total;
        }

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Error al guardar el borrador");
        }

        // On success: clear persisted data
        try {
          clearPersistedAIExamDraft();
          clearLastDocumentContext();
        } catch (_e) {
          void _e;
        }
        try {
          await clearIndexedDBStores();
        } catch (_e) {
          void _e;
        }

        toast.success(
          isEditing
            ? t("saveDraftDialog.toasts.updated")
            : t("saveDraftDialog.toasts.saved"),
          {
            description: isEditing
              ? t("saveDraftDialog.toasts.updatedDesc")
              : t("saveDraftDialog.toasts.savedDesc"),
          }
        );

        // Mark onboarding checklist item as completed (only for new exams)
        if (!isEditing) {
          completeChecklistItem('exam_created');
        }

        // PostHog: Track exam draft saved
        posthog.capture('exam_draft_saved', {
          is_editing: isEditing,
          question_count: preguntas.length,
          source: 'ai_exam_chat',
        });

        router.push("/dashboard/exams");
      } catch (e) {
        toast.error(t("saveDraftDialog.toasts.error"), {
          description:
            e instanceof Error ? e.message : t("saveDraftDialog.toasts.saveError"),
        });
      } finally {
        setSavingDraft(false);
      }
    },
    [existing?.id, isEditing, mapAIQuestionsToApi, router, t, completeChecklistItem]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("saveDraftDialog.edit.title")
              : t("saveDraftDialog.create.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("saveDraftDialog.edit.description")
              : t("saveDraftDialog.create.description")}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">{t("saveDraftDialog.form.title")}</Label>
              <Input
                id="titulo"
                placeholder={t("saveDraftDialog.form.titlePlaceholder")}
                {...form.register("titulo")}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracion">
                  {t("saveDraftDialog.form.duration")}
                </Label>
                <Input
                  id="duracion"
                  type="number"
                  min={1}
                  max={240}
                  {...form.register("duracion", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="puntaje_total">
                  {t("saveDraftDialog.form.totalScore")}
                </Label>
                <Input
                  id="puntaje_total"
                  type="number"
                  min={1}
                  max={100}
                  {...form.register("puntaje_total", { valueAsNumber: true })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t("saveDraftDialog.form.cancel")}
              </Button>
              <Button
                type="button"
                disabled={savingDraft}
                onClick={() => form.handleSubmit(handleSubmit)()}
              >
                {savingDraft ? "…" : t("saveDraftDialog.edit.submit")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">
                  {t("saveDraftDialog.form.title")}*
                </Label>
                <Input
                  id="titulo"
                  placeholder={t("saveDraftDialog.form.titlePlaceholder")}
                  {...form.register("titulo")}
                />
                {form.formState.errors.titulo && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.titulo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="materia">
                  {t("saveDraftDialog.form.subject")}*
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    form.setValue("materia_id", value)
                  }
                  value={form.watch("materia_id")}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("saveDraftDialog.form.selectSubject")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                        {m.entidades_educativas?.nombre
                          ? ` - ${m.entidades_educativas.nombre}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materia_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.materia_id.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo">{t("saveDraftDialog.form.group")}*</Label>
                <Select
                  onValueChange={(value: string) =>
                    form.setValue("grupo_id", value)
                  }
                  value={form.watch("grupo_id")}
                  disabled={!form.watch("materia_id")}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.watch("materia_id")
                          ? t("saveDraftDialog.form.selectGroup")
                          : t("saveDraftDialog.form.selectSubjectFirst")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposFiltrados.length > 0 ? (
                      gruposFiltrados.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-grupos" disabled>
                        {form.watch("materia_id")
                          ? t("saveDraftDialog.form.noGroups")
                          : t("saveDraftDialog.form.selectSubjectFirst")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.grupo_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.grupo_id.message as string}
                  </p>
                )}
              </div>

            </div>

            {/* Duration hidden but kept in form state */}
            <input type="hidden" {...form.register("duracion", { valueAsNumber: true })} />

            <div className="space-y-2">

              <div className="space-y-2">
                <Label htmlFor="puntaje_total">
                  {t("saveDraftDialog.form.totalScore")}*
                </Label>
                <Input
                  id="puntaje_total"
                  type="number"
                  min={1}
                  max={100}
                  {...form.register("puntaje_total", { valueAsNumber: true })}
                />
                {form.formState.errors.puntaje_total && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.puntaje_total.message as string}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t("saveDraftDialog.form.cancel")}
              </Button>
              <Button type="submit" disabled={savingDraft}>
                {savingDraft ? "…" : t("saveDraftDialog.create.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
