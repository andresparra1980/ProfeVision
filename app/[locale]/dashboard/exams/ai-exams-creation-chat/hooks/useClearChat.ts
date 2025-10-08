import React from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { clearPersistedAIExamDraft } from "../components/AIChatContext";
import { clearLastDocumentContext } from "@/lib/persistence/browser";
import { clearIndexedDBStores } from "../utils/indexeddb-helpers";

/**
 * Hook to handle clearing chat and all persisted data
 */
export function useClearChat() {
  const t = useTranslations("ai_exams_chat");
  const [clearing, setClearing] = React.useState(false);

  const handleClearChat = React.useCallback(async () => {
    setClearing(true);
    try {
      // Clear local draft JSON
      clearPersistedAIExamDraft();
      // Clear last document context (single and multi)
      clearLastDocumentContext();
      // Clear IndexedDB docs and outputs
      await clearIndexedDBStores();

      toast.success(t("clearToasts.successTitle"), {
        description: t("clearToasts.successDesc"),
      });

      // Reload to ensure all client state/UI resets immediately
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (_e) {
      toast.error(t("clearToasts.errorTitle"), {
        description: t("clearToasts.errorDesc"),
      });
    } finally {
      setClearing(false);
    }
  }, [t]);

  return { clearing, handleClearChat };
}
