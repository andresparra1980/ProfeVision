"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfesor } from "@/lib/hooks/useProfesor";

import ChatPanel from "./components/ChatPanel";
import { AIChatProvider } from "./components/AIChatContext";
import { SaveDraftDialog } from "./components/SaveDraftDialog";
import { ClearChatDialog } from "./components/ClearChatDialog";
import { DraftLoader } from "./components/DraftLoader";
import { NewExamCleaner } from "./components/NewExamCleaner";
import { LanguageSelector } from "./components/LanguageSelector";
import { useExamDraft } from "./hooks/useExamDraft";
import { useClearChat } from "./hooks/useClearChat";

const LANGUAGE_OVERRIDE_KEY = 'ai_chat_language_override';

export default function AIExamsCreationChatPage() {
  const router = useRouter();
  const t = useTranslations("ai_exams_chat");
  const { profesor } = useProfesor();

  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);
  const [_loadedExamId, setLoadedExamId] = React.useState<string | null>(null);

  // Language override state with localStorage persistence
  const [languageOverride, setLanguageOverride] = React.useState<'auto' | 'es' | 'en' | 'fr' | 'pt'>('auto');

  // Load and persist language override from/to localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_OVERRIDE_KEY);
      if (['auto', 'es', 'en', 'fr', 'pt'].includes(stored as string)) {
        setLanguageOverride(stored as 'auto' | 'es' | 'en' | 'fr' | 'pt');
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_OVERRIDE_KEY, languageOverride);
    } catch {
      // ignore
    }
  }, [languageOverride]);

  // Load materias, grupos, and editing exam state
  const { materias, grupos, editingExam, setEditingExam } = useExamDraft(profesor?.id);

  // Clear chat logic
  const { clearing, handleClearChat } = useClearChat();

  return (
    <div className="space-y-4 sm:space-y-6 [--chat-accent:14_116_144] [--chat-accent-soft:240_253_250] [--chat-accent-border:167_243_208] [--chat-accent-ink:15_118_110] dark:[--chat-accent-soft:15_23_42] dark:[--chat-accent-border:31_41_55] dark:[--chat-accent-ink:153_246_228]">
      <div className="rounded-[28px] border border-black/10 bg-gradient-to-br from-white via-white to-[rgb(var(--chat-accent-soft))] px-4 py-4 shadow-sm dark:border-white/10 dark:from-zinc-950 dark:via-zinc-950 dark:to-[rgb(var(--chat-accent-soft))] sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/exams")}
          className="hidden rounded-full border border-black/10 bg-white/80 text-foreground shadow-sm hover:bg-white dark:border-white/10 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 sm:inline-flex"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("header.back")}
        </Button>

          <div className="order-3 text-center sm:order-2 sm:flex-1 sm:text-left">
            <div className="inline-flex items-center rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
              {t("header.title")}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("header.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("header.description")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 px-1 sm:order-3 sm:justify-end sm:px-0">
          <LanguageSelector
            value={languageOverride}
            onValueChange={(value) => setLanguageOverride(value)}
          />

          <Button
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            className="flex-1 rounded-full sm:flex-none"
          >
            {t("header.clearChat")}
          </Button>
          <Button
            onClick={() => setShowSaveDraftDialog(true)}
            className="flex-1 rounded-full bg-[rgb(var(--chat-accent))] text-white hover:bg-[rgb(var(--chat-accent-ink))] sm:flex-none"
          >
            {t("header.saveDraft")}
          </Button>
        </div>
      </div>
      </div>

      {/* Chat and dialogs inside Provider */}
      <AIChatProvider languageOverride={languageOverride}>
        <NewExamCleaner />
        <ChatPanel onOpenSaveDraft={() => setShowSaveDraftDialog(true)} />

        <SaveDraftDialog
          open={showSaveDraftDialog}
          onOpenChange={setShowSaveDraftDialog}
          materias={materias}
          grupos={grupos}
          existing={editingExam}
        />

        <DraftLoader
          setEditingExam={setEditingExam}
          setLoadedExamId={setLoadedExamId}
        />
      </AIChatProvider>

      {/* Clear Chat Confirmation Dialog */}
      <ClearChatDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={handleClearChat}
        clearing={clearing}
      />
    </div>
  );
}
