import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  loadLastDocumentsContext,
  saveLastDocumentsContext,
  clearLastDocumentContext,
  saveDocument,
  deleteDocument,
  deleteOutput,
  loadDocument,
} from '@/lib/persistence/browser';
import { useBackgroundSummarization } from '@/lib/hooks/useBackgroundSummarization';

interface DocumentMeta {
  fileName?: string;
  mime?: string;
}

export function useDocumentContext() {
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadFileName, setPendingUploadFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docMeta, setDocMeta] = useState<Record<string, DocumentMeta>>({});
  const [summariesAvailability, setSummariesAvailability] = useState<Record<string, boolean>>({});
  const { jobs, addJob, getSummary } = useBackgroundSummarization();

  // Load existing document context on mount
  useEffect(() => {
    const ctx = loadLastDocumentsContext();
    if (ctx?.documentIds?.length) {
      setDocumentIds(ctx.documentIds.slice(0, 5));
    }
  }, []);

  // Load metadata and summary availability when documentIds change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metaMap: Record<string, DocumentMeta> = {};
      const availMap: Record<string, boolean> = {};
      for (const id of documentIds) {
        try {
          const doc = await loadDocument<{ text?: string; meta?: DocumentMeta }>(id);
          if (doc?.meta) {
            metaMap[id] = { fileName: doc.meta.fileName, mime: doc.meta.mime };
          }
        } catch {
          /* ignore */
        }
        try {
          const s = await getSummary(id);
          availMap[id] = !!s;
        } catch {
          availMap[id] = false;
        }
      }
      if (!cancelled) {
        setDocMeta(metaMap);
        setSummariesAvailability(availMap);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentIds, getSummary]);

  // Refresh availability when background jobs progress
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (documentIds.length === 0) return;
      const availMap: Record<string, boolean> = {};
      for (const id of documentIds) {
        try {
          availMap[id] = !!(await getSummary(id));
        } catch {
          availMap[id] = false;
        }
      }
      if (!cancelled) setSummariesAvailability(availMap);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobs, documentIds, getSummary]);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onError: (_message: string) => void
  ) => {
    const inputEl = fileInputRef.current;
    const file = inputEl?.files?.[0] || e.target.files?.[0] || null;
    if (!file) {
      try {
        if (inputEl) inputEl.value = '';
      } catch {
        /* ignore */
      }
      return;
    }

    setUploadError(null);
    if (documentIds.length >= 5) {
      onError('Máximo 5 documentos');
      try {
        if (inputEl) inputEl.value = '';
      } catch {
        /* ignore */
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`El archivo supera el máximo permitido de ${MAX_FILE_SIZE_MB} MB`);
      try {
        if (inputEl) inputEl.value = '';
      } catch {
        /* ignore */
      }
      return;
    }

    setPendingUploadFileName(file.name);
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/documents/extract', { method: 'POST', body: form });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        text: string;
        meta: { mime: string; fileName: string; length: number };
      };
      const id = `local:${uuidv4()}`;
      await saveDocument(id, { text: data.text, meta: data.meta });
      const next = Array.from(new Set([id, ...documentIds])).slice(0, 5);
      saveLastDocumentsContext({ documentIds: next });
      setDocumentIds(next);
      addJob(id); // start background summarization
    } catch (err) {
      const msg = (err as { message?: string } | undefined)?.message || String(err);
      setUploadError(msg);
      onError(msg);
    } finally {
      setIsUploading(false);
      setPendingUploadFileName(null);
      try {
        if (inputEl) inputEl.value = '';
      } catch {
        /* ignore */
      }
    }
  };

  const onDeleteDoc = async (id: string) => {
    try {
      await deleteDocument(id);
      await deleteOutput('summary', id);
    } finally {
      const next = documentIds.filter((x) => x !== id);
      setDocumentIds(next);
      if (next.length) {
        saveLastDocumentsContext({ documentIds: next });
      } else {
        clearLastDocumentContext();
      }
    }
  };

  return {
    fileInputRef,
    documentIds,
    isUploading,
    pendingUploadFileName,
    uploadError,
    docMeta,
    summariesAvailability,
    jobs,
    getSummary,
    triggerFilePicker,
    onFileSelected,
    onDeleteDoc,
  };
}
