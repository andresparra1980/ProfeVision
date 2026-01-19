'use client';


import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  DraftingCompass,
  Layers,
  Lightbulb,
  Copy,
  Quote,
  ScanText
} from "lucide-react";
import { WorkflowAnimation } from "./workflow-animation";

export function ExamsWithAIContent() {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        {/* Background Elements */}
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">

            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
              {t('exams.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter max-w-4xl">
              {t('exams.hero.title')} <span className="text-primary">{t('exams.hero.titleHighlight')}</span> {t('exams.hero.titleEnd')}
            </h1>

            <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl/relaxed">
              {t('exams.hero.description')}
            </p>

            {/* Animation Component */}
            <div className="w-full max-w-2xl py-8">
              <WorkflowAnimation />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href={'/auth/register'}>{t('exams.hero.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Section (3 Pillars) */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              {t('exams.spotlight.title')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Planning */}
            <SpotlightCard
              icon={<DraftingCompass className="h-10 w-10 text-primary" />}
              title={t('exams.spotlight.planning.title')}
              description={t('exams.spotlight.planning.description')}
              tag={t('exams.spotlight.planning.tag')}
            />

            {/* Depth */}
            <SpotlightCard
              icon={<Layers className="h-10 w-10 text-primary" />}
              title={t('exams.spotlight.depth.title')}
              description={t('exams.spotlight.depth.description')}
              tag={t('exams.spotlight.depth.tag')}
            />

            {/* Learning */}
            <SpotlightCard
              icon={<Lightbulb className="h-10 w-10 text-primary" />}
              title={t('exams.spotlight.learning.title')}
              description={t('exams.spotlight.learning.description')}
              tag={t('exams.spotlight.learning.tag')}
            />
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Import */}
            <div className="flex flex-col space-y-4 rounded-2xl border p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground w-fit mb-2">
                {t('exams.ecosystem.import.badge')}
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <ScanText className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">{t('exams.ecosystem.import.title')}</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                {t('exams.ecosystem.import.description')}
              </p>
            </div>

            {/* Similar Generation */}
            <div className="flex flex-col space-y-4 rounded-2xl border p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground w-fit mb-2">
                {t('exams.ecosystem.similar.badge')}
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Copy className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">{t('exams.ecosystem.similar.title')}</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                {t('exams.ecosystem.similar.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <TestimonialCard
              quote={t('exams.socialProof.nursing.quote')}
              author={t('exams.socialProof.nursing.author')}
            />
            <TestimonialCard
              quote={t('exams.socialProof.economics.quote')}
              author={t('exams.socialProof.economics.author')}
            />
            <TestimonialCard
              quote={t('exams.socialProof.primary.quote')}
              author={t('exams.socialProof.primary.author')}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-6 text-white">
            {t('exams.ctaFinal.title')}
          </h2>
          <Button asChild size="lg" variant="secondary" className="bg-white text-[#0b890f] hover:bg-white/90">
            <Link href={'/auth/register'}>{t('exams.ctaFinal.button')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SpotlightCard({ icon, title, description, tag }: { icon: React.ReactNode, title: string, description: string, tag: string }) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
      <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="pt-4">
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
            {tag}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author }: { quote: string, author: string }) {
  return (
    <Card className="bg-card border-none shadow-md">
      <CardContent className="p-8 flex flex-col h-full justify-between">
        <div className="mb-6">
          <Quote className="h-8 w-8 text-primary/20 mb-4" />
          <p className="text-lg italic text-muted-foreground">&quot;{quote}&quot;</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary">{author.charAt(0)}</span>
          </div>
          <span className="font-semibold text-sm">{author}</span>
        </div>
      </CardContent>
    </Card>
  );
}


