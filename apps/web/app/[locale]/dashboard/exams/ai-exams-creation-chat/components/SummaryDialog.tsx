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
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <label className="shrink-0 text-sm text-muted-foreground" htmlFor="summary-doc-select">
            {t('context.document', { fallback: 'Documento' })}:
          </label>
          <select
            id="summary-doc-select"
            className="h-9 min-w-0 max-w-full flex-1 rounded border bg-background px-2 py-1 text-sm text-foreground"
            value={summaryDocId ?? availableSummaryDocIds[0] ?? ''}
            onChange={(e) => onDocumentChange(e.target.value)}
            disabled={availableSummaryDocIds.length === 0}
            title={summaryDocId ? (docMeta[summaryDocId]?.fileName || summaryDocId.replace(/^local:/, '')) : ''}
          >
            {availableSummaryDocIds.map((id) => (
              <option key={id} value={id}>
                {docMeta[id]?.fileName || id.replace(/^local:/, '')}
              </option>
            ))}
          </select>
        </div>
        <div className="max-h-[60vh] min-w-0 overflow-y-auto rounded border bg-card p-3 text-sm text-foreground [&_h1]:break-words [&_h1]:text-foreground [&_h2]:break-words [&_h2]:text-foreground [&_h3]:break-words [&_h3]:text-foreground [&_li]:break-words [&_li]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:break-words [&_p]:text-foreground [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_code]:break-words [&_code]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
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
