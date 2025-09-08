"use client";
import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { loadSettings, loadLastDocumentsContext, loadOutput } from "@/lib/persistence/browser";
import { useAIChat } from "./AIChatContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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
      const topicSummaries: Array<{ documentId: string; summary: any }> = [];
      for (const docId of documentIds) {
        try {
          const out = await loadOutput<any>("summary", docId);
          if (out?.summary) topicSummaries.push({ documentId: docId, summary: out.summary });
        } catch (_e) {
          // ignore if not found or IndexedDB error
        }
      }
      // Sanitize existing exam to match API contract shape to avoid stringify or schema issues
      const allowedDifficulty = new Set(["easy", "medium", "hard"]);
      const sanitizeExistingExam = (obj: any) => {
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
      const tryStringify = (p: any) => {
        try {
          return JSON.stringify(p);
        } catch {
          const { existingExam: _ex, ...rest } = p.context || {};
          const minimal = { ...p, context: rest };
          return JSON.stringify(minimal);
        }
      };

      // Debug minimal log to help diagnose future issues
      try { console.debug("[AIChat] Payload context keys:", Object.keys(payload.context)); } catch {}

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: tryStringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${res.status}. ${errText || t('saveDraftDialog.toasts.saveError')}` },
        ]);
        setIsSending(false);
        return;
      }

      const json = await res.json();
      setResult(json);
      // Success toast
      try { toast({ title: t('chat.toasts.successTitle'), description: t('chat.toasts.successDesc') }); } catch {}
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t('results.title') + ": " + t('results.description') },
      ]);
    } catch (_e) {
      try { toast({ title: t('chat.toasts.errorTitle'), description: t('chat.toasts.errorDesc'), variant: 'destructive' }); } catch {}
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
      <div className="font-medium">{t('chat.title')}</div>
      <div className="h-64 overflow-auto rounded bg-muted/30 p-2 space-y-2 text-sm">
        {messages.length === 0 ? (
          <div className="text-muted-foreground">{t('chat.inputPlaceholder')}</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="font-semibold">{m.role === "user" ? 'Tú' : m.role === "assistant" ? 'Asistente' : 'Sistema'}:</span>{" "}
              {m.content}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 min-h-20 rounded border p-2 text-sm"
          placeholder={t('chat.inputPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="h-10 shrink-0 rounded bg-primary px-3 text-primary-foreground disabled:opacity-50"
          onClick={onSend}
          disabled={isSending || input.trim().length === 0}
        >
          {isSending ? "…" : t('chat.send')}
        </button>
      </div>
    </div>
  );
}
