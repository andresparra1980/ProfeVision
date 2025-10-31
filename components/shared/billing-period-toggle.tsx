"use client";

import { cn } from "@/lib/utils";

export type BillingPeriod = "monthly" | "annual";

interface BillingPeriodToggleProps {
  period: BillingPeriod;
  onChange: (_period: BillingPeriod) => void;
  className?: string;
}

export function BillingPeriodToggle({
  period,
  onChange,
  className,
}: BillingPeriodToggleProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all",
          period === "monthly"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Mensual
      </button>

      <button
        onClick={() => onChange("annual")}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
          period === "annual"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Anual
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">
          Ahorra 17%
        </span>
      </button>
    </div>
  );
}
