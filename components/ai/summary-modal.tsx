"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadOutput } from "@/lib/persistence/browser";

interface TopicSummaryResult {
  generalOverview: string;
  academicLevel: string;
  macroTopics: Array<{
    name: string;
    description: string;
    importance: "high" | "medium" | "low";
    microTopics: Array<{
      name: string;
      description: string;
      keyTerms: string[];
      concepts: string[];
    }>;
  }>;
}

interface SummaryOutputPayload {
  summary: TopicSummaryResult;
  meta?: any;
}

export function SummaryModal({ open, onOpenChange, documentId }: { open: boolean; onOpenChange: (open: boolean) => void; documentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SummaryOutputPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const out = await loadOutput<SummaryOutputPayload>("summary", documentId);
        if (!mounted) return;
        if (!out) {
          setPayload(null);
          setError("No se encontró un resumen para este documento. Ejecuta 'Resumir en segundo plano' primero.");
        } else {
          setPayload(out);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, documentId]);

  const prettyJson = useMemo(() => {
    if (!payload) return "";
    try {
      return JSON.stringify(payload.summary, null, 2);
    } catch {
      return "";
    }
  }, [payload]);

  function handleCopy() {
    if (!prettyJson) return;
    navigator.clipboard.writeText(prettyJson).catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Resumen del documento</DialogTitle>
          <DialogDescription>
            {documentId ? <span className="text-xs text-muted-foreground">ID: {documentId}</span> : null}
          </DialogDescription>
        </DialogHeader>
        {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && payload && (
          <div className="space-y-3">
            <div className="rounded border bg-muted/30 p-3 text-sm">
              <div className="font-medium mb-1">Visión general</div>
              <div className="whitespace-pre-line">{payload.summary.generalOverview || "(sin contenido)"}</div>
            </div>
            <div className="rounded border bg-muted/30 p-3 text-sm">
              <div className="font-medium mb-1">JSON completo</div>
              <pre className="max-h-80 overflow-auto text-xs whitespace-pre-wrap">{prettyJson}</pre>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button onClick={handleCopy} disabled={!prettyJson}>Copiar JSON</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SummaryModal;
