"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileText,
  Send,
  Download,
  ScanLine,
  X,
  Sparkles,
} from "lucide-react";
import { ExamCreationDrawer } from "./exam-creation-drawer";

type ChecklistItemKey = "exam_created" | "exam_published" | "pdf_exported" | "first_scan";

interface ChecklistItemData {
  key: ChecklistItemKey;
  icon: React.ReactNode;
  completed: boolean;
  route?: string;
}

export function OnboardingChecklist() {
  const t = useTranslations("onboarding.checklist");
  const router = useRouter();
  const pathname = usePathname();
  const { 
    onboardingStatus, 
    isLegacyUser, 
    checklistComplete,
    completeChecklistItem,
    isLoading,
  } = useOnboarding();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("onboarding_checklist_dismissed") === "true";
    }
    return false;
  });
  const [checkingProgress, setCheckingProgress] = useState(true);
  const [showExamDrawer, setShowExamDrawer] = useState(false);
  const [itemsStatus, setItemsStatus] = useState<Record<ChecklistItemKey, boolean>>({
    exam_created: false,
    exam_published: false,
    pdf_exported: false,
    first_scan: false,
  });
  
  const lastCheckedPathRef = useRef<string | null>(null);
  const dismissedOnPathRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  // Check actual progress from database
  const checkProgress = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingProgress(false);
        return;
      }

      // Check if user has created any exam
      const { count: examCount } = await supabase
        .from("examenes")
        .select("*", { count: "exact", head: true })
        .eq("profesor_id", user.id);

      // Check if user has published any exam (estado = 'publicado')
      const { count: publishedCount } = await supabase
        .from("examenes")
        .select("*", { count: "exact", head: true })
        .eq("profesor_id", user.id)
        .eq("estado", "publicado");

      // Check if user has any exam results (indicates scanning)
      const { count: scanCount } = await supabase
        .from("resultados_examen")
        .select("*, examenes!inner(profesor_id)", { count: "exact", head: true })
        .eq("examenes.profesor_id", user.id);

      const newStatus = {
        exam_created: (examCount ?? 0) > 0,
        exam_published: (publishedCount ?? 0) > 0,
        pdf_exported: onboardingStatus?.checklist_items?.pdf_exported ?? false,
        first_scan: (scanCount ?? 0) > 0,
      };

      setItemsStatus(newStatus);

      // Update checklist items in DB if they changed (don't await, fire and forget)
      for (const [key, value] of Object.entries(newStatus)) {
        const savedValue = onboardingStatus?.checklist_items?.[key as ChecklistItemKey];
        if (value && !savedValue) {
          completeChecklistItem(key as ChecklistItemKey);
        }
      }
    } catch (error) {
      console.error("Error checking progress:", error);
    } finally {
      setCheckingProgress(false);
      isCheckingRef.current = false;
    }
  }, [onboardingStatus?.checklist_items, completeChecklistItem]);

  // Check on mount, route change, and when page becomes visible
  useEffect(() => {
    if (isLoading || isLegacyUser) {
      setCheckingProgress(false);
      return;
    }

    // Only check if pathname changed
    if (lastCheckedPathRef.current !== pathname) {
      lastCheckedPathRef.current = pathname;
      checkProgress();
      
      // Reappear if dismissed and navigated to different route (unless steps 1-3 complete)
      if (isDismissed && dismissedOnPathRef.current && dismissedOnPathRef.current !== pathname) {
        const firstThreeComplete = itemsStatus.exam_created && itemsStatus.exam_published && itemsStatus.pdf_exported;
        if (!firstThreeComplete) {
          setIsDismissed(false);
          dismissedOnPathRef.current = null;
        }
      }
    }

    // Refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading && !isLegacyUser) {
        checkProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoading, isLegacyUser, checkProgress, pathname, isDismissed, itemsStatus.exam_created, itemsStatus.exam_published, itemsStatus.pdf_exported]);

  // Sync pdf_exported from context when it changes (for immediate UI update)
  useEffect(() => {
    if (onboardingStatus?.checklist_items?.pdf_exported && !itemsStatus.pdf_exported) {
      setItemsStatus(prev => ({ ...prev, pdf_exported: true }));
    }
  }, [onboardingStatus?.checklist_items?.pdf_exported, itemsStatus.pdf_exported]);

  // Don't show for legacy users or if dismissed
  if (isLegacyUser || isDismissed || isLoading || checkingProgress) {
    return null;
  }

  // Don't show if wizard not completed yet
  if (!onboardingStatus?.wizard_completed) {
    return null;
  }

  // Don't show if all items complete
  if (checklistComplete) {
    return null;
  }

  const items: ChecklistItemData[] = [
    {
      key: "exam_created",
      icon: <FileText className="h-4 w-4" />,
      completed: itemsStatus.exam_created,
      route: "/dashboard/exams/create",
    },
    {
      key: "exam_published",
      icon: <Send className="h-4 w-4" />,
      completed: itemsStatus.exam_published,
      route: "/dashboard/exams",
    },
    {
      key: "pdf_exported",
      icon: <Download className="h-4 w-4" />,
      completed: itemsStatus.pdf_exported,
      route: "/dashboard/exams",
    },
    {
      key: "first_scan",
      icon: <ScanLine className="h-4 w-4" />,
      completed: itemsStatus.first_scan,
    },
  ];

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = (completedCount / items.length) * 100;

  const handleItemClick = (item: ChecklistItemData) => {
    // Special handling for exam creation - open drawer instead of navigating
    if (item.key === "exam_created") {
      setShowExamDrawer(true);
      return;
    }
    if (item.route) {
      router.push(item.route as "/dashboard/exams/create" | "/dashboard/exams");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    dismissedOnPathRef.current = pathname;
    
    // Only persist to localStorage if steps 1-3 are complete (permanent dismiss)
    const firstThreeComplete = itemsStatus.exam_created && itemsStatus.exam_published && itemsStatus.pdf_exported;
    if (firstThreeComplete) {
      localStorage.setItem("onboarding_checklist_dismissed", "true");
    }
  };

  if (isMinimized) {
    return (
      <>
        {/* Desktop: vertical collapsed bar on right edge, centered */}
        <Card className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 shadow-lg border-feature bg-card/95 backdrop-blur rounded-l-lg rounded-r-none flex-col items-center py-3 px-1 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(false)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="writing-vertical-lr rotate-180 text-center py-2">
            <p className="text-sm font-medium whitespace-nowrap">{t("title")}</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {completedCount}/{items.length}
            </p>
          </div>
        </Card>

        {/* Mobile: horizontal bar above "Califica Ya" button */}
        <Card className="md:hidden fixed bottom-20 right-4 left-4 z-40 p-3 shadow-lg border-feature bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t("title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("progress", { completed: completedCount, total: items.length })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(false)}
              className="h-8 w-8"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
    {/* Desktop: right edge, vertically centered */}
    <Card className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-80 shadow-lg border-feature bg-card/95 backdrop-blur rounded-l-lg rounded-r-none">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t("title")}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{t("subtitle")}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {t("progress", { completed: completedCount, total: items.length })}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        {items.map((item, index) => {
          const translationKey = {
            exam_created: "createExam",
            exam_published: "publishExam",
            pdf_exported: "exportPdf",
            first_scan: "scanExam",
          }[item.key] as "createExam" | "publishExam" | "exportPdf" | "scanExam";
          
          const firstIncompleteIndex = items.findIndex(i => !i.completed);
          const isNextStep = index === firstIncompleteIndex;
          const isDisabled = !item.completed && !isNextStep;
          
          return (
            <button
              key={item.key}
              onClick={() => !isDisabled && handleItemClick(item)}
              disabled={item.completed || isDisabled}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                item.completed 
                  ? "bg-muted/50 opacity-60" 
                  : isNextStep
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                item.completed 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : isNextStep
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {item.completed ? <Check className="h-4 w-4" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  item.completed && "line-through text-muted-foreground",
                  isDisabled && "text-muted-foreground"
                )}>
                  {t(`items.${translationKey}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`items.${translationKey}.description`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>

    {/* Mobile: bottom positioned, above "Califica Ya" button */}
    <Card className="md:hidden fixed bottom-20 right-4 left-4 z-40 shadow-lg border-feature bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t("title")}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-7 w-7"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{t("subtitle")}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {t("progress", { completed: completedCount, total: items.length })}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        {items.map((item, index) => {
          const translationKey = {
            exam_created: "createExam",
            exam_published: "publishExam",
            pdf_exported: "exportPdf",
            first_scan: "scanExam",
          }[item.key] as "createExam" | "publishExam" | "exportPdf" | "scanExam";
          
          const firstIncompleteIndex = items.findIndex(i => !i.completed);
          const isNextStep = index === firstIncompleteIndex;
          const isDisabled = !item.completed && !isNextStep;
          
          return (
            <button
              key={item.key}
              onClick={() => !isDisabled && handleItemClick(item)}
              disabled={item.completed || isDisabled}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                item.completed 
                  ? "bg-muted/50 opacity-60" 
                  : isNextStep
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                item.completed 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : isNextStep
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {item.completed ? <Check className="h-4 w-4" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  item.completed && "line-through text-muted-foreground",
                  isDisabled && "text-muted-foreground"
                )}>
                  {t(`items.${translationKey}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`items.${translationKey}.description`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>

    <ExamCreationDrawer
      open={showExamDrawer}
      onOpenChange={setShowExamDrawer}
    />
  </>
  );
}
