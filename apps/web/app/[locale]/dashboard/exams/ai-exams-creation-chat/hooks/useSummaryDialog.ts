import { useEffect, useMemo, useRef, useState } from 'react';

interface UseSummaryDialogProps {
  documentIds: string[];
  summariesAvailability: Record<string, boolean>;
  jobs: Array<{ documentId: string; status: string }>;
  getSummary: (_id: string) => Promise<unknown>;
}

export function useSummaryDialog({
  documentIds,
  summariesAvailability,
  jobs,
  getSummary,
}: UseSummaryDialogProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDocId, setSummaryDocId] = useState<string | null>(null);
  const [summaryContent, setSummaryContent] = useState<unknown | null>(null);
  const requestVersionRef = useRef(0);

  const availableSummaryDocIds = useMemo(
    () => documentIds.filter((id) => summariesAvailability[id]),
    [documentIds, summariesAvailability]
  );

  useEffect(() => {
    if (!summaryDocId) return;
    if (documentIds.includes(summaryDocId)) return;
    setSummaryDocId(availableSummaryDocIds[0] ?? documentIds[0] ?? null);
    setSummaryContent(null);
  }, [summaryDocId, documentIds, availableSummaryDocIds]);

  const openSummaryDialog = (targetId?: string) => {
    const safeCurrentId = summaryDocId && documentIds.includes(summaryDocId) ? summaryDocId : null;
    const id =
      targetId ??
      safeCurrentId ??
      availableSummaryDocIds[0] ??
      documentIds[0] ??
      null;
    setSummaryOpen(true);
    setSummaryDocId(id);
  };

  // When dialog is open and jobs progress (or user changes selection), re-fetch the summary
  useEffect(() => {
    if (!summaryOpen || !summaryDocId) return;
    let cancelled = false;
    const requestVersion = ++requestVersionRef.current;

    (async () => {
      setSummaryLoading(true);
      try {
        const data = await getSummary(summaryDocId);
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setSummaryContent(data);
        }
      } catch {
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setSummaryContent(null);
        }
      } finally {
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setSummaryLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobs, summaryOpen, summaryDocId, getSummary]);

  return {
    summaryOpen,
    setSummaryOpen,
    summaryLoading,
    summaryDocId,
    summaryContent,
    availableSummaryDocIds,
    openSummaryDialog,
  };
}
