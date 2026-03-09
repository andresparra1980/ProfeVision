"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { buildStructuredSummaryHtml, getSummaryDisplayText } from '../utils/summaryFormatters';
import { mdToHtmlLite } from '../utils/formatting';

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  summaryLoading: boolean;
  summaryDocId: string | null;
  summaryContent: unknown | null;
  availableSummaryDocIds: string[];
  docMeta: Record<string, { fileName?: string; mime?: string }>;
  onDocumentChange: (_docId: string) => void;
  t: (_key: string, _options?: { fallback?: string }) => string;
}

export function SummaryDialog({
  open,
  onOpenChange,
  summaryLoading,
  summaryDocId,
  summaryContent,
  availableSummaryDocIds,
  docMeta,
  onDocumentChange,
  t,
}: SummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="inset-x-0 bottom-20 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-xl mx-auto rounded-2xl p-4 sm:p-6 shadow-xl z-[60]
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
          data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom
          duration-300"
      >
        <DialogHeader>
          <DialogTitle>{t('context.summaryTitle', { fallback: 'Resumen del documento' })}</DialogTitle>
          <DialogDescription>
            {t('context.summaryDesc', { fallback: 'Vista previa del resumen generado por IA.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm text-muted-foreground" htmlFor="summary-doc-select">
            {t('context.document', { fallback: 'Documento' })}:
          </label>
          <select
            id="summary-doc-select"
            className="border bg-background rounded px-2 py-1 text-sm"
            value={summaryDocId ?? availableSummaryDocIds[0] ?? ''}
            onChange={(e) => onDocumentChange(e.target.value)}
            disabled={availableSummaryDocIds.length === 0}
          >
            {availableSummaryDocIds.map((id) => (
              <option key={id} value={id}>
                {docMeta[id]?.fileName || id.replace(/^local:/, '')}
              </option>
            ))}
          </select>
        </div>
        <div className="max-h-[60vh] overflow-y-auto rounded border bg-card p-3 text-sm prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-code:text-foreground dark:prose-invert">
          {summaryLoading ? (
            <div className="text-muted-foreground">
              {t('context.loadingSummary', { fallback: 'Cargando resumen...' })}
            </div>
          ) : summaryContent ? (
            (() => {
              const structured = buildStructuredSummaryHtml(summaryContent);
              const html = structured ?? mdToHtmlLite(String(getSummaryDisplayText(summaryContent)));
              return <div dangerouslySetInnerHTML={{ __html: html }} />;
            })()
          ) : (
            <div className="text-muted-foreground">
              {t('context.summaryNotReady', {
                fallback: 'El resumen estará disponible en cuanto termine el procesamiento.',
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
