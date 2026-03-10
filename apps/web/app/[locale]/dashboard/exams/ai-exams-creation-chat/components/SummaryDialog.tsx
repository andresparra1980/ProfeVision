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
        className="w-full max-w-3xl border border-black/10 bg-[#fcfcfb] p-0 shadow-[0_36px_120px_-56px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-zinc-950 max-sm:!left-0 max-sm:bottom-0 max-sm:!top-auto max-sm:max-h-[88dvh] max-sm:w-full max-sm:max-w-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:rounded-t-[30px] max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('context.summaryTitle', { fallback: 'Resumen del documento' })}</DialogTitle>
          <DialogDescription>
            {t('context.summaryDesc', { fallback: 'Vista previa del resumen generado por IA.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
          <div className="space-y-5 rounded-[28px] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950/60 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-black/5 pb-5 dark:border-white/10">
              <div className="inline-flex w-fit self-start items-center rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
                {t('context.summaryTitle', { fallback: 'Resumen del documento' })}
              </div>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                {t('context.summaryDesc', { fallback: 'Vista previa del resumen generado por IA.' })}
              </DialogDescription>
              <div className="flex min-w-0 items-center gap-2">
                <label className="shrink-0 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground" htmlFor="summary-doc-select">
                  {t('context.document', { fallback: 'Documento' })}
                </label>
                <select
                  id="summary-doc-select"
                  className="h-10 min-w-0 max-w-full flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-foreground dark:border-white/10 dark:bg-zinc-900"
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
            </div>

            <div className="min-w-0 rounded-[24px] border border-black/10 bg-white/80 p-4 text-sm text-foreground dark:border-white/10 dark:bg-zinc-900/70 [&_h1]:break-words [&_h1]:text-foreground [&_h2]:break-words [&_h2]:text-foreground [&_h3]:break-words [&_h3]:text-foreground [&_li]:break-words [&_li]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:break-words [&_p]:text-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_code]:break-words [&_code]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
              {summaryLoading ? (
                <div className="text-muted-foreground">
                  {t('context.loadingSummary', { fallback: 'Cargando resumen...' })}
                </div>
              ) : summaryContent ? (
                (() => {
                  const structured = buildStructuredSummaryHtml(summaryContent, {
                    overviewTitle: t('summary.overviewTitle', { fallback: 'Summary' }),
                    academicLevelLabel: t('summary.academicLevelLabel', { fallback: 'Academic level' }),
                    mainTopicsTitle: t('summary.mainTopicsTitle', { fallback: 'Main topics' }),
                    keyTermsLabel: t('summary.keyTermsLabel', { fallback: 'Key terms' }),
                    conceptsLabel: t('summary.conceptsLabel', { fallback: 'Concepts' }),
                  });
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
