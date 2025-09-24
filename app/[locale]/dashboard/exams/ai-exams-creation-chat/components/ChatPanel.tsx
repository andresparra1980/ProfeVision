"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadSettings, loadLastDocumentsContext, loadOutput } from "@/lib/persistence/browser";
import { useAIChat } from "./AIChatContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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

interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const t = useTranslations('ai_exams_chat');
  const settings = useMemo(() => loadSettings(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { result, setResult } = useAIChat();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus input by default when the component mounts
  useEffect(() => {
    try { inputRef.current?.focus(); } catch (_e) { void _e; }
  }, []);

  async function onSend() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input.trim() } as ChatMessage];
    setMessages(next);
    setInput("");
    setIsSending(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t('chat.needLogin') },
        ]);
        setIsSending(false);
        return;
      }

      const docsCtx = loadLastDocumentsContext();
      const documentIds = (docsCtx?.documentIds || []).slice(0, 5);
      // Load summaries for each doc (if available)
      interface TopicSummary { documentId: string; summary: unknown }
      const topicSummaries: TopicSummary[] = [];
      for (const docId of documentIds) {
        try {
          const out = await loadOutput<{ summary?: unknown }>("summary", docId);
          if (out?.summary) topicSummaries.push({ documentId: docId, summary: out.summary });
        } catch (_e) {
          void _e; // ignore if not found or IndexedDB error
        }
      }
      // Sanitize existing exam to match API contract shape to avoid stringify or schema issues
      const allowedDifficulty = new Set(["easy", "medium", "hard"]);
      const sanitizeExistingExam = (obj: unknown) => {
        try {
          if (!obj || typeof obj !== "object") return undefined;
          const cloned = JSON.parse(JSON.stringify(obj));
          if (!cloned.exam || !Array.isArray(cloned.exam.questions)) return undefined;
          for (const q of cloned.exam.questions) {
            if (!allowedDifficulty.has(q.difficulty)) q.difficulty = "medium";
          }
          return cloned;
        } catch {
          return undefined;
        }
      };
      const existingExam = sanitizeExistingExam(result);

      const payload = {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        context: {
          documentIds: Array.isArray(documentIds) ? documentIds : [],
          language: settings.language ?? "es",
          questionTypes: ["multiple_choice"],
          difficulty: "mixed" as const,
          taxonomy: [],
          topicSummaries,
          existingExam: existingExam ?? undefined,
        },
      } as const;

      // Safe stringify with fallback dropping existingExam if it fails (never drop context)
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

      // Debug minimal log to help diagnose future issues
      try { console.debug("[AIChat] Payload context keys:", Object.keys(payload.context)); } catch (_e) { void _e; }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
              friendly = t('chat.toasts.invalidJson') || 'El modelo devolvió un formato inesperado. Intenta de nuevo.';
            } else if (data.error.includes('Contrato inválido')) {
              friendly = t('chat.toasts.invalidContract') || 'La respuesta no cumplió el contrato esperado. Ajusté reglas y puedes reintentar.';
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

        try { toast({ variant: 'destructive', title: t('chat.toasts.errorTitle'), description: friendly }); } catch (_e) { void _e; }
        setMessages((prev) => ([
          ...prev,
          { role: 'assistant', content: `Error: ${res.status}. ${friendly}` },
        ]));
        setIsSending(false);
        return;
      }

      const json = await res.json();
      setResult(json);
      // Success toast
      try { toast({ title: t('chat.toasts.successTitle'), description: t('chat.toasts.successDesc') }); } catch (_e) { void _e; }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t('results.title') + ": " + t('results.description') },
      ]);
    } catch (_e) {
      try { toast({ title: t('chat.toasts.errorTitle'), description: t('chat.toasts.errorDesc'), variant: 'destructive' }); } catch (_e2) { void _e2; }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t('saveDraftDialog.toasts.error') + ": " + t('saveDraftDialog.toasts.saveError') },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="font-medium"></div>
      <div className="flex w-full justify-end">
        <div className="w-full max-w-2xl">
          <Conversation className="relative w-full rounded-xl border bg-background shadow-sm" style={{ height: "12rem" }}>
            <ConversationContent>
              {messages.length === 0
                ? null
                : messages.map((m, i) => (
                    <Message key={i} from={m.role}>
                      <MessageContent>{m.content}</MessageContent>
                    </Message>
                  ))}
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

      <div className="mt-4 flex w-full justify-end">
        <div className="w-full max-w-2xl">
          <PromptInput
            onSubmit={(_message, _event) => {
              onSend();
            }}
            className="relative"
          >
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={t('chat.inputPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                ref={inputRef}
                autoFocus
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>{/* Tools/menus can be added later */}</PromptInputTools>
              <PromptInputSubmit
                disabled={isSending || input.trim().length === 0}
                status={isSending ? 'submitted' : undefined}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
