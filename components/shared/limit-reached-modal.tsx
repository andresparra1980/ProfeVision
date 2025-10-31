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

type Feature = "ai_generation" | "scan";

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  feature: Feature;
  daysUntilReset: number;
}

const featureLimits: Record<Feature, string> = {
  ai_generation: "generaciones de IA",
  scan: "escaneos",
};

export function LimitReachedModal({
  open: _open,
  onOpenChange,
  feature,
  daysUntilReset,
}: LimitReachedModalProps) {
  const limitLabel = featureLimits[feature];

  return (
    <AlertDialog open={_open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <AlertDialogTitle className="text-left">
              Límite alcanzado
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Has alcanzado el límite mensual de <strong>{limitLabel}</strong>{" "}
              disponibles en tu plan actual.
            </p>

            {/* Días hasta reseteo */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {daysUntilReset === 0 && "Tu límite se restablecerá mañana"}
                {daysUntilReset === 1 &&
                  "Tu límite se restablecerá en 1 día"}
                {daysUntilReset > 1 &&
                  `Tu límite se restablecerá en ${daysUntilReset} días`}
              </span>
            </div>

            <p className="text-sm">
              Puedes esperar hasta que se restablezca tu límite, o actualizar a
              un plan superior para obtener más {limitLabel} mensuales.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
