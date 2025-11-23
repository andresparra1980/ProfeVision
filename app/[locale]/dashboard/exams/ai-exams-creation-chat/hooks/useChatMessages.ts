import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { loadLastDocumentsContext, loadOutput } from '@/lib/persistence/browser';
import { useSSEStream, type SSEMessage } from './useSSEStream';
import { logger } from '@/lib/utils/logger';

interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

/**
 * LocalStorage key for persisted chat messages
 */
const CHAT_MESSAGES_KEY = 'ai_chat_messages';

/**
 * Load persisted chat messages from localStorage
 */
function loadPersistedMessages(): ChatMessage[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error('[useChatMessages] Failed to load persisted messages', { error });
    return [];
  }
}

/**
 * Save chat messages to localStorage
 */
function savePersistedMessages(messages: ChatMessage[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    logger.error('[useChatMessages] Failed to save messages', { error });
  }
}

/**
 * Clear persisted chat messages from localStorage
 */
export function clearPersistedMessages(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CHAT_MESSAGES_KEY);
  } catch (error) {
    logger.error('[useChatMessages] Failed to clear messages', { error });
  }
}

interface ProgressMessage {
  id: string;
  text: string;
  emoji?: string;
  timestamp: number;
}

// New step-based progress tracking
export type StepStatus = 'pending' | 'in_progress' | 'completed';

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
  timestamp: number;
}

export interface ProgressState {
  steps: ProgressStep[];
  llmResponse?: string;
  successMessage?: string;
}

interface UseChatMessagesProps {
  settings: { language?: string };
  result: unknown;
  setResult: (_result: unknown) => void;
  t: (_key: string, _options?: { fallback?: string } | Record<string, unknown>) => string;
  languageOverride: 'auto' | 'es' | 'en';
}

/**
 * Get emoji for progress message based on tool call
 */
function getEmojiForMessage(msg: SSEMessage): string {
  if (!msg.toolCalls || msg.toolCalls.length === 0) return '⚙️';

  const toolName = msg.toolCalls[0].name;
  const emojiMap: Record<string, string> = {
    planExamGeneration: '📋',
    generateQuestionsInBulk: '🔄',
    validateAndOrganizeExam: '✅',
    randomizeOptions: '🎲',
    regenerateQuestion: '🔄',
    addQuestions: '➕',
  };

  return emojiMap[toolName] || '⚙️';
}

