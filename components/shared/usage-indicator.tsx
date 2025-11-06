"use client";

import { cn } from "@/lib/utils";
import { Infinity as InfinityIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number;
  warningThreshold?: number; // Porcentaje para warning (default 80)
  className?: string;
  hideLabel?: boolean; // Ocultar label y mostrar solo barra de progreso
}

export function UsageIndicator({
  label,
  used,
  limit,
  warningThreshold = 80,
  className,
  hideLabel = false,
}: UsageIndicatorProps) {
  const t = useTranslations("tiers");

  // Caso ilimitado
  const isUnlimited = limit === -1;

  // Calcular porcentaje
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  // Determinar color según el porcentaje usado
  const getProgressColor = () => {
    if (isUnlimited) return "bg-green-500";
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= warningThreshold) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Determinar color del texto según el porcentaje
  const getTextColor = () => {
    if (isUnlimited) return "text-green-600 dark:text-green-400";
    if (percentage >= 100) return "text-red-600 dark:text-red-400";
    if (percentage >= warningThreshold)
      return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-700 dark:text-gray-300";
  };

  // Si hideLabel es true, solo mostramos barra de progreso
  if (hideLabel && !isUnlimited) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-in-out",
                getProgressColor()
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Si es unlimited y hideLabel, no mostramos nada
  if (hideLabel && isUnlimited) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header con label y contador */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <div className={cn("text-sm font-semibold flex items-center gap-1", getTextColor())}>
          {isUnlimited ? (
            <>
              <InfinityIcon className="h-4 w-4" />
              <span>{t("usage.unlimited", { defaultValue: "Unlimited" })}</span>
            </>
          ) : (
            <span>
              {used} / {limit}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      {!isUnlimited && (
        <div className="relative">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-in-out",
                getProgressColor()
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensaje de estado */}
      {!isUnlimited && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {percentage >= 100 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {t("limits.reached.title", { defaultValue: "Limit reached" })}
            </span>
          )}
          {percentage >= warningThreshold && percentage < 100 && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              {t("limits.warning.approaching", { percentage: Math.round(percentage), defaultValue: `Near limit (${Math.round(percentage)}%)` })}
            </span>
          )}
          {percentage < warningThreshold && (
            <span>
              {t(limit - used === 1 ? "limits.warning.remaining" : "limits.warning.remainingPlural", {
                count: limit - used,
                defaultValue: `${limit - used} remaining`
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
