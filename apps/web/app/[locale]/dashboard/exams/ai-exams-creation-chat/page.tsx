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
    <div className="space-y-1 sm:space-y-4">
      {/* Header - Top Row with Back Button and Language Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/exams")}
          className="hidden sm:inline-flex"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("header.back")}
        </Button>

        <div className="flex items-center justify-center gap-4 px-6 sm:gap-2 sm:px-0 sm:justify-end">
          <LanguageSelector
            value={languageOverride}
            onValueChange={(value) => setLanguageOverride(value)}
          />

          <Button
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            className="flex-1 sm:flex-none"
          >
            {t("header.clearChat")}
          </Button>
          <Button
            onClick={() => setShowSaveDraftDialog(true)}
            className="flex-1 sm:flex-none"
          >
            {t("header.saveDraft")}
          </Button>
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center sm:text-left">
        <h2 className="text-base font-bold tracking-tight sm:text-3xl">
          {t("header.title")}
        </h2>
        <p className="hidden text-muted-foreground sm:block">
          {t("header.description")}
        </p>
      </div>

      <div className="border-t border-black/50 dark:border-white/50"></div>

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
