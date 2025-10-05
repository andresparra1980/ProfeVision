import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loadLastDocumentsContext, loadOutput } from '@/lib/persistence/browser';

interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface UseChatMessagesProps {
  settings: { language?: string };
  result: unknown;
  setResult: (_result: unknown) => void;
  onToast: (_options: { title: string; description?: string; variant?: 'destructive' }) => void;
  t: (_key: string, _options?: { fallback?: string }) => string;
}

export function useChatMessages({ settings, result, setResult, onToast, t }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input.trim() } as ChatMessage];
    setMessages(next);
    setIsSending(true);

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
          language: settings.language ?? 'es',
          questionTypes: ['multiple_choice'],
          difficulty: 'mixed' as const,
          taxonomy: [],
          topicSummaries,
          existingExam: existingExam ?? undefined,
        },
      } as const;

      try {
        console.debug('[AIChat] Payload context keys:', Object.keys(payload.context));
      } catch (_e) {
        void _e;
      }

      const res = await fetch('/api/chat', {
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
          onToast({ variant: 'destructive', title: t('chat.toasts.errorTitle'), description: friendly });
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
        onToast({ title: t('chat.toasts.successTitle'), description: t('chat.toasts.successDesc') });
      } catch (_e) {
        void _e;
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('results.title') + ': ' + t('results.description') },
      ]);
    } catch (_e) {
      try {
        onToast({
          title: t('chat.toasts.errorTitle'),
          description: t('chat.toasts.errorDesc'),
          variant: 'destructive',
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
    isSending,
    sendMessage,
  };
}
