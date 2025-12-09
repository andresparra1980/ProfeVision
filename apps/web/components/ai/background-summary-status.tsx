"use client";

import React from "react";
import type { SummaryJob } from "@/lib/hooks/useBackgroundSummarization";

export default function BackgroundSummaryStatus({ jobs }: { jobs: SummaryJob[] }) {
  if (!jobs || jobs.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {jobs.map((j) => (
        <div key={j.id} className="text-xs flex items-center gap-2 text-muted-foreground">
          <span>
            {j.status === "queued" && "⏳"}
            {j.status === "summarizing" && "🧠"}
            {j.status === "completed" && "✅"}
            {j.status === "failed" && "❌"}
          </span>
          <span className="truncate">
            {j.status === "queued" && "En cola para resumir..."}
            {j.status === "summarizing" && `Resumiendo... ${Math.min(100, Math.max(0, Math.round(j.progress)))}%`}
            {j.status === "completed" && "Resumen completado"}
            {j.status === "failed" && (j.error || "Fallo al resumir")}
          </span>
        </div>
      ))}
    </div>
  );
}