export function useChatMessages({ settings, result, setResult, t, languageOverride }: UseChatMessagesProps) {
  // Load persisted messages on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadPersistedMessages());
  const [isSending, setIsSending] = useState(false);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);

  // New step-based progress state
  const [progressState, setProgressState] = useState<ProgressState>({
    steps: [],
    llmResponse: undefined,
    successMessage: undefined,
  });

  // Track last processed SSE message index to prevent duplicate processing
  const lastProcessedIndexRef = useRef<number>(-1);

  // Detect locale with next-intl
  const locale = useLocale();

  // Use SSE stream for Mastra
  const { isStreaming, messages: sseMessages, startStream, clearMessages } = useSSEStream();

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    savePersistedMessages(messages);
  }, [messages]);

  // Determine which endpoint to use
  const useMastra = process.env.NEXT_PUBLIC_AI_CHAT_MASTRA === 'true';
  const endpoint = useMastra ? '/api/chat-mastra' : '/api/chat';

  const sanitizeExistingExam = (obj: unknown) => {
    try {
      if (!obj || typeof obj !== 'object') return undefined;
      const cloned = JSON.parse(JSON.stringify(obj));
      if (!cloned.exam || !Array.isArray(cloned.exam.questions)) return undefined;
      // If questions array is empty, don't send existingExam
      if (cloned.exam.questions.length === 0) return undefined;
      const allowedDifficulty = new Set(['easy', 'medium', 'hard']);
      for (const q of cloned.exam.questions) {
        if (!allowedDifficulty.has(q.difficulty)) q.difficulty = 'medium';
      }
      return cloned;
    } catch {
      return undefined;
    }
  };

  const tryStringify = (p: unknown) => {
    try {
      return JSON.stringify(p);
    } catch (_e) {
      void _e;
      const ctx = (p as { context?: Record<string, unknown> })?.context ?? {};
      const { existingExam: _ex, ...rest } = ctx;
      const minimal = { ...(p as object), context: rest } as object;
      return JSON.stringify(minimal);
    }
  };

  /**
   * Map tool name to step ID and label
   */
  const getStepInfo = useCallback((toolName: string): { id: string; label: string } => {
    const stepMap: Record<string, { id: string; labelKey: string }> = {
      planExamGeneration: { id: 'plan', labelKey: 'chat.progress.planning' },
      generateQuestionsInBulk: { id: 'generate', labelKey: 'chat.progress.generating' },
      validateAndOrganizeExam: { id: 'validate', labelKey: 'chat.progress.validating' },
      randomizeOptions: { id: 'randomize', labelKey: 'chat.progress.randomizing' },
      regenerateQuestion: { id: 'regenerate', labelKey: 'chat.progress.regenerating' },
      addQuestions: { id: 'add', labelKey: 'chat.progress.adding' },
      modifyMultipleQuestions: { id: 'modify', labelKey: 'chat.progress.modifying' },
    };

    const info = stepMap[toolName] || { id: toolName, labelKey: 'chat.progress.step' };
    return {
      id: info.id,
      label: t(info.labelKey, { fallback: toolName }),
    };
  }, [t]);

  /**
   * Process a single SSE message
   * Extracted into useCallback to prevent stale closures
   */
  const processSSEMessage = useCallback((msg: SSEMessage) => {
    // Handle progress messages
    if (msg.type === 'progress') {
      // Identify the tool being called
      const toolName = msg.toolCalls?.[0]?.name;

      if (toolName) {
        const stepInfo = getStepInfo(toolName);

        setProgressState((prev) => {
          const existingStepIndex = prev.steps.findIndex(s => s.id === stepInfo.id);

          if (existingStepIndex >= 0) {
            // Update existing step to in_progress
            const updatedSteps = [...prev.steps];
            updatedSteps[existingStepIndex] = {
              ...updatedSteps[existingStepIndex],
              status: 'in_progress' as StepStatus,
              timestamp: Date.now(),
            };
            return { ...prev, steps: updatedSteps };
          } else {
            // Mark previous step as completed
            const updatedSteps = prev.steps.map(s =>
              s.status === 'in_progress' ? { ...s, status: 'completed' as StepStatus } : s
            );

            // Add new step as in_progress
            return {
              ...prev,
              steps: [
                ...updatedSteps,
                {
                  id: stepInfo.id,
                  label: stepInfo.label,
                  status: 'in_progress' as StepStatus,
                  timestamp: Date.now(),
                },
              ],
            };
          }
        });
      }

      // Keep old progressMessages for backwards compatibility
      const emoji = getEmojiForMessage(msg);
      let text = '';
      if (msg.text && msg.text.trim()) {
        text = msg.text.trim();
      } else if (msg.messageKey) {
        text = t(msg.messageKey, msg.params);
      } else {
        text = 'Processing...';
      }

      setProgressMessages((prev) => [
        ...prev,
        {
          id: `progress-${Date.now()}`,
          text,
          emoji,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // Handle completion
    if (msg.type === 'done') {
      let examGenerated = false;
      let assistantMessage = '';

      // Parse result if available
      if (msg.result && typeof msg.result === 'string') {
        try {
          const parsed = JSON.parse(msg.result);

          // Debug parsed structure
          logger.log('[useChatMessages] Parsed done result', {
            hasExam: !!parsed?.exam,
            hasQuestions: !!parsed?.exam?.questions,
            isQuestionsArray: Array.isArray(parsed?.exam?.questions),
            questionCount: Array.isArray(parsed?.exam?.questions) ? parsed.exam.questions.length : 0,
            parsedKeys: Object.keys(parsed),
            examKeys: parsed?.exam ? Object.keys(parsed.exam) : [],
            finishReason: msg.finishReason,
          });

          // Check if it's a valid exam structure
          if (parsed?.exam?.questions && Array.isArray(parsed.exam.questions)) {
            logger.log('[useChatMessages] Valid exam structure detected, setting result');
            setResult(parsed);
            examGenerated = true;

            // Set friendly message instead of JSON
            const questionCount = parsed.exam.questions.length;
            assistantMessage = t('chat.examGenerated', {
              count: questionCount,
              fallback: `✨ Examen generado exitosamente con ${questionCount} preguntas. Revisa los resultados en el panel derecho.`
            });
          } else {
            logger.log('[useChatMessages] Not an exam structure, treating as regular message');
            // Not an exam, treat as regular message
            assistantMessage = msg.result;
          }
        } catch (_error) {
          // Not JSON (agent responded with plain text), this is expected behavior
          logger.log('[useChatMessages] Agent response is plain text (not JSON exam)');
          assistantMessage = msg.result;
        }
      }

      // Only show success toast if an exam was actually generated
      if (examGenerated) {
        try {
          toast.success(t('chat.toasts.successTitle'), {
            description: t('chat.toasts.successDesc'),
          });
        } catch (_e) {
          void _e;
        }
      }

      // Update progress state with final LLM response and success message
      setProgressState((prev) => {
        // Mark all in_progress steps as completed
        const completedSteps = prev.steps.map(s =>
          s.status === 'in_progress' ? { ...s, status: 'completed' as StepStatus } : s
        );

        // Extract LLM response text (if not JSON exam)
        let llmResponseText: string | undefined;
        if (msg.text && msg.text.trim() && !examGenerated) {
          llmResponseText = msg.text.trim();
        }

        return {
          steps: completedSteps,
          llmResponse: llmResponseText,
          successMessage: examGenerated ? assistantMessage : undefined,
        };
      });

      // Build complete assistant response including progress messages (backwards compat)
      // Use functional update to access current progressMessages without dependency
      setProgressMessages((currentProgress) => {
        let finalMessage = '';

        // If an exam was generated, use the short assistantMessage only
        // Don't include progress messages that contain the full exam text
        if (examGenerated) {
          finalMessage = assistantMessage;
        } else {
          // For non-exam responses (conversational), include progress messages
          const progressText = currentProgress
            .filter(pm => pm.text && pm.text.trim())
            .map(pm => pm.text)
            .join('\n\n');

          if (progressText) {
            finalMessage = progressText;
          }

          // Append final result message if different from progress
          if (assistantMessage && assistantMessage !== progressText) {
            finalMessage = finalMessage
              ? `${finalMessage}\n\n${assistantMessage}`
              : assistantMessage;
          }
        }

        // Add combined message to chat history if there's content
        if (finalMessage) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: finalMessage },
          ]);
        }

        // Clear progress messages
        return [];
      });

      clearMessages();
      return;
    }

    // Handle errors
    if (msg.type === 'error') {
      const errorText = msg.messageKey
        ? t(msg.messageKey, msg.params || {})
        : msg.error || t('chat.toasts.errorDesc');

      try {
        toast.error(t('chat.toasts.errorTitle'), {
          description: errorText,
        });
      } catch (_e) {
        void _e;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errorText}` },
      ]);

      setProgressMessages([]);
      clearMessages();
    }
  }, [t, setResult, clearMessages, getStepInfo]);

  /**
   * Process SSE messages for Mastra
   * Only processes new messages to prevent duplicates and race conditions
   */
  useEffect(() => {
    if (!useMastra || sseMessages.length === 0) return;

    // Process only new messages since last check
    const newMessages = sseMessages.slice(lastProcessedIndexRef.current + 1);

    if (newMessages.length === 0) return;

    // Process each new message in order
    newMessages.forEach((msg) => {
      processSSEMessage(msg);
    });

    // Update last processed index
    lastProcessedIndexRef.current = sseMessages.length - 1;
  }, [sseMessages, useMastra, processSSEMessage]);

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input.trim() } as ChatMessage];
    setMessages(next);
    setIsSending(true);
    setProgressMessages([]);
    // Reset progress state for new generation
    setProgressState({
      steps: [],
      llmResponse: undefined,
      successMessage: undefined,
    });
    // Reset processed index for new generation
    lastProcessedIndexRef.current = -1;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessages((prev) => [...prev, { role: 'assistant', content: t('chat.needLogin') }]);
        setIsSending(false);
        return;
      }

      const docsCtx = loadLastDocumentsContext();
      const documentIds = (docsCtx?.documentIds || []).slice(0, 5);

      // Load summaries for each doc (if available)
      interface TopicSummary {
        documentId: string;
        summary: unknown;
      }
      const topicSummaries: TopicSummary[] = [];
      for (const docId of documentIds) {
        try {
          const out = await loadOutput<{ summary?: unknown }>('summary', docId);
          if (out?.summary) topicSummaries.push({ documentId: docId, summary: out.summary });
        } catch (_e) {
          void _e;
        }
      }

      const existingExam = sanitizeExistingExam(result);

      const payload = {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        context: {
          documentIds: Array.isArray(documentIds) ? documentIds : [],
          language: locale || settings.language || 'es', // Use locale from next-intl
          languageOverride, // User explicit language override (highest priority)
          questionTypes: ['multiple_choice'],
          difficulty: 'mixed' as const,
          taxonomy: [],
          topicSummaries,
          existingExam: existingExam ?? undefined,
        },
      } as const;

      logger.log('[AIChat] Request info', {
        endpoint,
        useMastra,
        contextKeys: Object.keys(payload.context),
        locale,
      });

      // ========================================================================
      // MASTRA PATH: Use SSE streaming
      // ========================================================================
      if (useMastra) {
        try {
          await startStream(endpoint, payload, token);
          // SSE messages are processed by useEffect hook
          // Result is set there, so we just need to wait
        } catch (error) {
          logger.error('[AIChat] Mastra stream error', { error });
          // Error already handled by useEffect
        } finally {
          setIsSending(false);
        }
        return;
      }

      // ========================================================================
      // LEGACY PATH: Use regular fetch
      // ========================================================================
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: tryStringify(payload),
      });

      if (!res.ok) {
        let friendly = '';
        try {
          const data = await res.json();
          if (res.status === 422 && typeof data?.error === 'string') {
            if (data.error.includes('JSON inválido')) {
              friendly =
                t('chat.toasts.invalidJson') ||
                'El modelo devolvió un formato inesperado. Intenta de nuevo.';
            } else if (data.error.includes('Contrato inválido')) {
              friendly =
                t('chat.toasts.invalidContract') ||
                'La respuesta no cumplió el contrato esperado. Ajusté reglas y puedes reintentar.';
            } else {
              friendly = data.error;
            }
          } else if (typeof data?.error === 'string') {
            friendly = data.error;
          }
        } catch (_e) {
          const errText = await res.text();
          friendly = errText || t('saveDraftDialog.toasts.saveError');
        }

        try {
          toast.error(t('chat.toasts.errorTitle'), { description: friendly });
        } catch (_e) {
          void _e;
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${res.status}. ${friendly}` }]);
        setIsSending(false);
        return;
      }

      const json = await res.json();
      setResult(json);
      try {
        toast.success(t('chat.toasts.successTitle'), { description: t('chat.toasts.successDesc') });
      } catch (_e) {
        void _e;
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('results.title') + ': ' + t('results.description') },
      ]);
    } catch (_e) {
      try {
        toast.error(t('chat.toasts.errorTitle'), {
          description: t('chat.toasts.errorDesc'),
        });
      } catch (_e2) {
        void _e2;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t('saveDraftDialog.toasts.error') + ': ' + t('saveDraftDialog.toasts.saveError'),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isSending: isSending || isStreaming,
    sendMessage,
    progressMessages, // Deprecated: kept for backwards compatibility
    progressState, // New: step-based progress with persistent states
  };
}
