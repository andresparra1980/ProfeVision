"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { PricingCardV2 } from "@/components/shared/pricing-card-v2";
import posthog from "posthog-js";
import { ScrollAnimation } from "@/components/ui/scroll-animation";

export function PricingContent() {
  const t = useTranslations("common");
  const billingPeriod = "monthly" as const;

  const handleUpgrade = () => {
    posthog.capture('pricing_plan_clicked', { tier: 'plus', source: 'pricing_page' });
    window.location.href = "/dashboard";
  };

  const handleFreeSignup = () => {
    posthog.capture('pricing_plan_clicked', { tier: 'free', source: 'pricing_page' });
    window.location.href = "/auth/register";
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        {/* Mesh Gradient Background */}
        <div className="mesh-gradient" aria-hidden="true" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float hidden md:block" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float-rotate hidden md:block" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-secondary/10 rounded-full animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} />

        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/80">
                <Zap className="h-3 w-3 mr-1" />
                {t("pricing.hero.badge", { defaultValue: "Precios de Lanzamiento" })}
              </Badge>
            </div>

            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-display leading-tight mb-4 text-foreground">
                {t("pricing.hero.seoTitle", { defaultValue: "ProfeVision Pricing Plans" })}
              </h1>
            </div>

            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <p className="text-xl font-medium text-foreground mb-2">
                {t("pricing.hero.title", { defaultValue: "Comienza gratis" })}{" "}
                <span className="text-gradient-slow">
                  {t("pricing.hero.titleHighlight", { defaultValue: "hoy mismo" })}
                </span>
                !
              </p>
              <p className="max-w-[800px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                {t("pricing.hero.description", {
                  defaultValue:
                    "Elige el plan perfecto para ti. Actualiza en cualquier momento.",
                })}
              </p>
            </div>

            {/* Founders Plan CTA */}
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <div className="flex flex-col items-center gap-3 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 btn-glow"
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
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 md:py-12 relative z-20">
        <div className="container px-4 md:px-6">
          <ScrollAnimation delay={100} animation="fade-scale">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Cards */}
              <div className="grid gap-8 md:grid-cols-2 max-w-5xl w-full">
                <PricingCardV2
                  tier="free"
                  billingPeriod={billingPeriod}
                  onUpgrade={handleFreeSignup}
                />
                <PricingCardV2
                  tier="plus"
                  billingPeriod={billingPeriod}
                  onUpgrade={handleUpgrade}
                />
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-muted/50">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
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
          </ScrollAnimation>

          <ScrollAnimation delay={100}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-card p-8 rounded-xl border border-primary/20 shadow-lg card-hover">
                <h3 className="text-xl font-semibold mb-6">
                  {t("pricing.commonFeatures.title")}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.examCreation")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.studentManagement")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.groupManagement")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.gradingSchemes")}</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.exportPdfLatex")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.performanceReports")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.intuitiveInterface")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{t("pricing.commonFeatures.constantUpdates")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="animated-gradient absolute inset-0" />

        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-lg rotate-45 animate-float-rotate" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full animate-float-slow" />

        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white font-display">
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
            </div>
          </ScrollAnimation>

          <ScrollAnimation delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90 shadow-lg"
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
          </ScrollAnimation>
        </div>
      </section>
    </div>
  );
}
