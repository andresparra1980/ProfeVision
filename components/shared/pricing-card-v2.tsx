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
import { BillingPeriod } from "./billing-period-toggle";
import { useTranslations } from "next-intl";

type PricingTier = "free" | "plus";

interface PricingCardV2Props {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
  onUpgrade?: () => void;
  isCurrentPlan?: boolean;
  compact?: boolean;
  className?: string;
}

export function PricingCardV2({
  tier,
  billingPeriod,
  onUpgrade,
  isCurrentPlan = false,
  compact = false,
  className,
}: PricingCardV2Props) {
  const t = useTranslations("tiers.pricing");

  // Get tier info from translations
  const displayName = t(`${tier}.name`, { defaultValue: tier === "free" ? "Free" : "Plus" });
  const description = t(`${tier}.description`, { defaultValue: "" });
  const isPopular = tier === "plus";

  // Pricing info
  const monthlyPrice = tier === "free" ? 0 : 5;
  const annualPrice = tier === "free" ? 0 : 50; // $50/año = $4.17/mes (17% descuento)
  const price = billingPeriod === "monthly" ? monthlyPrice : annualPrice;
  const displayPrice = billingPeriod === "annual" && price > 0 ? price / 12 : price;

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

      <CardHeader className={cn(isPopular && "pt-8", compact && "pb-3")}>
        <CardTitle className={cn(compact ? "text-xl" : "text-2xl")}>
          {displayName}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className={cn("font-bold", compact ? "text-3xl" : "text-4xl")}>
              ${displayPrice.toFixed(billingPeriod === "annual" && price > 0 ? 2 : 0)}
            </span>
            <span className="text-muted-foreground">
              {t("billing.perMonth", { defaultValue: "/month" })}
              {billingPeriod === "annual" && price > 0 && (
                <span className="text-xs block">{t("billing.billedAnnually", { defaultValue: "billed annually" })}</span>
              )}
            </span>
          </div>
          {price > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("badges.launchPrice", { defaultValue: "Launch price" })}
              </p>
              {billingPeriod === "annual" && (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                  ${price}/{t("billing.annual", { defaultValue: "Annual" }).toLowerCase()} - {t("billing.saveAmount", { defaultValue: "Save" })} ${(monthlyPrice * 12 - price).toFixed(0)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("flex-1", compact && "pb-3")}>
        <ul className={cn("space-y-3", compact && "space-y-2")}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className={cn("text-gray-700 dark:text-gray-300", compact ? "text-xs" : "text-sm")}>
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
