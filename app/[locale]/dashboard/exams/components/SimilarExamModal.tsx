"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobsSimilarExamKeys } from "@/lib/ai/similar-exam/utils/i18nKeys";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type StepKey = keyof typeof JobsSimilarExamKeys.steps;

type ProgressEvent = {
  jobId: string;
  stepKey: StepKey;
  status: "started" | "succeeded" | "failed";
  messageKey: string;
  meta?: Record<string, unknown>;
};

interface SimilarExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string;
  onCompleted?: (draftExamId: string) => void;
  onFailed?: (errKey?: string) => void;
  streamUrl?: string;
}

const orderedSteps: StepKey[] = [
  "loadBlueprint",
  "generate",
  "validate",
  "apply",
  "randomize",
  "finalize",
];

function StatusIcon({
  status,
  label,
}: {
  status: "idle" | "started" | "succeeded" | "failed";
  label?: string;
}) {
  const common = "h-5 w-5";
  if (status === "started") {
    return (
      <span className="inline-flex items-center gap-2" aria-live="polite">
        <Loader2 className={`${common} animate-spin text-primary`} aria-hidden="true" />
        {label ? <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span> : null}
      </span>
    );
  }
  if (status === "succeeded") {
    return (
      <span className="inline-flex items-center gap-2" aria-live="polite">
        <CheckCircle className={`${common} text-green-600 dark:text-green-500`} aria-hidden="true" />
        {label ? <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span> : null}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-2" aria-live="polite">
        <XCircle className={`${common} text-destructive`} aria-hidden="true" />
        {label ? <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Minus className={`${common} text-muted-foreground`} aria-hidden="true" />
      {label ? <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span> : null}
    </span>
  );
}

export default function SimilarExamModal({
  open,
  onOpenChange,
  jobId,
  onCompleted,
  onFailed,
  streamUrl,
}: SimilarExamModalProps) {
  // Namespace is the filename: jobs-similar-exam
  // Keys in JSON start with jobs.similarExam.*
  const tJobs = useTranslations("jobs-similar-exam");
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [errorKey, setErrorKey] = useState<string | undefined>();
  const terminalHandledRef = useRef(false);

  useEffect(() => {
    if (!open || !jobId) return;

    setEvents([]);
    setStatus("running");
    setErrorKey(undefined);

    const url = streamUrl || `/api/exams/similar/stream?jobId=${encodeURIComponent(jobId)}`;
    const src = new EventSource(url);

    const onProgress = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as ProgressEvent;
        setEvents((prev) => [...prev, data]);
      } catch {
        // ignore parse errors
      }
    };
    const cleanupAndClose = () => {
      try { src.close(); } catch {}
      src.removeEventListener("progress", onProgress as EventListener);
      src.removeEventListener("completed", onCompletedHandler as EventListener);
      src.removeEventListener("failed", onFailedHandler as EventListener);
      src.removeEventListener("error", onError as EventListener);
    };

    const onCompletedHandler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { jobId: string; draftExamId: string };
        setStatus("completed");
        if (!terminalHandledRef.current) {
          terminalHandledRef.current = true;
          // Toast success
          toast({ title: tJobs("jobs.similarExam.status.succeeded") });
          if (onCompleted) onCompleted(data.draftExamId);
          // Redirect to edit page for the new draft
          router.push({ pathname: "/dashboard/exams/[id]/edit", params: { id: data.draftExamId } });
        }
        cleanupAndClose();
      } catch {
        // ignore parse error
      }
    };
    const onFailedHandler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { messageKey?: string };
        setStatus("failed");
        setErrorKey(data.messageKey);
        if (!terminalHandledRef.current) {
          terminalHandledRef.current = true;
          // Toast error
          toast({
            variant: "destructive",
            title: tJobs("jobs.similarExam.status.failed"),
            description: data.messageKey ? tJobs(data.messageKey as any) : undefined,
          });
          if (onFailed) onFailed(data.messageKey);
        }
        cleanupAndClose();
      } catch {
        // ignore parse error
      }
    };
    const onError = () => {
      // Avoid spamming on transient EventSource errors or after terminal state
      if (terminalHandledRef.current || status === "completed" || status === "failed") return;
      setStatus("failed");
      setErrorKey(JobsSimilarExamKeys.errors.unknown);
      toast({ variant: "destructive", title: tJobs("jobs.similarExam.status.failed"), description: tJobs(JobsSimilarExamKeys.errors.unknown) });
      if (onFailed) onFailed(JobsSimilarExamKeys.errors.unknown);
      try { src.close(); } catch {}
    };

    src.addEventListener("progress", onProgress as EventListener);
    src.addEventListener("completed", onCompletedHandler as EventListener);
    src.addEventListener("failed", onFailedHandler as EventListener);
    src.addEventListener("error", onError as EventListener);

    return () => {
      src.removeEventListener("progress", onProgress as EventListener);
      src.removeEventListener("completed", onCompletedHandler as EventListener);
      src.removeEventListener("failed", onFailedHandler as EventListener);
      src.removeEventListener("error", onError as EventListener);
      src.close();
    };
  }, [open, jobId, onCompleted, onFailed]);

  const stepStatusMap = useMemo(() => {
    const acc: Record<StepKey, "idle" | "started" | "succeeded" | "failed"> = {
      loadBlueprint: "idle",
      generate: "idle",
      validate: "idle",
      apply: "idle",
      randomize: "idle",
      finalize: "idle",
    };
    for (const ev of events) {
      acc[ev.stepKey] = ev.status;
    }
    return acc;
  }, [events]);

  const totalSteps = orderedSteps.length;
  const completedCount = useMemo(
    () => orderedSteps.filter((k) => stepStatusMap[k] === "succeeded").length,
    [stepStatusMap]
  );
  const progressValue = Math.round((completedCount / totalSteps) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tJobs("jobs.similarExam.title")}</DialogTitle>
          <DialogDescription>
            {status === "running" && tJobs("jobs.similarExam.status.started")}
            {status === "completed" && tJobs("jobs.similarExam.status.succeeded")}
            {status === "failed" && tJobs("jobs.similarExam.status.failed")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {orderedSteps.map((k) => {
            const st = stepStatusMap[k];
            return (
              <div
                key={k}
                className={`flex items-center justify-between p-2 border rounded-md bg-muted/30 transition-colors ${
                  st === "started" ? "border-primary/50 bg-primary/5" : ""
                }`}
                aria-current={st === "started" ? "step" : undefined}
              >
                <div className="text-sm font-medium flex items-center gap-2">
                  {st === "started" && (
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse"
                      aria-hidden="true"
                    />
                  )}
                  {tJobs(`jobs.similarExam.steps.${k}` as any)}
                </div>
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <StatusIcon
                            status={st}
                            label={
                              st === "started"
                                ? tJobs("jobs.similarExam.status.started")
                                : st === "succeeded"
                                ? tJobs("jobs.similarExam.status.succeeded")
                                : st === "failed"
                                ? tJobs("jobs.similarExam.status.failed")
                                : undefined
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">
                          {st === "started"
                            ? tJobs("jobs.similarExam.status.started")
                            : st === "succeeded"
                            ? tJobs("jobs.similarExam.status.succeeded")
                            : st === "failed"
                            ? tJobs("jobs.similarExam.status.failed")
                            : tJobs("jobs.similarExam.status.idle")}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {status === "running" && tJobs("jobs.similarExam.status.started")}
              {status === "completed" && tJobs("jobs.similarExam.status.succeeded")}
              {status === "failed" && tJobs("jobs.similarExam.status.failed")}
            </span>
            <span>
              {completedCount}/{totalSteps}
            </span>
          </div>
          <Progress value={progressValue} aria-label="progress" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tJobs("jobs.similarExam.status.started")}
          </Button>
          {status === "failed" && (
            <Button onClick={() => onOpenChange(false)}>
              {tJobs("jobs.similarExam.status.failed")}
            </Button>
          )}
          {status === "completed" && (
            <Button onClick={() => onOpenChange(false)}>
              {tJobs("jobs.similarExam.status.succeeded")}
            </Button>
          )}
        </div>

        {status === "failed" && (
          <div className="text-sm text-destructive mt-2">
            {errorKey}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
