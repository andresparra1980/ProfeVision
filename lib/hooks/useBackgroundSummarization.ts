"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadDocument, saveOutput, loadOutput } from "@/lib/persistence/browser";

export type SummaryJobStatus = "queued" | "summarizing" | "completed" | "failed";

export interface SummaryJob {
  id: string;
  documentId: string;
  status: SummaryJobStatus;
  progress: number; // 0..100
  error?: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
}

export interface UseBackgroundSummarization {
  jobs: SummaryJob[];
  addJob: (documentId: string) => string;
  removeJob: (jobId: string) => void;
  getSummary: (documentId: string) => Promise<any | null>;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useBackgroundSummarization(): UseBackgroundSummarization {
  const [jobs, setJobs] = useState<SummaryJob[]>([]);
  const isProcessingRef = useRef(false);
  const jobsRef = useRef<SummaryJob[]>([]);

  // keep a ref in sync for safe reads inside async loops
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const enqueue = useCallback((job: SummaryJob) => {
    setJobs((prev) => [...prev, job]);
  }, []);

  const startNextIfIdle = useCallback(() => {
    if (isProcessingRef.current) return;
    setTimeout(processLoop, 0);
  }, []);

  const updateJob = useCallback((jobId: string, patch: Partial<SummaryJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)));
  }, []);

  const processLoop = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      // process one job at a time
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next: SummaryJob | undefined = jobsRef.current.find((x) => x.status === "queued");
        if (!next) break;

        const jobId = next.id;
        updateJob(jobId, { status: "summarizing", progress: 5, startedAt: new Date().toISOString() });

        try {
          // Load document text from IndexedDB
          const doc = await loadDocument<{ text: string; meta?: any }>(next.documentId);
          if (!doc?.text) throw new Error("Documento no encontrado en IndexedDB");

          updateJob(jobId, { progress: 25 });

          // Call summarization API
          const resp = await fetch("/api/documents/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: doc.text, options: { maxOutputTokens: 2200 } }),
          });
          if (!resp.ok) {
            const details = await resp.text();
            throw new Error(`LLM error: ${resp.status} ${details}`);
          }
          const summary = await resp.json();

          updateJob(jobId, { progress: 80 });

          // Persist result in outputs store keyed by documentId
          await saveOutput("summary", next.documentId, { summary, meta: doc.meta });

          updateJob(jobId, { status: "completed", progress: 100, completedAt: new Date().toISOString(), result: summary });
        } catch (e: any) {
          updateJob(jobId, { status: "failed", error: e?.message || String(e), progress: 100, completedAt: new Date().toISOString() });
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [updateJob]);

  const addJob = useCallback(
    (documentId: string) => {
      const id = uid();
      enqueue({ id, documentId, status: "queued", progress: 0 });
      startNextIfIdle();
      return id;
    },
    [enqueue, startNextIfIdle]
  );

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const getSummary = useCallback(async (documentId: string) => {
    return loadOutput<any>("summary", documentId);
  }, []);

  // Auto-start if there are queued jobs and we become idle
  useEffect(() => {
    if (!isProcessingRef.current && jobs.some((j) => j.status === "queued")) {
      startNextIfIdle();
    }
  }, [jobs, startNextIfIdle]);

  return useMemo(
    () => ({ jobs, addJob, removeJob, getSummary }),
    [jobs, addJob, removeJob, getSummary]
  );
}
