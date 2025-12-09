"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Sparkles, Clock, ListChecks } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
  userName?: string;
}

export function WelcomeStep({ onNext, userName }: WelcomeStepProps) {
  const t = useTranslations("onboarding.welcome");

  const nameDisplay = userName ? `, ${userName}` : "";

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      {/* Icon */}
      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">
          {t("greeting", { name: nameDisplay })}
        </h3>
        <p className="text-lg text-muted-foreground max-w-md">
          {t("description")}
        </p>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("duration")}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("steps")}</span>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        onClick={onNext}
        className="mt-6 px-8"
      >
        {t("start")}
      </Button>
    </div>
  );
}
