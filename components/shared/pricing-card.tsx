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

type PricingTier = "free" | "plus";

interface TierInfo {
  name: string;
  displayName: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const tierData: Record<PricingTier, TierInfo> = {
  free: {
    name: "free",
    displayName: "Free",
    price: 0,
    description: "Perfecto para empezar con lo básico",
    features: [
      "1 generación de examen con IA por mes",
      "50 escaneos de exámenes por mes",
      "Hasta 100 estudiantes",
      "Hasta 5 grupos",
      "Acceso a todas las funciones básicas",
      "Soporte por email",
    ],
  },
  plus: {
    name: "plus",
    displayName: "Plus",
    price: 5,
    description: "Para profesores que necesitan más potencia",
    features: [
      "Generaciones ilimitadas con IA",
      "Escaneos ilimitados de exámenes",
      "Estudiantes ilimitados",
      "Grupos ilimitados",
      "Acceso a todas las funciones premium",
      "Soporte prioritario",
      "Acceso anticipado a nuevas funciones",
    ],
    popular: true,
  },
};

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
  const info = tierData[tier];

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        info.popular && "border-purple-500 border-2 shadow-lg",
        className
      )}
    >
      {/* Badges en la parte superior */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
        {info.popular && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Recomendado
          </div>
        )}
        {isCurrentPlan && (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Plan Actual
          </div>
        )}
      </div>

      <CardHeader className={cn(info.popular && "pt-8")}>
        <CardTitle className="text-2xl">{info.displayName}</CardTitle>
        <CardDescription>{info.description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${info.price}
            </span>
            <span className="text-muted-foreground">/mes</span>
          </div>
          {info.price > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Precio de lanzamiento
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {info.features.map((feature, index) => (
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
            Plan actual
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full",
              info.popular &&
                "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            )}
            onClick={onUpgrade}
          >
            {tier === "free" ? "Comenzar gratis" : "Actualizar a Plus"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
