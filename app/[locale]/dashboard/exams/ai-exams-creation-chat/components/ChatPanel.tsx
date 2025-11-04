"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Noto_Sans } from "next/font/google";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip, ListChecks, FileText, AlertCircle } from "lucide-react";
import ResultsView from "./ResultsView";
import { useDocumentContext } from "../hooks/useDocumentContext";
import { useSummaryDialog } from "../hooks/useSummaryDialog";
import { useChatMessages } from "../hooks/useChatMessages";
import { DocumentChips } from "./DocumentChips";
import { SummaryDialog } from "./SummaryDialog";
import { EmptyState } from "./EmptyState";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { LimitReachedModal } from "@/components/shared/limit-reached-modal";
import { UsageIndicator } from "@/components/shared/usage-indicator";

const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function ChatPanel() {
  const t = useTranslations('ai_exams_chat');
  const tTiers = useTranslations('tiers');
  const settings = useMemo(() => loadSettings(), []);
  const { result, setResult } = useAIChat();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const promptWrapRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [padBottom, setPadBottom] = useState<number>(0);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Tier limits hook
  const { usage, canUseAI } = useTierLimits();
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Add bottom sheet styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .bottom-sheet[data-state="open"] {
        animation: slideInFromBottom 0.3s ease-out;
      }
      .bottom-sheet[data-state="closed"] {
        animation: slideOutToBottom 0.3s ease-in;
      }
      @keyframes slideInFromBottom {
        from {
          transform: translateX(-50%) translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOutToBottom {
        from {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(-50%) translateY(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Custom hooks for managing state
  const documentContext = useDocumentContext();
  const { messages, isSending, sendMessage } = useChatMessages({
    settings,
    result,
    setResult: (r) => setResult(r as AIExamResult | null),
    t,
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
    if (!canUseAI()) {
      setShowLimitModal(true);
      return;
    }

    sendMessage(input);
    setInput('');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    documentContext.onFileSelected(e, (msg) => {
      toast.error(t('context.uploadErrorTitle', { fallback: 'Error al subir' }), {
        description: msg,
      });
    });
  };

  return (
    <div ref={rootRef} className="flex flex-col overflow-x-clip overflow-y-hidden space-y-0" style={{ minHeight }}>
      {/* Indicador de uso de IA */}
      {usage && (
        <div className="flex w-full justify-center mb-3">
          <div className="w-full sm:w-[62vw] sm:min-w-[640px] max-w-[1200px] px-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <UsageIndicator
                label={tTiers('features.ai_generations')}
                used={usage.ai_generation.used}
                limit={usage.ai_generation.limit}
                warningThreshold={80}
              />
              {/* Warning si está cerca del límite */}
              {usage.ai_generation.percentage >= 80 && usage.ai_generation.percentage < 100 && (
                <div className="mt-3 flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{tTiers('limits.warning.approaching_ai')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full justify-center">
        <div className="w-full sm:w-[62vw] sm:min-w-[640px] max-w-[1200px]">
          <Conversation
            className={`${notoSans.className} relative w-full rounded-xl bg-transparent backdrop-blur-sm shadow-none overflow-y-auto`}
            style={{ height: convHeight, maxHeight: convHeight }}
          >
            <ConversationContent>
              {messages.length === 0 && input.trim().length === 0 ? (
                <ConversationEmptyState>
                  <EmptyState onExampleClick={handleExampleClick} t={t} />
                </ConversationEmptyState>
              ) : (
                messages.map((m, i) => (
                  <Message key={i} from={m.role}>
                    <MessageContent>{m.content}</MessageContent>
                  </Message>
                ))
              )}
              {isSending && (
                <Message from="assistant">
                  <MessageContent>
                    <ConversationTyping className="pl-2" />
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div
          ref={promptWrapRef}
          className="w-full max-w-[90vw] md:max-w-[720px] lg:max-w-[800px] xl:max-w-[960px] px-4 sticky bottom-0 z-30"
          style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <PromptInput
            onSubmit={(_message, _event) => {
              handleSend();
            }}
            className={`${notoSans.className} relative rounded-2xl border bg-card shadow-sm`}
          >
            <PromptInputBody>
              <div className="relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={documentContext.triggerFilePicker}
                        className="absolute left-2 top-2 text-muted-foreground hover:text-foreground"
                        disabled={isSending || documentContext.isUploading || documentContext.documentIds.length >= 5}
                      >
                        <Paperclip className="h-6 w-6 top-1 left-1 absolute" />
                        <span className="sr-only">
                          {documentContext.documentIds.length >= 5
                            ? t('context.limitDesc', { fallback: 'Máximo 5 documentos' })
                            : t('context.attach', { fallback: 'Adjuntar documento' })}
                        </span>
                      </button>
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
                  className="pl-12"
                />
              </div>
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                {/* Results button at far left (priority) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`gap-2 ${hasResults ? 'border-primary text-primary' : ''}`}
                        onClick={() => setResultsOpen(true)}
                        aria-label={t('results.title')}
                      >
                        <ListChecks className="h-4 w-4" />
                        <span>{t('results.title')}</span>
                        <span className="ml-1">{resultsCount}</span>
                      </Button>
                    </TooltipTrigger>
                    {hasResults && (
                      <TooltipContent>
                        <p>{t('results.hint')}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Documents summary icon (muted to not compete with Results) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => summaryDialog.openSummaryDialog()}
                        disabled={summaryDialog.availableSummaryDocIds.length === 0}
                        className={`relative text-muted-foreground hover:text-foreground`}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">
                          {summaryDialog.availableSummaryDocIds.length > 0
                            ? t('context.viewSummary', { fallback: 'Ver resumen' })
                            : t('context.summaryNotReady', { fallback: 'Resumen aún no disponible' })}
                        </span>
                        {summaryDialog.availableSummaryDocIds.length > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none h-4 min-w-4 px-1">
                            {summaryDialog.availableSummaryDocIds.length}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {summaryDialog.availableSummaryDocIds.length > 0
                          ? t('context.viewSummary', { fallback: 'Ver resumen' })
                          : t('context.summaryNotReady', { fallback: 'Resumen aún no disponible' })}
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

                {/* Inline chips for selected docs */}
                <DocumentChips
                  documentIds={documentContext.documentIds}
                  docMeta={documentContext.docMeta}
                  summariesAvailability={documentContext.summariesAvailability}
                  jobs={documentContext.jobs}
                  onDelete={documentContext.onDeleteDoc}
                  isSending={isSending}
                  t={t}
                />
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isSending || input.trim().length === 0 || !canUseAI()}
                status={isSending ? 'submitted' : undefined}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>

      {/* Results Drawer (bottom sheet) */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent 
          className="bottom-sheet sm:max-w-3xl p-4 sm:p-6 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            top: 'auto',
            transform: 'translateX(-50%) translateY(0)',
            width: '100%',
            maxWidth: '48rem',
            borderRadius: '1rem 1rem 0 0',
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('results.title')}</DialogTitle>
            <DialogDescription>{t('results.description')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <ResultsView />
          </div>
        </DialogContent>
      </Dialog>

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
