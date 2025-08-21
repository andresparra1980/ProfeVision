"use client";
import React, { useEffect, useState } from "react";
import { loadLastDocumentContext, saveLastDocumentContext } from "@/lib/persistence/browser";

export default function DocumentContextBar() {
  const [documentId, setDocumentId] = useState("");

  useEffect(() => {
    const ctx = loadLastDocumentContext();
    if (ctx?.documentId) setDocumentId(ctx.documentId);
  }, []);

  function onSave() {
    if (!documentId.trim()) return;
    saveLastDocumentContext({ documentId: documentId.trim() });
  }

  return (
    <div className="rounded-md border p-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium">Contexto de documento (opcional)</div>
        <div className="text-xs text-muted-foreground">Establece un documentId cuyo texto ya haya sido extraído en el sistema para guiar la generación o el resumen.</div>
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
      </div>
    </div>
  );
}
