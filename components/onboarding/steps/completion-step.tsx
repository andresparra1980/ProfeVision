"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { 
  PartyPopper, 
  FileText, 
  Send, 
  Printer, 
  ScanLine,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

interface CompletionStepProps {
  onCompleteAction: () => Promise<void>;
  isSubmitting: boolean;
}

const NEXT_STEPS = [
  { key: "createExam", icon: FileText },
  { key: "publishExam", icon: Send },
  { key: "printSheets", icon: Printer },
  { key: "scanExam", icon: ScanLine },
] as const;

export function CompletionStep({ onCompleteAction, isSubmitting }: CompletionStepProps) {
  const t = useTranslations("onboarding.completion");
  const router = useRouter();

  // Fire confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      // Left side
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      });
      
      // Right side
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
    });

    // Continuous sides
    frame();

    return () => {
      confetti.reset();
    };
  }, []);

  const handleFinish = async () => {
    await onCompleteAction();
    router.push({ pathname: "/dashboard" });
  };

  return (
    <div className="space-y-6 text-center">
      {/* Header with celebration icon */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
          <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
            {t("title")}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-muted/50 rounded-lg p-6 text-left">
        <h4 className="font-semibold mb-4 text-center">
          {t("nextStepsTitle")}
        </h4>
        <div className="space-y-3">
          {NEXT_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.key}
                className="flex items-center gap-3 p-3 bg-background rounded-md"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">{t(`steps.${step.key}`)}</span>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint about progress tracker */}
      <p className="text-sm text-muted-foreground">
        {t("progressTrackerHint")}
      </p>

      {/* Action button */}
      <div className="pt-4">
        <Button
          size="lg"
          onClick={handleFinish}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8"
        >
          {isSubmitting ? t("finishing") : t("startButton")}
        </Button>
      </div>
    </div>
  );
}
