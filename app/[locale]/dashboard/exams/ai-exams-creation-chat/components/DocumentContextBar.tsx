"use client";
import React, { useEffect, useRef, useState } from "react";
import { loadLastDocumentContext, saveLastDocumentContext, saveDocument } from "@/lib/persistence/browser";
import { v4 as uuidv4 } from "uuid";
import { useBackgroundSummarization } from "@/lib/hooks/useBackgroundSummarization";
import BackgroundSummaryStatus from "@/components/ai/background-summary-status";
import SummaryModal from "@/components/ai/summary-modal";

export default function DocumentContextBar() {
  const [documentId, setDocumentId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { jobs, addJob } = useBackgroundSummarization();

  useEffect(() => {
    const ctx = loadLastDocumentContext();
    if (ctx?.documentId) setDocumentId(ctx.documentId);
  }, []);

  function onSave() {
    if (!documentId.trim()) return;
    saveLastDocumentContext({ documentId: documentId.trim() });
  }

  function onSummarize() {
    const id = documentId.trim();
    if (!id) {
      setError("Primero establece un documentId válido (sube un archivo o pega un id).");
      return;
    }
    setError(null);
    addJob(id);
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = inputRef.current; // stable ref to DOM element
    const file = inputEl?.files?.[0] || e.target.files?.[0] || null;
    if (!file) {
      try { if (inputEl) inputEl.value = ""; } catch {}
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/extract", { method: "POST", body: form });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { text: string; meta: { mime: string; fileName: string; length: number } };
      const id = `local:${uuidv4()}`;
      await saveDocument(id, { text: data.text, meta: data.meta });
      saveLastDocumentContext({ documentId: id, meta: data.meta });
      setDocumentId(id);
    } catch (err: any) {
      setError(err?.message || "No se pudo extraer el texto del documento.");
    } finally {
      setIsUploading(false);
      // reset input so same file can be selected again
      try { if (inputEl) inputEl.value = ""; } catch {}
    }
  }

  return (
    <div className="rounded-md border p-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium">Contexto de documento (opcional)</div>
        <div className="text-xs text-muted-foreground">
          Sube un archivo (PDF/DOC/DOCX) para extraer texto de forma efímera y usarlo como contexto, o establece un
          documentId manualmente si ya existe.
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFileSelected}
            disabled={isUploading}
            className="text-xs"
          />
          {isUploading && <span className="text-xs text-muted-foreground">Procesando...</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
        {/* Background summarization status */}
        <BackgroundSummaryStatus jobs={jobs} />
      </div>
      <div className="flex items-end gap-2">
        <input
          className="rounded border p-2 text-sm"
          placeholder="documentId"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
        />
        <button className="h-9 rounded bg-secondary px-3 text-sm" onClick={onSave} disabled={!documentId.trim()}>
          Guardar
        </button>
        <button
          className="h-9 rounded bg-blue-600 text-white px-3 text-sm disabled:opacity-50"
          onClick={onSummarize}
          disabled={!documentId.trim() || isUploading}
          title="Genera un resumen con IA en segundo plano"
        >
          Resumir en segundo plano
        </button>
        <button
          className="h-9 rounded bg-muted px-3 text-sm disabled:opacity-50"
          onClick={() => setIsSummaryOpen(true)}
          disabled={!documentId.trim()}
          title="Ver el resumen guardado en IndexedDB"
        >
          Ver resumen
        </button>
      </div>
      <SummaryModal open={isSummaryOpen} onOpenChange={setIsSummaryOpen} documentId={documentId.trim()} />
    </div>
  );
}
