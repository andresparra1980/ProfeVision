"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  loadLastDocumentsContext,
  saveLastDocumentsContext,
  clearLastDocumentContext,
  saveDocument,
  loadDocument,
  deleteDocument,
  deleteOutput,
} from "@/lib/persistence/browser";
import { v4 as uuidv4 } from "uuid";
import { useBackgroundSummarization } from "@/lib/hooks/useBackgroundSummarization";
import SummaryModal from "@/components/ai/summary-modal";
import type { SummaryJob } from "@/lib/hooks/useBackgroundSummarization";

export default function DocumentContextBar() {
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeDocForModal, setActiveDocForModal] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { jobs, addJob, getSummary } = useBackgroundSummarization();
  const [summariesAvailability, setSummariesAvailability] = useState<Record<string, boolean>>({});
  const [docMeta, setDocMeta] = useState<Record<string, { fileName?: string; mime?: string }>>({});

  useEffect(() => {
    const ctx = loadLastDocumentsContext();
    if (ctx?.documentIds?.length) setDocumentIds(ctx.documentIds.slice(0, 5));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, boolean> = {};
      for (const id of documentIds) {
        try {
          const s = await getSummary(id);
          map[id] = !!s;
        } catch {
          map[id] = false;
        }
      }
      if (!cancelled) setSummariesAvailability(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [documentIds, getSummary]);

  // Load metadata (fileName, mime) for display
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metaMap: Record<string, { fileName?: string; mime?: string }> = {};
      for (const id of documentIds) {
        try {
          const doc = await loadDocument<{ text?: string; meta?: { fileName?: string; mime?: string } }>(id);
          if (doc?.meta) metaMap[id] = { fileName: doc.meta.fileName, mime: doc.meta.mime };
        } catch {
          // ignore
        }
      }
      if (!cancelled) setDocMeta(metaMap);
    })();
    return () => {
      cancelled = true;
    };
  }, [documentIds]);

  function formatFileName(name: string, maxLen = 26) {
    if (!name) return name;
    const lastDot = name.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === name.length - 1) {
      // No clear extension
      return name.length > maxLen ? name.slice(0, maxLen - 1) + "…" : name;
    }
    const base = name.slice(0, lastDot);
    const ext = name.slice(lastDot); // includes dot
    const budget = Math.max(6, maxLen - ext.length); // reserve space for ext
    const baseTrunc = base.length > budget ? base.slice(0, budget - 1) + "…" : base;
    return baseTrunc + ext;
  }

  function triggerFilePicker() {
    inputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = inputRef.current; // stable ref to DOM element
    const file = inputEl?.files?.[0] || e.target.files?.[0] || null;
    if (!file) {
      try { if (inputEl) inputEl.value = ""; } catch (_e) { /* ignore */ }
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
      const next = Array.from(new Set([id, ...documentIds])).slice(0, 5);
      saveLastDocumentsContext({ documentIds: next });
      setDocumentIds(next);
      // Auto-start background summarization
      addJob(id);
    } catch (err) {
      const msg = (err as { message?: string } | undefined)?.message || String(err);
      setError(msg || "No se pudo extraer el texto del documento.");
    } finally {
      setIsUploading(false);
      // reset input so same file can be selected again
      try { if (inputEl) inputEl.value = ""; } catch (_e) { /* ignore */ }
    }
  }

  const jobByDoc = useMemo(() => {
    const map: Record<string, SummaryJob | undefined> = {};
    for (const id of documentIds) {
      const docJobs = jobs.filter((j) => j.documentId === id);
      const active = docJobs.find((j) => j.status === "queued" || j.status === "summarizing");
      map[id] = active ?? (docJobs.length ? docJobs[docJobs.length - 1] : undefined);
    }
    return map;
  }, [jobs, documentIds]);

  function renderStatus(id: string) {
    const currentJob = jobByDoc[id];
    const st = currentJob?.status;
    if (st === "queued") return <span title="En cola">⏳ En cola</span>;
    if (st === "summarizing")
      return (
        <span title="Resumiendo">
          🧠 Resumiendo {Math.min(100, Math.max(0, Math.round(currentJob?.progress || 0)))}%
        </span>
      );
    if (st === "failed") return <span title={currentJob?.error || "Fallo"}>❌ Error</span>;
    if (st === "completed" || summariesAvailability[id]) return <span title="Resumen disponible">✅ Resumen</span>;
    return <span title="Sin resumen">— Sin resumen</span>;
  }

  async function onDeleteDoc(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await deleteDocument(id);
      await deleteOutput("summary", id);
    } finally {
      const next = documentIds.filter((x) => x !== id);
      setDocumentIds(next);
      if (next.length) saveLastDocumentsContext({ documentIds: next });
      else clearLastDocumentContext();
    }
  }

  return (
    <div className="rounded-md border p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp"
          onChange={onFileSelected}
          disabled={isUploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={isUploading || documentIds.length >= 5}
          className="h-8 w-8 rounded-full border flex items-center justify-center text-lg leading-none"
          title={documentIds.length >= 5 ? "Límite: 5 documentos" : "Agregar documento"}
        >
          +
        </button>

        {/* Document chips list */}
        {documentIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {documentIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => { setActiveDocForModal(id); setIsSummaryOpen(true); }}
                className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                title="Ver resumen del documento"
              >
                <span role="img" aria-label="doc">📄</span>
                <span className="max-w-[220px] truncate" title={docMeta[id]?.fileName || id}>
                  {formatFileName(docMeta[id]?.fileName || id.replace(/^local:/, ""))}
                </span>
                <span className="text-xs text-muted-foreground">{renderStatus(id)}</span>
                <span
                  role="button"
                  onClick={(e) => onDeleteDoc(e, id)}
                  className="ml-1 text-xs text-muted-foreground hover:text-red-600"
                  title="Quitar documento"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Añade documentos (máx. 5) para usarlos como contexto</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Right side: background status (global) and inline errors */}
      <div className="flex items-center gap-3">
        {isUploading && <span className="text-xs text-muted-foreground">Subiendo y extrayendo…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <SummaryModal open={isSummaryOpen} onOpenChange={setIsSummaryOpen} documentId={activeDocForModal} />
    </div>
  );
}
