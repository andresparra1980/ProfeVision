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
import { Noto_Sans } from "next/font/google";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip, ListChecks, X as XIcon, FileText } from "lucide-react";
import ResultsView from "./ResultsView";
import {
  saveLastDocumentsContext,
  clearLastDocumentContext,
  saveDocument,
  loadDocument,
  deleteDocument,
  deleteOutput,
} from "@/lib/persistence/browser";
import { v4 as uuidv4 } from "uuid";
import { useBackgroundSummarization } from "@/lib/hooks/useBackgroundSummarization";

const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

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
  const [resultsOpen, setResultsOpen] = useState(false);
  const promptWrapRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [padBottom, setPadBottom] = useState<number>(0);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const convHeight = useMemo(() => {
    const mh = typeof minHeight === 'number' ? minHeight : 0;
    const h = Math.max(240, mh - padBottom); // exact calculation without extra gap
    return h;
  }, [minHeight, padBottom]);
  // Document context (moved from DocumentContextBar)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [_uploadError, setUploadError] = useState<string | null>(null); // underscore to satisfy lint
  const [docMeta, setDocMeta] = useState<Record<string, { fileName?: string; mime?: string }>>({});
  const [summariesAvailability, setSummariesAvailability] = useState<Record<string, boolean>>({});
  const { jobs, addJob, getSummary } = useBackgroundSummarization();
  // Derived counts for results glow
  const resultsCount = (result?.exam?.questions?.length ?? 0);
  const hasResults = resultsCount > 0;

  // Focus input by default when the component mounts
  useEffect(() => {
    try { inputRef.current?.focus(); } catch (_e) { void _e; }
  }, []);

  // Load existing document context on mount
  useEffect(() => {
    const ctx = loadLastDocumentsContext();
    if (ctx?.documentIds?.length) setDocumentIds(ctx.documentIds.slice(0, 5));
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
        // Account for prompt being sticky to viewport bottom, not container bottom
        const mh = Math.max(0, Math.floor(vh - top - promptHeight + 80)); 
        setMinHeight(mh);
      } catch { /* ignore */ }
    }
    updatePadding();
    updateMinHeight();
    const ro = new ResizeObserver(() => updatePadding());
    const node = promptWrapRef.current;
    if (node) ro.observe(node);
    window.addEventListener('resize', updatePadding);
    window.addEventListener('resize', updateMinHeight);
    return () => {
      try { if (node) ro.unobserve(node); } catch { /* ignore */ }
      ro.disconnect();
      window.removeEventListener('resize', updatePadding);
      window.removeEventListener('resize', updateMinHeight);
    };
  }, [input, documentIds.length]);

  // Load metadata and summary availability when documentIds change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metaMap: Record<string, { fileName?: string; mime?: string }> = {};
      const availMap: Record<string, boolean> = {};
      for (const id of documentIds) {
        try {
          const doc = await loadDocument<{ text?: string; meta?: { fileName?: string; mime?: string } }>(id);
          if (doc?.meta) metaMap[id] = { fileName: doc.meta.fileName, mime: doc.meta.mime };
        } catch { /* ignore */ }
        try {
          const s = await getSummary(id);
          availMap[id] = !!s;
        } catch { availMap[id] = false; }
      }
      if (!cancelled) { setDocMeta(metaMap); setSummariesAvailability(availMap); }
    })();
    return () => { cancelled = true; };
  }, [documentIds, getSummary]);

  // Refresh availability when background jobs progress (e.g., a summary completes)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (documentIds.length === 0) return;
      const availMap: Record<string, boolean> = {};
      for (const id of documentIds) {
        try { availMap[id] = !!(await getSummary(id)); } catch { availMap[id] = false; }
      }
      if (!cancelled) setSummariesAvailability(availMap);
    })();
    return () => { cancelled = true; };
  }, [jobs, documentIds, getSummary]);

  function triggerFilePicker() { fileInputRef.current?.click(); }

  // ===== Summaries UI state and actions =====
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDocId, setSummaryDocId] = useState<string | null>(null);
  const [summaryContent, setSummaryContent] = useState<unknown | null>(null);

  const availableSummaryDocIds = useMemo(
    () => documentIds.filter((id) => summariesAvailability[id]),
    [documentIds, summariesAvailability]
  );

  async function openSummaryDialog(targetId?: string) {
    const id = targetId ?? (summaryDocId ?? documentIds[0] ?? null);
    setSummaryDocId(id);
    setSummaryOpen(true);
    if (!id) return; // no documents yet
    setSummaryLoading(true);
    try {
      const data = await getSummary(id);
      setSummaryContent(data);
    } catch (_e) {
      setSummaryContent(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  // When dialog is open and jobs progress (or user changes selection), re-fetch the summary
  useEffect(() => {
    if (!summaryOpen || !summaryDocId) return;
    let cancelled = false;
    (async () => {
      setSummaryLoading(true);
      try {
        const data = await getSummary(summaryDocId);
        if (!cancelled) setSummaryContent(data);
      } catch {
        if (!cancelled) setSummaryContent(null);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobs, summaryOpen, summaryDocId, getSummary]);

  // --- Lightweight Markdown -> HTML (headings, bold, italic, lists, code) ---
  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mdToHtmlLite(md: string) {
    const lines = md.split(/\r?\n/);
    const out: string[] = [];
    let inList = false;
    let inCode = false;
    for (const raw of lines) {
      const line = raw;
      if (line.trim().startsWith("```") ) {
        if (!inCode) { out.push('<pre><code>'); inCode = true; }
        else { out.push('</code></pre>'); inCode = false; }
        continue;
      }
      if (inCode) { out.push(escapeHtml(line)); continue; }
      // Headings
      const h3 = line.match(/^###\s+(.*)/);
      if (h3) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h3>${escapeHtml(h3[1])}</h3>`); continue; }
      const h2 = line.match(/^##\s+(.*)/);
      if (h2) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h2>${escapeHtml(h2[1])}</h2>`); continue; }
      const h1 = line.match(/^#\s+(.*)/);
      if (h1) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h1>${escapeHtml(h1[1])}</h1>`); continue; }
      // List items
      const li = line.match(/^\s*[-*]\s+(.*)/);
      if (li) {
        if (!inList) { out.push('<ul>'); inList = true; }
        const txt = escapeHtml(li[1])
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');
        out.push(`<li>${txt}</li>`);
        continue;
      } else if (inList && line.trim() === '') {
        out.push('</ul>'); inList = false; continue;
      }
      // Paragraph
      if (line.trim() === '') { if (inList) { out.push('</ul>'); inList = false; } out.push(''); continue; }
      const txt = escapeHtml(line)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      out.push(`<p>${txt}</p>`);
    }
    if (inList) out.push('</ul>');
    if (inCode) out.push('</code></pre>');
    return out.join('\n');
  }

  // Render a structured summary object (like the one returned by summarizer) to HTML
  function buildStructuredSummaryHtml(data: unknown): string | null {
    try {
      const base: unknown = (data as { summary?: unknown } | null | undefined)?.summary ?? data;
      if (!base || typeof base !== 'object') return null;
      const s = base as Record<string, unknown>;
      const parts: string[] = [];
      const generalOverview = typeof s.generalOverview === 'string' ? s.generalOverview : '';
      if (generalOverview.trim()) {
        parts.push(`<h2>Resumen</h2><p>${escapeHtml(generalOverview)}</p>`);
      }
      const academicLevel = typeof s.academicLevel === 'string' ? s.academicLevel : '';
      if (academicLevel.trim()) {
        parts.push(`<p><strong>Nivel académico:</strong> ${escapeHtml(academicLevel)}</p>`);
      }
      const macroTopics = Array.isArray(s.macroTopics) ? (s.macroTopics as unknown[]) : [];
      if (macroTopics.length) {
        parts.push('<h2>Temas principales</h2>');
        for (const mtRaw of macroTopics) {
          const mt = (mtRaw ?? {}) as Record<string, unknown>;
          parts.push('<div class="mt-3 mb-2">');
          const mtName = typeof mt.name === 'string' ? mt.name : undefined;
          const mtImportance = typeof mt.importance === 'string' ? mt.importance : undefined;
          if (mtName) {
            const badge = mtImportance ? ` <span class="inline-block align-middle rounded-full border px-2 py-[2px] text-[10px] ml-2">${escapeHtml(mtImportance)}</span>` : '';
            parts.push(`<h3 class="!mt-0">${escapeHtml(mtName)}${badge}</h3>`);
          }
          const mtDesc = typeof mt.description === 'string' ? mt.description : undefined;
          if (mtDesc) parts.push(`<p>${escapeHtml(mtDesc)}</p>`);
          const microTopics = Array.isArray(mt.microTopics) ? (mt.microTopics as unknown[]) : [];
          if (microTopics.length) {
            parts.push('<ul>');
            for (const micRaw of microTopics) {
              const mic = (micRaw ?? {}) as Record<string, unknown>;
              parts.push('<li>');
              const micName = typeof mic.name === 'string' ? mic.name : undefined;
              if (micName) parts.push(`<p><strong>${escapeHtml(micName)}</strong></p>`);
              const micDesc = typeof mic.description === 'string' ? mic.description : undefined;
              if (micDesc) parts.push(`<p>${escapeHtml(micDesc)}</p>`);
              const keyTerms = Array.isArray(mic.keyTerms) ? (mic.keyTerms as unknown[]) : [];
              if (keyTerms.length) {
                parts.push('<p><em>Términos clave:</em></p><ul>');
                for (const t of keyTerms) parts.push(`<li>${escapeHtml(String(t as string))}</li>`);
                parts.push('</ul>');
              }
              const concepts = Array.isArray(mic.concepts) ? (mic.concepts as unknown[]) : [];
              if (concepts.length) {
                parts.push('<p><em>Conceptos:</em></p><ul>');
                for (const c of concepts) parts.push(`<li>${escapeHtml(String(c as string))}</li>`);
                parts.push('</ul>');
              }
              parts.push('</li>');
            }
            parts.push('</ul>');
          }
          parts.push('</div>');
        }
      }
      if (parts.length === 0) return null;
      return parts.join('\n');
    } catch {
      return null;
    }
  }

  // Normalize various summary payload shapes into display text
  function getSummaryDisplayText(val: unknown): string {
    if (typeof val === 'string') return val;
    if (val == null) return '';
    if (typeof val !== 'object') return String(val);
    const obj = val as Record<string, unknown>;
    const choices = Array.isArray(obj.choices as unknown[]) ? (obj.choices as unknown[]) : [];
    const firstChoice = (choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content;
    const candidates: unknown[] = [
      obj.summary,
      obj.markdown,
      obj.text,
      obj.content,
      obj.output_text,
      obj.result,
      firstChoice,
    ];
    for (const c of candidates) {
      if (typeof c === 'string') return c;
    }
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }

  function formatFileName(name: string, maxLen = 22) {
    if (!name) return name;
    const lastDot = name.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === name.length - 1) {
      return name.length > maxLen ? name.slice(0, maxLen - 1) + "…" : name;
    }
    const base = name.slice(0, lastDot);
    const ext = name.slice(lastDot);
    const budget = Math.max(6, maxLen - ext.length);
    const baseTrunc = base.length > budget ? base.slice(0, budget - 1) + "…" : base;
    return baseTrunc + ext;
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = fileInputRef.current;
    const file = inputEl?.files?.[0] || e.target.files?.[0] || null;
    if (!file) { try { if (inputEl) inputEl.value = ""; } catch { /* ignore */ } return; }
    setUploadError(null);
    if (documentIds.length >= 5) {
      toast({ variant: 'destructive', title: t('context.limitTitle', { fallback: 'Límite alcanzado' }), description: t('context.limitDesc', { fallback: 'Máximo 5 documentos' }) });
      try { if (inputEl) inputEl.value = ""; } catch { /* ignore */ }
      return;
    }
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/extract", { method: "POST", body: form });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { text: string; meta: { mime: string; fileName: string; length: number } };
      const id = `local:${uuidv4()}`;
      await saveDocument(id, { text: data.text, meta: data.meta });
      const next = Array.from(new Set([id, ...documentIds])).slice(0, 5);
      saveLastDocumentsContext({ documentIds: next });
      setDocumentIds(next);
      addJob(id); // start background summarization
    } catch (err) {
      const msg = (err as { message?: string } | undefined)?.message || String(err);
      setUploadError(msg);
      toast({ variant: 'destructive', title: t('context.uploadErrorTitle', { fallback: 'Error al subir' }), description: msg });
    } finally {
      setIsUploading(false);
      try { if (inputEl) inputEl.value = ""; } catch { /* ignore */ }
    }
  }

  async function onDeleteDoc(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await deleteDocument(id);
      await deleteOutput("summary", id);
    } finally {
      const next = documentIds.filter((x) => x !== id);
      setDocumentIds(next);
      if (next.length) saveLastDocumentsContext({ documentIds: next });
      else clearLastDocumentContext();
    }
  }

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
    <div ref={rootRef} className="flex flex-col overflow-x-clip overflow-y-hidden space-y-0" style={{ minHeight }}>
      <div className="flex w-full justify-center">
        <div className="w-full sm:w-[62vw] sm:min-w-[640px] max-w-[1200px]">
          <Conversation
            className={`${notoSans.className} relative w-full rounded-xl bg-transparent backdrop-blur-sm shadow-none overflow-y-auto`}
            style={{ height: convHeight, maxHeight: convHeight }}
          >
            <ConversationContent>
              {messages.length === 0 && input.trim().length === 0
                ? (
                  <ConversationEmptyState>
                    <div className="mx-auto w-full max-w-2xl px-4 py-6">
                      <h3 className="text-2xl font-semibold tracking-tight mb-2">{t('empty.title')}</h3>
                      <p className="text-muted-foreground mb-4">{t('empty.subtitle')}</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => { setInput(t('empty.examples.createExam')); try { inputRef.current?.focus(); } catch { /* ignore */ } }}
                          className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                        >
                          {t('empty.examples.createExam')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInput(t('empty.examples.modifyQuestion')); try { inputRef.current?.focus(); } catch { /* ignore */ } }}
                          className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                        >
                          {t('empty.examples.modifyQuestion')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInput(t('empty.examples.useDocuments')); try { inputRef.current?.focus(); } catch { /* ignore */ } }}
                          className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                        >
                          {t('empty.examples.useDocuments')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInput(t('empty.examples.moreHarder')); try { inputRef.current?.focus(); } catch { /* ignore */ } }}
                          className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                        >
                          {t('empty.examples.moreHarder')}
                        </button>
                      </div>
                    </div>
                  </ConversationEmptyState>
                )
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

      <div className="flex w-full justify-center">
        <div
          ref={promptWrapRef}
          className="w-full max-w-[90vw] md:max-w-[720px] lg:max-w-[800px] xl:max-w-[960px] px-4 sticky bottom-0 z-30"
          style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <PromptInput
            onSubmit={(_message, _event) => {
              onSend();
            }}
            className={`${notoSans.className} relative rounded-2xl border bg-card shadow-sm`}
          >
            <PromptInputBody>
              <div className="relative">
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  className="absolute left-2 top-2 text-muted-foreground hover:text-foreground"
                  title={documentIds.length >= 5 ? t('context.limitDesc', { fallback: 'Máximo 5 documentos' }) : t('context.attach', { fallback: 'Adjuntar documento' })}
                  disabled={isSending || isUploading || documentIds.length >= 5}
                >
                  <Paperclip className="h-6 w-6 top-1 left-1 absolute" />
                </button>
                <PromptInputTextarea
                  placeholder={isSending ? t('chat.waitingPlaceholder', { fallback: 'Esperando respuesta...' }) : t('chat.inputPlaceholder')}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`gap-2 ${hasResults ? 'border-primary text-primary' : ''}`}
                  onClick={() => setResultsOpen(true)}
                  title={hasResults ? t('results.hint') : undefined}
                  aria-label={t('results.title')}
                >
                  <ListChecks className="h-4 w-4" />
                  <span>{t('results.title')}</span>
                  <span className="ml-1">{resultsCount}</span>
                </Button>

                {/* Documents summary icon (muted to not compete with Results) */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={availableSummaryDocIds.length > 0 ? t('context.viewSummary', { fallback: 'Ver resumen' }) : t('context.summaryNotReady', { fallback: 'Resumen aún no disponible' })}
                  onClick={() => openSummaryDialog()}
                  disabled={availableSummaryDocIds.length === 0}
                  className={`relative text-muted-foreground hover:text-foreground`}
                >
                  <FileText className="h-4 w-4" />
                  {availableSummaryDocIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none h-4 min-w-4 px-1">
                      {availableSummaryDocIds.length}
                    </span>
                  )}
                </Button>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp"
                  onChange={onFileSelected}
                  disabled={isUploading || documentIds.length >= 5}
                  className="hidden"
                />
                {/* File chips list */}

                {/* Inline chips for selected docs */}
                {documentIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 ml-2">
                    {documentIds.map((id) => (
                      <div key={id} className="flex items-center gap-2 border px-2 py-1 text-xs bg-background">
                        <span role="img" aria-label="doc">📄</span>
                        <span className="max-w-[160px] truncate" title={docMeta[id]?.fileName || id}>
                          {formatFileName(docMeta[id]?.fileName || id.replace(/^local:/, ""), 18)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {summariesAvailability[id] ? '✔️' : (jobs.find(j => j.documentId === id && (j.status === 'queued' || j.status === 'summarizing')) ? <span style={{ filter: 'grayscale(100%)' }}>🧠</span> : '—')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onDeleteDoc(e, id)}
                          className="ml-1 text-muted-foreground hover:text-red-600"
                          title={t('context.remove', { fallback: 'Quitar' })}
                          disabled={isSending}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isSending || input.trim().length === 0}
                status={isSending ? 'submitted' : undefined}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>

      {/* Results Drawer (bottom sheet) */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="inset-x-0 bottom-4 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-3xl mx-auto rounded-2xl p-4 sm:p-6 shadow-xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-500">
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
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="inset-x-0 bottom-20 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-xl mx-auto rounded-2xl p-4 sm:p-6 shadow-xl z-[60]
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
          data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom
          duration-300">
          <DialogHeader>
            <DialogTitle>{t('context.summaryTitle', { fallback: 'Resumen del documento' })}</DialogTitle>
            <DialogDescription>{t('context.summaryDesc', { fallback: 'Vista previa del resumen generado por IA.' })}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-muted-foreground" htmlFor="summary-doc-select">{t('context.document', { fallback: 'Documento' })}:</label>
            <select
              id="summary-doc-select"
              className="border bg-background rounded px-2 py-1 text-sm"
              value={summaryDocId ?? availableSummaryDocIds[0] ?? ''}
              onChange={(e) => openSummaryDialog(e.target.value)}
              disabled={availableSummaryDocIds.length === 0}
            >
              {availableSummaryDocIds.map((id) => (
                <option key={id} value={id}>{docMeta[id]?.fileName || id.replace(/^local:/, '')}</option>
              ))}
            </select>
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded border p-3 bg-card text-sm prose prose-invert dark:prose-invert">
            {summaryLoading ? (
              <div className="text-muted-foreground">{t('context.loadingSummary', { fallback: 'Cargando resumen...' })}</div>
            ) : summaryContent ? (
              (() => {
                const structured = buildStructuredSummaryHtml(summaryContent);
                const html = structured ?? mdToHtmlLite(String(getSummaryDisplayText(summaryContent)));
                return <div dangerouslySetInnerHTML={{ __html: html }} />;
              })()
            ) : (
              <div className="text-muted-foreground">{t('context.summaryNotReady', { fallback: 'El resumen estará disponible en cuanto termine el procesamiento.' })}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
