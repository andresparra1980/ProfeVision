import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { loadLastDocumentsContext, loadOutput } from '@/lib/persistence/browser';
import { useSSEStream, type SSEMessage } from './useSSEStream';

interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface ProgressMessage {
  id: string;
  text: string;
  emoji?: string;
  timestamp: number;
}

interface UseChatMessagesProps {
  settings: { language?: string };
  result: unknown;
  setResult: (_result: unknown) => void;
  t: (_key: string, _options?: { fallback?: string } | Record<string, unknown>) => string;
}

export function useChatMessages({ settings, result, setResult, t }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);

  // Detect locale with next-intl
  const locale = useLocale();

  // Use SSE stream for Mastra
  const { isStreaming, messages: sseMessages, startStream, clearMessages } = useSSEStream();

  // Determine which endpoint to use
  const useMastra = process.env.NEXT_PUBLIC_AI_CHAT_MASTRA === 'true';
  const endpoint = useMastra ? '/api/chat-mastra' : '/api/chat';

  const sanitizeExistingExam = (obj: unknown) => {
    try {
      if (!obj || typeof obj !== 'object') return undefined;
      const cloned = JSON.parse(JSON.stringify(obj));
      if (!cloned.exam || !Array.isArray(cloned.exam.questions)) return undefined;
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
   * Process SSE messages for Mastra
   * - Convert messageKey to translated text using i18n
   * - Update progress messages
   * - Handle done/error events
   */
  useEffect(() => {
    if (!useMastra || sseMessages.length === 0) return;

    const latest = sseMessages[sseMessages.length - 1];

    // Handle progress messages
    if (latest.type === 'progress') {
      const text = latest.messageKey
        ? t(latest.messageKey, latest.params || {})
        : latest.text || 'Processing...';

      const emoji = getEmojiForMessage(latest);

      setProgressMessages((prev) => [
        ...prev,
        {
          id: `progress-${Date.now()}`,
          text,
          emoji,
          timestamp: Date.now(),
        },
      ]);
    }

    // Handle completion
    if (latest.type === 'done') {
      const successText = latest.messageKey
        ? t(latest.messageKey, latest.params || {})
        : t('chat.toasts.successTitle');

      try {
        toast.success(t('chat.toasts.successTitle'), {
          description: t('chat.toasts.successDesc'),
        });
      } catch (_e) {
        void _e;
      }

      // Parse result if available
      if (latest.result) {
        try {
          setResult(JSON.parse(latest.result));
        } catch {
          // Result might already be an object
          setResult(latest.result);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: successText },
      ]);

      setProgressMessages([]);
      clearMessages();
    }

    // Handle errors
    if (latest.type === 'error') {
      const errorText = latest.messageKey
        ? t(latest.messageKey, latest.params || {})
        : latest.error || t('chat.toasts.errorDesc');

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
  }, [sseMessages, useMastra, t, clearMessages, setResult]);

  /**
   * Get emoji for progress message based on tool call
   */
  const getEmojiForMessage = (msg: SSEMessage): string => {
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
  };

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input.trim() } as ChatMessage];
    setMessages(next);
    setIsSending(true);
    setProgressMessages([]);

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
          questionTypes: ['multiple_choice'],
          difficulty: 'mixed' as const,
          taxonomy: [],
          topicSummaries,
          existingExam: existingExam ?? undefined,
        },
      } as const;

      try {
        console.debug(`[AIChat] Endpoint: ${endpoint}, useMastra: ${useMastra}`);
        console.debug('[AIChat] Payload context keys:', Object.keys(payload.context));
        console.debug('[AIChat] Locale:', locale);
      } catch (_e) {
        void _e;
      }

      // ========================================================================
      // MASTRA PATH: Use SSE streaming
      // ========================================================================
      if (useMastra) {
        try {
          await startStream(endpoint, payload, token);
          // SSE messages are processed by useEffect hook
          // Result is set there, so we just need to wait
        } catch (error) {
          console.error('[AIChat] Mastra stream error:', error);
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
    progressMessages, // New: for showing progress during streaming
  };
}
