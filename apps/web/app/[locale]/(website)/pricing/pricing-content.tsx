"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { PricingCardV2 } from "@/components/shared/pricing-card-v2";

export function PricingContent() {
  const t = useTranslations("common");
  const billingPeriod = "monthly" as const;

  const handleUpgrade = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Zap className="h-3 w-3 mr-1" />
              {t("pricing.hero.badge", { defaultValue: "Precios de Lanzamiento" })}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("pricing.hero.title", { defaultValue: "Comienza gratis" })}{" "}
              <span className="text-primary">
                {t("pricing.hero.titleHighlight", { defaultValue: "hoy mismo" })}
              </span>
              !
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("pricing.hero.description", {
                defaultValue:
                  "Elige el plan perfecto para ti. Actualiza en cualquier momento.",
              })}
            </p>

            {/* Founders Plan CTA */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
              >
                <Link href="/auth/register">
                  {t("pricing.hero.foundersButton", { defaultValue: "Iniciar ahora en nuestro Plan Fundador" })}
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground max-w-md">
                {t("pricing.hero.foundersNote", {
                  defaultValue: "Plan gratuito con generación de IA y escaneos ilimitados por tiempo limitado."
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Cards */}
            <div className="grid gap-8 md:grid-cols-2 max-w-5xl w-full">
              <PricingCardV2
                tier="free"
                billingPeriod={billingPeriod}
                onUpgrade={() => {
                  // Scroll to register or redirect
                  window.location.href = "/auth/register";
                }}
              />
              <PricingCardV2
                tier="plus"
                billingPeriod={billingPeriod}
                onUpgrade={handleUpgrade}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t("pricing.comparison.title", {
                defaultValue: "Todas las funciones que necesitas",
              })}
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              {t("pricing.comparison.description", {
                defaultValue:
                  "Ambos planes incluyen acceso completo a la plataforma",
              })}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card p-8 rounded-lg border">
              <h3 className="text-xl font-semibold mb-6">
                Funciones incluidas en todos los planes:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Creación de exámenes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Gestión de estudiantes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Gestión de grupos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Esquemas de calificación</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Exportar a PDF y LaTeX</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Reportes de desempeño</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Interfaz intuitiva</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Actualizaciones constantes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              {t("pricing.cta.title", {
                defaultValue: "¿Listo para transformar tu forma de evaluar?",
              })}
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("pricing.cta.description", {
                defaultValue:
                  "Únete a cientos de profesores que ya están ahorrando tiempo con ProfeVision",
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href={"/auth/register"}>
                  {t("pricing.cta.startFree", {
                    defaultValue: "Comenzar gratis",
                  })}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href={"/how-it-works"}>
                  {t("pricing.cta.learnMore", {
                    defaultValue: "Conocer más",
                  })}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
