"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Sparkles, FileText, MessageSquare, HelpCircle } from "lucide-react";
import ImportExamDialog from "@/app/[locale]/dashboard/exams/components/ImportExamDialog";

interface ExamCreationDrawerProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

export function ExamCreationDrawer({ open, onOpenChange }: ExamCreationDrawerProps) {
  const t = useTranslations("onboarding.examCreationDrawer");
  const router = useRouter();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExampleImage, setShowExampleImage] = useState(false);

  const handleImportClick = () => {
    onOpenChange(false);
    setShowImportDialog(true);
  };

  const handleAIClick = () => {
    onOpenChange(false);
    router.push("/dashboard/exams/ai-exams-creation-chat");
  };

  const handleImportSuccess = (data: { importId: string }) => {
    setShowImportDialog(false);
    router.push(`/dashboard/exams/create?importId=${data.importId}` as "/dashboard/exams/create");
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] max-w-4xl mx-auto bg-card">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-xl">{t("title")}</DrawerTitle>
            <DrawerDescription>{t("subtitle")}</DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-8">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Import Option */}
              <div className="relative">
                <button
                  onClick={handleImportClick}
                  className="group relative flex flex-col items-center p-6 rounded-xl border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full"
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t("import.title")}</h3>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {t("import.description")}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>PDF, DOCX</span>
                  </div>
                </button>
                {/* Help icon to show example */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExampleImage(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                  title={t("import.showExample")}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* AI Generation Option */}
              <button
                onClick={handleAIClick}
                className="group relative flex flex-col items-center p-6 rounded-xl border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {t("ai.badge")}
                </div>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("ai.title")}</h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {t("ai.description")}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{t("ai.chatHint")}</span>
                </div>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ImportExamDialog
        _open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={handleImportSuccess}
      />

      {/* Example Image Dialog */}
      <Dialog open={showExampleImage} onOpenChange={setShowExampleImage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("import.exampleTitle")}</DialogTitle>
            <DialogDescription>{t("import.exampleCaption")}</DialogDescription>
          </DialogHeader>
          <div className="relative w-full">
            <Image
              src="/images/onboarding/import-example.png"
              alt={t("import.exampleAlt")}
              width={800}
              height={600}
              className="rounded-lg border w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
