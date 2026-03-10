"use client";
import React from 'react';
import { CheckCircle2, FileText, Loader2, X as XIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatFileName } from '../utils/formatting';

interface DocumentChipsProps {
  documentIds: string[];
  docMeta: Record<string, { fileName?: string; mime?: string }>;
  summariesAvailability: Record<string, boolean>;
  jobs: Array<{ documentId: string; status: string }>;
  pendingUploadFileName?: string | null;
  onDelete: (_id: string) => void;
  isSending: boolean;
  t: (_key: string, _options?: { fallback?: string }) => string;
}

export function DocumentChips({
  documentIds,
  docMeta,
  summariesAvailability,
  jobs,
  pendingUploadFileName,
  onDelete,
  isSending,
  t,
}: DocumentChipsProps) {
  if (documentIds.length === 0 && !pendingUploadFileName) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {pendingUploadFileName && (
          <div className="flex items-center gap-2 rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1.5 text-xs text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
            <FileText className="h-3.5 w-3.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="max-w-[160px] cursor-help truncate">
                  {formatFileName(pendingUploadFileName, 18)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{pendingUploadFileName}</p>
              </TooltipContent>
            </Tooltip>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[rgb(var(--chat-accent-ink))] dark:bg-black/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('context.processingNow', { fallback: 'Procesando...' })}
            </span>
          </div>
        )}
        {documentIds.map((id) => (
          <div key={id} className="flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-zinc-950/75">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--chat-accent-soft))] text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="max-w-[160px] cursor-help truncate">
                  {formatFileName(docMeta[id]?.fileName || id.replace(/^local:/, ''), 18)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{docMeta[id]?.fileName || id}</p>
              </TooltipContent>
            </Tooltip>
            {(() => {
            const hasSummary = !!summariesAvailability[id];
            const isFailed = jobs.some((j) => j.documentId === id && j.status === 'failed');
            const isProcessing = !hasSummary && !isFailed;

            if (hasSummary) {
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('context.ready', { fallback: 'Ready' })}
                </span>
              );
            }

            if (isProcessing) {
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--chat-accent-soft))] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('context.processingNow', { fallback: 'Procesando...' })}
                </span>
              );
            }

            return <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">—</span>;
          })()}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                  }}
                  className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-red-600 dark:hover:bg-white/10"
                  disabled={isSending}
                >
                  <XIcon className="h-3 w-3" />
                  <span className="sr-only">{t('context.remove', { fallback: 'Quitar' })}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('context.remove', { fallback: 'Quitar' })}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
