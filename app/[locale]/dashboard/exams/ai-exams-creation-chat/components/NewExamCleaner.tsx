import React from "react";
import { useSearchParams } from "next/navigation";
import { useAIChat } from "./AIChatContext";
import { clearPersistedAIExamDraft } from "./AIChatContext";
import { clearPersistedMessages } from "../hooks/useChatMessages";
import { clearLastDocumentContext } from "@/lib/persistence/browser";
import { clearIndexedDBStores } from "../utils/indexeddb-helpers";

/**
 * Component that clears all localStorage and state when creating a NEW exam (no examId)
 * Must be inside AIChatProvider to access setResult
 */
export function NewExamCleaner() {
  const searchParams = useSearchParams();
  const { setResult } = useAIChat();
  const examId = searchParams?.get("examId");

  React.useEffect(() => {
    const clearOnNewExam = async () => {
      // Only clear if there's NO examId (creating new exam)
      if (!examId) {
        try {
          // Check if already cleared in this session
          const clearedKey = 'pv:cleared-on-new-exam';
          if (typeof window !== 'undefined') {
            const alreadyCleared = sessionStorage.getItem(clearedKey);
            if (alreadyCleared) return;

            // Mark as cleared
            sessionStorage.setItem(clearedKey, 'true');
          }

          // Clear in-memory state first
          setResult(null);

          // Clear all persisted data silently
          clearPersistedAIExamDraft();
          clearLastDocumentContext();
          clearPersistedMessages();
          await clearIndexedDBStores();
        } catch (_e) {
          void _e; // Silent fail
        }
      } else {
        // Clear the flag if we have an examId (editing mode)
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pv:cleared-on-new-exam');
          }
        } catch (_e) {
          void _e;
        }
      }
    };
    clearOnNewExam();
  }, [examId, setResult]);

  return null;
}
