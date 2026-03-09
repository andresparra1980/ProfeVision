"use client";
import React from 'react';
import { X as XIcon } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-2 ml-2">
      {pendingUploadFileName && (
        <div className="flex items-center gap-2 border px-2 py-1 text-xs bg-background">
          <span role="img" aria-label="doc">📄</span>
          <span className="max-w-[160px] truncate" title={pendingUploadFileName}>
            {formatFileName(pendingUploadFileName, 18)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            <span style={{ filter: 'grayscale(100%)' }}>🧠</span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t('context.processingNow', { fallback: 'Procesando...' })}
          </span>
        </div>
      )}
      {documentIds.map((id) => (
        <div key={id} className="flex items-center gap-2 border px-2 py-1 text-xs bg-background">
          <span role="img" aria-label="doc">📄</span>
          <span className="max-w-[160px] truncate" title={docMeta[id]?.fileName || id}>
            {formatFileName(docMeta[id]?.fileName || id.replace(/^local:/, ''), 18)}
          </span>
          {(() => {
            const hasSummary = !!summariesAvailability[id];
            const isFailed = jobs.some((j) => j.documentId === id && j.status === 'failed');
            const isProcessing = !hasSummary && !isFailed;

            if (hasSummary) {
              return <span className="text-[10px] text-muted-foreground">✔️</span>;
            }

            if (isProcessing) {
              return (
                <span className="text-[10px] text-muted-foreground">
                  <span style={{ filter: 'grayscale(100%)' }}>🧠</span>{' '}
                  {t('context.processingNow', { fallback: 'Procesando...' })}
                </span>
              );
            }

            return <span className="text-[10px] text-muted-foreground">—</span>;
          })()}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                  }}
                  className="ml-1 text-muted-foreground hover:text-red-600"
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
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}
