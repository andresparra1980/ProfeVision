"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { loadSettings } from "@/lib/persistence/browser";
import { useAIChat, type AIExamResult } from './AIChatContext';
import { toast } from "sonner";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  ConversationTyping,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip, ListChecks, FileText } from "lucide-react";
import ResultsView from "./ResultsView";
import {
  DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
  MAX_SIZE_ERROR_CODE,
  useDocumentContext,
} from "../hooks/useDocumentContext";
import { useSummaryDialog } from "../hooks/useSummaryDialog";
import { useChatMessages } from "../hooks/useChatMessages";
import { DocumentChips } from "./DocumentChips";
import { SummaryDialog } from "./SummaryDialog";
import { EmptyState } from "./EmptyState";
import { ProgressMessages } from "./ProgressMessages";
import { StepProgressList } from "./StepProgressList";
import { chatAccentThemeClassName } from "./chat-accent-theme";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { LimitReachedModal } from "@/components/shared/limit-reached-modal";

interface ChatPanelProps {
  onOpenSaveDraft: () => void;
}

export default function ChatPanel({ onOpenSaveDraft }: ChatPanelProps) {
  const t = useTranslations('ai_exams_chat');
  const tTiers = useTranslations('tiers');
  const settings = useMemo(() => loadSettings(), []);
  const { result, setResult, languageOverride } = useAIChat();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);

  // Memoize setResult callback to prevent infinite re-renders
  const handleSetResult = useCallback((r: AIExamResult | null) => {
    setResult(r);
  }, [setResult]);
  const promptWrapRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [padBottom, setPadBottom] = useState<number>(0);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Tier limits hook
  const { usage, loading: tierLoading, canUseAI } = useTierLimits();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [resultsHasUnsavedChanges, setResultsHasUnsavedChanges] = useState(false);
  const [resultsIsEditingQuestion, setResultsIsEditingQuestion] = useState(false);
  const [showResultsCloseAlert, setShowResultsCloseAlert] = useState(false);
  const toastShownRef = useRef(false);

  // Custom hooks for managing state
  const documentContext = useDocumentContext();
  const { messages, isSending, sendMessage, progressMessages, progressState } = useChatMessages({
    settings,
    result,
    setResult: handleSetResult as (_result: unknown) => void,
    t: t as (_key: string, _options?: Record<string, unknown> | { fallback?: string } | undefined) => string,
    languageOverride,
  });
  const summaryDialog = useSummaryDialog({
    documentIds: documentContext.documentIds,
    summariesAvailability: documentContext.summariesAvailability,
    jobs: documentContext.jobs,
    getSummary: documentContext.getSummary,
  });

  // Derived counts for results glow
  const resultsCount = (result?.exam?.questions?.length ?? 0);
  const hasResults = resultsCount > 0;
  const hasDocuments = documentContext.documentIds.length > 0 || !!documentContext.pendingUploadFileName;
  const summaryReadyCount = summaryDialog.availableSummaryDocIds.length;
  const documentCount = documentContext.documentIds.length;
  const questionsLabel = resultsCount === 1
    ? t('kpis.question', { fallback: 'Question' })
    : t('kpis.questions', { fallback: 'Questions' });
  const messagesLabel = messages.length === 1
    ? t('kpis.message', { fallback: 'Message' })
    : t('kpis.messages', { fallback: 'Messages' });
  const documentsLabel = documentCount === 1
    ? t('kpis.document', { fallback: 'Document' })
    : t('kpis.documents', { fallback: 'Documents' });

  function handleResultsOpenChange(open: boolean) {
    if (!open && resultsHasUnsavedChanges) {
      setShowResultsCloseAlert(true);
      return;
    }

    setResultsOpen(open);

    if (!open) {
      setResultsHasUnsavedChanges(false);
      setResultsIsEditingQuestion(false);
    }
  }

  function confirmResultsClose() {
    setShowResultsCloseAlert(false);
    setResultsHasUnsavedChanges(false);
    setResultsIsEditingQuestion(false);
    setResultsOpen(false);
  }

  function cancelResultsClose() {
    setShowResultsCloseAlert(false);
  }

  const convHeight = useMemo(() => {
    const mh = typeof minHeight === 'number' ? minHeight : 0;
    const h = Math.max(240, mh - padBottom);
    return h;
  }, [minHeight, padBottom]);

  // Focus input by default when the component mounts
  useEffect(() => {
    try {
      inputRef.current?.focus();
    } catch (_e) {
      void _e;
    }
  }, []);

  // Mostrar toast informativo de uso de IA (solo una vez)
  useEffect(() => {
    if (!tierLoading && usage && !toastShownRef.current) {
      toastShownRef.current = true;

      const isUnlimited = usage.ai_generation.limit === -1;
      const percentage = usage.ai_generation.percentage;
      const tierName = usage.tier.name; // free, plus, grandfathered, admin

      if (isUnlimited) {
        // Determinar mensaje según el tier
        let tierLabel = '';
        if (tierName === 'grandfathered') {
          tierLabel = tTiers('subscription.grandfathered.title');
        } else if (tierName === 'plus') {
          tierLabel = tTiers('subscription.plus.title');
        } else {
          tierLabel = tTiers(`subscription.${tierName}.title`, { defaultValue: tierName });
        }

        toast.info(tTiers('features.ai_generations'), {
          description: `${tTiers('usage.unlimited')} - ${tierLabel}`,
          duration: 4000,
        });
      } else if (percentage >= 80) {
        toast.warning(tTiers('features.ai_generations'), {
          description: tTiers('limits.warning.approaching_ai'),
          duration: 5000,
        });
      } else {
        toast.info(tTiers('features.ai_generations'), {
          description: `${usage.ai_generation.used} ${tTiers('usage.of')} ${usage.ai_generation.limit} ${tTiers('usage.used')}`,
          duration: 3000,
        });
      }
    }
  }, [usage, tierLoading, tTiers]);

  // Measure prompt height to reserve space and avoid vertical scrollbar
  useEffect(() => {
    function updatePadding() {
      const h = promptWrapRef.current?.offsetHeight || 0;
      setPadBottom(h);
    }
    function updateMinHeight() {
      try {
        const top = rootRef.current?.getBoundingClientRect().top || 0;
        const vh = window.innerHeight || 0;
        const promptHeight = promptWrapRef.current?.offsetHeight || 0;
        const mh = Math.max(0, Math.floor(vh - top - promptHeight + 80));
        setMinHeight(mh);
      } catch {
        /* ignore */
      }
    }
    updatePadding();
    updateMinHeight();
    const ro = new ResizeObserver(() => updatePadding());
    const node = promptWrapRef.current;
    if (node) ro.observe(node);
    window.addEventListener('resize', updatePadding);
    window.addEventListener('resize', updateMinHeight);
    return () => {
      try {
        if (node) ro.unobserve(node);
      } catch {
        /* ignore */
      }
      ro.disconnect();
      window.removeEventListener('resize', updatePadding);
      window.removeEventListener('resize', updateMinHeight);
    };
  }, [input, documentContext.documentIds.length]);

  const handleExampleClick = (text: string) => {
    setInput(text);
    try {
      inputRef.current?.focus();
    } catch {
      /* ignore */
    }
  };

  const handleSend = () => {
    // Verificar límites antes de enviar
    // Solo verificar si NO está cargando y los datos ya están disponibles
    if (!tierLoading && usage && !canUseAI()) {
      setShowLimitModal(true);
      return;
    }

    sendMessage(input);
    setInput('');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.size > DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
      toast.error(t('context.uploadErrorTitle', { fallback: 'Error al subir' }), {
        description: t('context.maxSizeError', { fallback: 'El archivo supera el máximo permitido de 10 MB.' }),
      });
      try {
        e.target.value = '';
      } catch {
        /* ignore */
      }
      return;
    }

    documentContext.onFileSelected(e, (msg) => {
      toast.error(t('context.uploadErrorTitle', { fallback: 'Error al subir' }), {
        description:
          msg === MAX_SIZE_ERROR_CODE
            ? t('context.maxSizeError', { fallback: 'El archivo supera el máximo permitido de 10 MB.' })
            : msg,
      });
    });
  };

  // Auto-open results drawer when generation finishes
  const prevIsSending = useRef(isSending);
  useEffect(() => {
    if (prevIsSending.current && !isSending && hasResults) {
      setResultsOpen(true);
    }
    prevIsSending.current = isSending;
  }, [isSending, hasResults]);

  return (
    <div ref={rootRef} className="flex flex-1 flex-col gap-4 overflow-x-clip overflow-y-hidden sm:gap-6" style={{ minHeight }}>
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[1200px]">
          <div className="rounded-[30px] border border-black/10 bg-gradient-to-b from-white via-white to-[rgb(var(--chat-accent-soft))] p-3 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] dark:border-white/10 dark:from-zinc-950 dark:via-zinc-950 dark:to-[rgb(var(--chat-accent-soft))] sm:p-5">
            <div className="mb-4 flex justify-end border-b border-black/5 px-1 pb-4 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                  {messages.length} {messagesLabel}
                </div>
                <div className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                  {resultsCount} {questionsLabel}
                </div>
                <div className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                  {documentCount} {documentsLabel}
                </div>
              </div>
            </div>

          <Conversation
            className="relative w-full overflow-y-auto rounded-[24px] bg-transparent px-1 shadow-none sm:px-2"
            style={{ height: convHeight, maxHeight: convHeight }}
          >
            <ConversationContent className="px-0 pb-8 pt-2 sm:pb-10 sm:pt-4">
              {messages.length === 0 && input.trim().length === 0 ? (
                <ConversationEmptyState>
                  <EmptyState onExampleClick={handleExampleClick} t={t} />
                </ConversationEmptyState>
              ) : (
                messages.map((m, i) => (
                  <Message key={i} from={m.role}>
                    <MessageContent className="whitespace-pre-line">{m.content}</MessageContent>
                  </Message>
                ))
              )}
              {isSending && (
                <Message from="assistant">
                  <MessageContent className="border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] text-foreground dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
                    {progressState.steps.length > 0 || progressState.llmResponse || progressState.successMessage ? (
                      <StepProgressList
                        steps={progressState.steps}
                        llmResponse={progressState.llmResponse}
                        successMessage={progressState.successMessage}
                        progressAriaLabel={t('chat.progress.ariaLabel', { fallback: 'Progress updates' })}
                      />
                    ) : progressMessages.length > 0 ? (
                      <ProgressMessages
                        messages={progressMessages}
                        progressAriaLabel={t('chat.progress.ariaLabel', { fallback: 'Progress updates' })}
                        processingAriaLabel={t('chat.progress.processingLabel', { fallback: 'Processing' })}
                        nowLabel={t('chat.progress.nowLabel', { fallback: 'now' })}
                      />
                    ) : (
                      <ConversationTyping className="pl-2" />
                    )}
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton className="border-black/10 bg-white/90 shadow-lg hover:bg-white dark:border-white/10 dark:bg-zinc-900/90 dark:hover:bg-zinc-900" />
          </Conversation>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div
          ref={promptWrapRef}
          className="sticky bottom-0 z-30 mt-auto w-full max-w-[980px] px-0 pb-1 sm:px-2"
          style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="rounded-[30px] border border-black/10 bg-white/75 p-3 shadow-[0_28px_100px_-50px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 sm:p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
                  {isSending
                    ? t('chat.waitingPlaceholder', { fallback: 'Esperando respuesta...' })
                    : t('chat.inputPlaceholder')}
                </div>
                {documentContext.isUploading && (
                  <div className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-zinc-900/80">
                    {t('context.processingNow', { fallback: 'Procesando...' })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`gap-2 rounded-full border-black/10 bg-white/80 shadow-sm hover:bg-white dark:border-white/10 dark:bg-zinc-900/80 dark:hover:text-white ${hasResults ? 'border-[rgb(var(--chat-accent-border))] text-[rgb(var(--chat-accent-ink))]' : ''}`}
                  onClick={() => setResultsOpen(true)}
                  aria-label={t('results.title')}
                >
                  <ListChecks className="h-4 w-4" />
                  <span>{questionsLabel}</span>
                  <span className="rounded-full bg-[rgb(var(--chat-accent-soft))] px-2 py-0.5 text-[11px] text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
                    {resultsCount}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => summaryDialog.openSummaryDialog()}
                  disabled={summaryReadyCount === 0}
                  className="gap-2 rounded-full text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-zinc-900"
                >
                  <FileText className="h-4 w-4" />
                  <span>{t('context.viewSummary', { fallback: 'Ver resumen' })}</span>
                  <span className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] dark:border-white/10">
                    {summaryReadyCount}
                  </span>
                </Button>
              </div>
            </div>

            {hasDocuments && (
              <div className="mb-3 rounded-[24px] border border-black/8 bg-white/70 p-2.5 dark:border-white/10 dark:bg-zinc-900/60 sm:p-3">
                <DocumentChips
                  documentIds={documentContext.documentIds}
                  docMeta={documentContext.docMeta}
                  summariesAvailability={documentContext.summariesAvailability}
                  jobs={documentContext.jobs}
                  pendingUploadFileName={documentContext.pendingUploadFileName}
                  onDelete={documentContext.onDeleteDoc}
                  isSending={isSending}
                  t={t}
                />
              </div>
            )}

          <PromptInput
            onSubmit={(_message, _event) => {
              handleSend();
            }}
            className="relative border-transparent bg-transparent shadow-none"
          >
            <PromptInputBody>
              <div>
                <PromptInputTextarea
                  placeholder={
                    isSending
                      ? t('chat.waitingPlaceholder', { fallback: 'Esperando respuesta...' })
                      : t('chat.inputPlaceholder')
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  ref={inputRef}
                  autoFocus
                  disabled={isSending}
                  className="px-4"
                />
              </div>
            </PromptInputBody>
            <PromptInputToolbar className="border-t-0 px-1 pb-0 pt-2 sm:px-1">
              <PromptInputTools>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={documentContext.triggerFilePicker}
                        className="rounded-full border border-black/10 bg-white/90 text-muted-foreground shadow-sm transition-colors hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
                        disabled={isSending || documentContext.isUploading || documentContext.documentIds.length >= 5}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">
                          {documentContext.documentIds.length >= 5
                            ? t('context.limitDesc', { fallback: 'Máximo 5 documentos' })
                            : t('context.attach', { fallback: 'Adjuntar documento' })}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {documentContext.documentIds.length >= 5
                          ? t('context.limitDesc', { fallback: 'Máximo 5 documentos' })
                          : t('context.attach', { fallback: 'Adjuntar documento' })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Hidden file input */}
                <input
                  ref={documentContext.fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp"
                  onChange={handleFileSelected}
                  disabled={documentContext.isUploading || documentContext.documentIds.length >= 5}
                  className="hidden"
                />
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isSending || input.trim().length === 0 || (!tierLoading && usage ? !canUseAI() : false)}
                status={isSending ? 'submitted' : undefined}
                className="h-11 w-11 bg-[rgb(var(--chat-accent))] text-white shadow-lg hover:bg-[rgb(var(--chat-accent-ink))] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </PromptInputToolbar>
          </PromptInput>
          </div>
        </div>
      </div>

      {/* Results review panel */}
      <Dialog open={resultsOpen} onOpenChange={handleResultsOpenChange}>
        <DialogContent
          className={`w-full max-w-5xl overflow-hidden border border-black/10 bg-[#fcfcfb] p-0 shadow-[0_36px_120px_-56px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-zinc-950 max-sm:!left-0 max-sm:bottom-0 max-sm:!top-auto max-sm:max-h-[88dvh] max-sm:w-full max-sm:max-w-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:rounded-t-[30px] max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 ${chatAccentThemeClassName}`}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t('results.title')}</DialogTitle>
            <DialogDescription>{t('results.description')}</DialogDescription>
          </DialogHeader>
          <div className="border-b border-black/5 px-3 pb-3 pt-3 dark:border-white/10 sm:px-6 sm:pb-4 sm:pt-5">
            <Button
              onClick={onOpenSaveDraft}
              variant="default"
              disabled={resultsIsEditingQuestion}
              className={`rounded-full bg-[rgb(14,116,144)] text-white hover:bg-[rgb(15,118,110)] ${resultsIsEditingQuestion ? 'cursor-not-allowed opacity-60 blur-[0.4px]' : ''}`}
            >
              {t('header.saveDraft')}
            </Button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
            <ResultsView
              isSending={isSending}
              onEditorDirtyChange={setResultsHasUnsavedChanges}
              onEditingStateChange={setResultsIsEditingQuestion}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResultsCloseAlert} onOpenChange={setShowResultsCloseAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.discardDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('editor.discardDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={cancelResultsClose} className="mt-0">
              {t('editor.discardDialog.cancel')}
            </AlertDialogCancel>
            <Button variant="destructive" onClick={confirmResultsClose}>
              {t('editor.discardDialog.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Summary Dialog (bottom sheet) */}
      <SummaryDialog
        open={summaryDialog.summaryOpen}
        onOpenChange={summaryDialog.setSummaryOpen}
        summaryLoading={summaryDialog.summaryLoading}
        summaryDocId={summaryDialog.summaryDocId}
        summaryContent={summaryDialog.summaryContent}
        availableSummaryDocIds={summaryDialog.availableSummaryDocIds}
        docMeta={documentContext.docMeta}
        onDocumentChange={summaryDialog.openSummaryDialog}
        t={t}
      />

      {/* Modal de límite alcanzado */}
      <LimitReachedModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        feature="ai_generation"
        daysUntilReset={usage?.cycle.daysUntilReset || 0}
      />
    </div>
  );
}
