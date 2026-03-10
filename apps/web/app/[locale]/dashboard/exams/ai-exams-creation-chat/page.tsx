"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useProfesor } from "@/lib/hooks/useProfesor";

import ChatPanel from "./components/ChatPanel";
import { AIChatProvider } from "./components/AIChatContext";
import { SaveDraftDialog } from "./components/SaveDraftDialog";
import { ClearChatDialog } from "./components/ClearChatDialog";
import { DraftLoader } from "./components/DraftLoader";
import { NewExamCleaner } from "./components/NewExamCleaner";
import { chatAccentThemeClassName } from "./components/chat-accent-theme";
import { useExamDraft } from "./hooks/useExamDraft";
import { useClearChat } from "./hooks/useClearChat";

export default function AIExamsCreationChatPage() {
  const t = useTranslations("ai_exams_chat");
  const { profesor } = useProfesor();

  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);
  const [_loadedExamId, setLoadedExamId] = React.useState<string | null>(null);

  const languageOverride = 'auto' as const;

  // Load materias, grupos, and editing exam state
  const { materias, grupos, editingExam, setEditingExam } = useExamDraft(profesor?.id);

  // Clear chat logic
  const { clearing, handleClearChat } = useClearChat();

  return (
    <div className={`space-y-4 sm:space-y-6 ${chatAccentThemeClassName}`}>
      <div className="rounded-[28px] border border-black/10 bg-gradient-to-br from-white via-white to-[rgb(var(--chat-accent-soft))] px-4 py-4 shadow-sm dark:border-white/10 dark:from-zinc-950 dark:via-zinc-950 dark:to-[rgb(var(--chat-accent-soft))] sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
              {t("header.title")}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-1 sm:justify-end sm:px-0">
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
