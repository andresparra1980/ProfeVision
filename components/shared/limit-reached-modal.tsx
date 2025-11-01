"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

type Feature = "ai_generation" | "scan";

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  feature: Feature;
  daysUntilReset: number;
}

export function LimitReachedModal({
  open: _open,
  onOpenChange,
  feature,
  daysUntilReset,
}: LimitReachedModalProps) {
  const t = useTranslations("tiers");

  // Get feature label
  const featureLabel = t(`limits.reached.${feature === "ai_generation" ? "ai" : "scans"}`, {
    defaultValue: feature === "ai_generation" ? "AI generations" : "scans"
  });

  // Get days until reset message
  const getDaysMessage = () => {
    if (daysUntilReset === 0) {
      return t("limits.reached.daysUntilReset.today", { defaultValue: "Your limit will reset tomorrow" });
    } else if (daysUntilReset === 1) {
      return t("limits.reached.daysUntilReset.tomorrow", { defaultValue: "Your limit will reset in 1 day" });
    } else {
      return t("limits.reached.daysUntilReset.multiple", { days: daysUntilReset, defaultValue: `Your limit will reset in ${daysUntilReset} days` });
    }
  };

  return (
    <AlertDialog open={_open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <AlertDialogTitle className="text-left">
              {t("limits.reached.title", { defaultValue: "Limit reached" })}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              {t("limits.reached.description", {
                feature: featureLabel,
                defaultValue: `You have reached the monthly limit of ${featureLabel} available in your current plan.`
              })}
            </p>

            {/* Días hasta reseteo */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {getDaysMessage()}
              </span>
            </div>

            <p className="text-sm">
              {t("limits.reached.waitOrUpgrade", {
                feature: featureLabel,
                defaultValue: `You can wait until your limit resets, or upgrade to a higher plan to get more monthly ${featureLabel}.`
              })}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {t("limits.reached.understood", { defaultValue: "Got it" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
