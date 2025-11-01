"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type PricingTier = "free" | "plus";

interface PricingCardProps {
  tier: PricingTier;
  onUpgrade?: () => void;
  isCurrentPlan?: boolean;
  className?: string;
}

export function PricingCard({
  tier,
  onUpgrade,
  isCurrentPlan = false,
  className,
}: PricingCardProps) {
  const t = useTranslations("tiers.pricing");

  // Get tier info from translations
  const displayName = t(`${tier}.name`, { defaultValue: tier === "free" ? "Free" : "Plus" });
  const description = t(`${tier}.description`, { defaultValue: "" });
  const price = tier === "free" ? 0 : 5;
  const isPopular = tier === "plus";

  // Get features list
  const features = [
    t(`${tier}.features.${tier === "free" ? "aiGenerations" : "unlimitedAI"}`, { defaultValue: "" }),
    t(`${tier}.features.${tier === "free" ? "scans" : "unlimitedScans"}`, { defaultValue: "" }),
    t(`${tier}.features.${tier === "free" ? "students" : "unlimitedStudents"}`, { defaultValue: "" }),
    t(`${tier}.features.${tier === "free" ? "groups" : "unlimitedGroups"}`, { defaultValue: "" }),
    t(`${tier}.features.${tier === "free" ? "basicFeatures" : "premiumFeatures"}`, { defaultValue: "" }),
    t(`${tier}.features.${tier === "free" ? "emailSupport" : "prioritySupport"}`, { defaultValue: "" }),
  ];

  if (tier === "plus") {
    features.push(t("plus.features.earlyAccess", { defaultValue: "" }));
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-purple-500 border-2 shadow-lg",
        className
      )}
    >
      {/* Badges en la parte superior */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
        {isPopular && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {t("badges.recommended", { defaultValue: "Recommended" })}
          </div>
        )}
        {isCurrentPlan && (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {t("badges.currentPlan", { defaultValue: "Current Plan" })}
          </div>
        )}
      </div>

      <CardHeader className={cn(isPopular && "pt-8")}>
        <CardTitle className="text-2xl">{displayName}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${price}
            </span>
            <span className="text-muted-foreground">{t("billing.perMonth", { defaultValue: "/month" })}</span>
          </div>
          {price > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("badges.launchPrice", { defaultValue: "Launch price" })}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            {t("actions.currentPlan", { defaultValue: "Current plan" })}
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full",
              isPopular &&
                "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            )}
            onClick={onUpgrade}
          >
            {tier === "free" ? t("actions.startFree", { defaultValue: "Start for free" }) : t("actions.upgradePlus", { defaultValue: "Upgrade to Plus" })}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
