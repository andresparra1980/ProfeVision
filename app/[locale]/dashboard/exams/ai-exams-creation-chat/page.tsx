"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfesor } from "@/lib/hooks/useProfesor";

import ChatPanel from "./components/ChatPanel";
import { AIChatProvider } from "./components/AIChatContext";
import { SaveDraftDialog } from "./components/SaveDraftDialog";
import { ClearChatDialog } from "./components/ClearChatDialog";
import { DraftLoader } from "./components/DraftLoader";
import { useExamDraft } from "./hooks/useExamDraft";
import { useClearChat } from "./hooks/useClearChat";

export default function AIExamsCreationChatPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ai_exams_chat");
  const { profesor } = useProfesor();

  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);
  const [_loadedExamId, setLoadedExamId] = React.useState<string | null>(null);

  // Load materias, grupos, and editing exam state
  const { materias, grupos, editingExam, setEditingExam } = useExamDraft(profesor?.id);

  // Clear chat logic
  const { clearing, handleClearChat } = useClearChat();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/exams")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("header.back")}
        </Button>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("header.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("header.description", { locale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowClearDialog(true)}>
            {t("header.clearChat")}
          </Button>
          <Button onClick={() => setShowSaveDraftDialog(true)}>
            {t("header.saveDraft")}
          </Button>
        </div>
      </div>
      <div className="border-t border-black/50 dark:border-white/50"></div>

      {/* Chat and dialogs inside Provider */}
      <AIChatProvider>
        <ChatPanel />

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
