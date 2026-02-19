'use client';


import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollAnimation } from "@/components/ui/scroll-animation";

import {
  DraftingCompass,
  Layers,
  Lightbulb,
  Copy,
  Quote,
  ScanText
} from "lucide-react";

const WorkflowAnimation = dynamic(() => import("./workflow-animation").then(mod => mod.WorkflowAnimation), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] animate-pulse bg-muted rounded-xl" />
});

export function ExamsWithAIContent() {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        {/* Background Elements */}
        {/* Mesh Gradient Background */}
        <div className="mesh-gradient" aria-hidden="true" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float hidden md:block" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float-rotate hidden md:block" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-secondary/10 rounded-full animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} />

        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">

            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
                {t('exams.hero.badge')}
              </div>
            </div>

            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter max-w-4xl font-display leading-tight">
                {t('exams.hero.title')} <span className="text-gradient-slow">{t('exams.hero.titleHighlight')}</span> {t('exams.hero.titleEnd')}
              </h1>
            </div>

            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <p className="max-w-[700px] text-lg text-foreground/80 md:text-xl/relaxed">
                {t('exams.hero.description')}
              </p>
            </div>

            {/* Animation Component */}
            <div className="w-full max-w-2xl py-8 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <WorkflowAnimation />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <Button asChild size="lg" className="btn-glow">
                <Link href={'/auth/register'}>{t('exams.hero.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Section (3 Pillars) */}
      <section className="py-20 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-display">
                {t('exams.spotlight.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Planning */}
            <ScrollAnimation delay={100}>
              <SpotlightCard
                icon={<DraftingCompass className="h-10 w-10 text-primary" />}
                title={t('exams.spotlight.planning.title')}
                description={t('exams.spotlight.planning.description')}
                tag={t('exams.spotlight.planning.tag')}
              />
            </ScrollAnimation>

            {/* Depth */}
            <ScrollAnimation delay={200}>
              <SpotlightCard
                icon={<Layers className="h-10 w-10 text-primary" />}
                title={t('exams.spotlight.depth.title')}
                description={t('exams.spotlight.depth.description', { defaultValue: "Aligned with Bloom's Taxonomy for deep learning." })}
                tag={t('exams.spotlight.depth.tag')}
              />
            </ScrollAnimation>

            {/* Learning */}
            <ScrollAnimation delay={300}>
              <SpotlightCard
                icon={<Lightbulb className="h-10 w-10 text-primary" />}
                title={t('exams.spotlight.learning.title')}
                description={t('exams.spotlight.learning.description')}
                tag={t('exams.spotlight.learning.tag')}
              />
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl max-w-4xl mx-auto font-display">
                {t('exams.ecosystem.mainTitle')}
              </h2>
            </div>
          </ScrollAnimation>
          <div className="grid gap-12 md:grid-cols-2">
            {/* Import */}
            <ScrollAnimation delay={100}>
              <div className="flex flex-col space-y-4 rounded-2xl border p-8 bg-card shadow-sm card-hover gradient-border h-full">
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
            </ScrollAnimation>

            {/* Similar Generation */}
            <ScrollAnimation delay={200}>
              <div className="flex flex-col space-y-4 rounded-2xl border p-8 bg-card shadow-sm card-hover gradient-border h-full">
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
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-display">
                {t('exams.socialProof.title')}
              </h2>
            </div>
          </ScrollAnimation>
          <div className="grid gap-8 md:grid-cols-3">
            <ScrollAnimation delay={100}>
              <TestimonialCard
                quote={t('exams.socialProof.nursing.quote')}
                author={t('exams.socialProof.nursing.author')}
              />
            </ScrollAnimation>
            <ScrollAnimation delay={200}>
              <TestimonialCard
                quote={t('exams.socialProof.economics.quote')}
                author={t('exams.socialProof.economics.author')}
              />
            </ScrollAnimation>
            <ScrollAnimation delay={300}>
              <TestimonialCard
                quote={t('exams.socialProof.primary.quote')}
                author={t('exams.socialProof.primary.author')}
              />
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="animated-gradient absolute inset-0" />

        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-lg rotate-45 animate-float-rotate" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full animate-float-slow" />

        <div className="container px-4 md:px-6 text-center relative z-10">
          <ScrollAnimation>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-6 text-white font-display">
              {t('exams.ctaFinal.title')}
            </h2>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <Button asChild size="lg" variant="secondary" className="bg-white text-[#0b890f] hover:bg-white/90 shadow-lg mt-4">
              <Link href={'/auth/register'}>{t('exams.ctaFinal.button')}</Link>
            </Button>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  );
}

function SpotlightCard({ icon, title, description, tag, externalLink, linkText }: { icon: React.ReactNode, title: string, description: string, tag: string, externalLink?: string, linkText?: string }) {
  return (
    <Card className="card-hover card-tilt gradient-border border-0 shadow-lg transition-shadow h-full flex flex-col bg-card">
      <CardContent className="p-8 flex flex-col items-center text-center space-y-4 flex-grow">
        <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="pt-4 flex flex-col items-center gap-2 mt-auto">
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
            {tag}
          </div>
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2">
              {linkText || "Learn more"}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author }: { quote: string, author: string }) {
  return (
    <Card className="bg-card border-none shadow-md card-hover h-full">
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


