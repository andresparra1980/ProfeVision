'use client';

import { useRef } from 'react'
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  Clock,
  Camera,
  CheckCircle,
  RefreshCw,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  ScanLine,
  BarChart3,
  Zap,
  Users,
  ShieldCheck,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { ScrollAnimation } from "@/components/ui/scroll-animation"

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.523 15.341a.996.996 0 0 1-.998-.998c0-.548.45-.998.998-.998.549 0 .998.45.998.998a.996.996 0 0 1-.998.998m-11.046 0a.996.996 0 0 1-.998-.998c0-.548.45-.998.998-.998.549 0 .998.45.998.998a.996.996 0 0 1-.998.998m11.405-6.02 1.997-3.46a.416.416 0 0 0-.152-.566.416.416 0 0 0-.566.152l-2.022 3.502a12.233 12.233 0 0 0-5.139-1.107c-1.879 0-3.64.39-5.139 1.107L4.84 5.447a.416.416 0 0 0-.566-.152.416.416 0 0 0-.152.566l1.997 3.46C2.688 11.196.343 14.581.343 18.488h23.314c0-3.907-2.345-7.292-5.775-9.167" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export function MobileAppContent() {
  const t = useTranslations('mobile-app')
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const scrollAmount = 340 // card width + gap
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const features = [
    { key: 'dashboard', icon: LayoutDashboard, image: '1-dashboard.webp' },
    { key: 'subjects', icon: FolderOpen, image: '2-subjects-groups.webp' },
    { key: 'exams', icon: FileText, image: '3-exams.webp' },
    { key: 'settings', icon: Settings, image: '4-settings.webp' },
    { key: 'scan', icon: ScanLine, image: '5-scan-wizard.webp' },
    { key: 'results', icon: BarChart3, image: '6-results.webp' },
  ]

  const benefits = [
    { key: 'time', icon: Clock },
    { key: 'scan', icon: Camera },
    { key: 'accuracy', icon: CheckCircle },
    { key: 'sync', icon: RefreshCw },
  ]

  const steps = ['step1', 'step2', 'step3', 'step4', 'step5'] as const

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
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left: Text content */}
            <div className="flex flex-col space-y-4 text-center lg:text-left">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground w-fit mx-auto lg:mx-0">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {t('hero.badge')}
                </div>
              </div>
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-display leading-tight">
                  {t('hero.title')}{" "}
                  <span className="text-gradient-slow">{t('hero.titleHighlight')}</span>{" "}
                  {t('hero.titleEnd')}
                </h1>
              </div>
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <p className="max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto lg:mx-0">
                  {t('hero.description')}{" "}
                  <span className="font-semibold text-primary">{t('hero.descriptionHighlight')}</span>{" "}
                  {t('hero.descriptionEnd')}
                </p>
              </div>

              {/* Availability badges */}
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                    <AndroidIcon className="h-5 w-5 text-[#3DDC84]" />
                    <div className="text-sm">
                      <span className="font-semibold">{t('availability.android')}</span>
                      <span className="text-muted-foreground ml-1">- {t('availability.androidStatus')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-4 py-2">
                    <AppleIcon className="h-5 w-5" />
                    <div className="text-sm">
                      <span className="font-semibold">{t('availability.ios')}</span>
                      <span className="text-muted-foreground ml-1">- {t('availability.iosStatus')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="btn-glow"
                  >
                    <a href="#beta-access">
                      {t('hero.ctaAndroid')}
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="gradient-border"
                  >
                    <Link href="/contact">{t('hero.ctaIos')}</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: App icon */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/20 to-[#ffd60a]/20 rounded-3xl blur-2xl" />
                <Image
                  src="/images/mobile-app/adaptive-icon.webp"
                  alt={t('imageAlt.icon')}
                  width={280}
                  height={280}
                  className="relative rounded-3xl shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Access Section */}
      <section id="beta-access" className="py-16 md:py-24 bg-muted/50 scroll-mt-20 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {t('betaAccess.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('betaAccess.title')}
              </h2>
              <p className="max-w-[600px] text-muted-foreground">
                {t('betaAccess.description')}
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mt-12">
            {/* Step 1: Join Group */}
            <ScrollAnimation delay={100} className="h-full">
              <a href="https://groups.google.com/g/profevision-beta-testers" target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <div className="bg-card rounded-xl border border-border p-6 shadow-lg text-center relative card-hover gradient-border h-full flex flex-col justify-between z-10">
                  <div className="flex-1 flex flex-col">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary w-8 h-8 flex items-center justify-center shadow-md">
                      <span className="text-primary-foreground font-bold text-sm">1</span>
                    </div>
                    <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center mb-4 mt-2">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{t('betaAccess.step1.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1">{t('betaAccess.step1.description')}</p>
                    <Button
                      asChild
                      className="w-full mt-auto relative z-20 pointer-events-none"
                    >
                      <span>
                        {t('betaAccess.ctaGroup')}
                      </span>
                    </Button>
                  </div>
                </div>
              </a>
            </ScrollAnimation>

            {/* Step 2: Accept Testing */}
            <ScrollAnimation delay={200} className="h-full">
              <a href="https://play.google.com/apps/testing/com.profevision.mobile" target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <div className="bg-card rounded-xl border border-border p-6 shadow-lg text-center relative card-hover gradient-border h-full flex flex-col justify-between z-10">
                  <div className="flex-1 flex flex-col">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary w-8 h-8 flex items-center justify-center shadow-md">
                      <span className="text-primary-foreground font-bold text-sm">2</span>
                    </div>
                    <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center mb-4 mt-2">
                      <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{t('betaAccess.step2.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1">{t('betaAccess.step2.description')}</p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-white mt-auto relative z-20 pointer-events-none"
                    >
                      <span>
                        {t('betaAccess.ctaTesting')}
                      </span>
                    </Button>
                  </div>
                </div>
              </a>
            </ScrollAnimation>

            {/* Step 3: Download */}
            <ScrollAnimation delay={300} className="h-full">
              <a href="https://play.google.com/store/apps/details?id=com.profevision.mobile" target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <div className="bg-card rounded-xl border border-border p-6 shadow-lg text-center relative card-hover gradient-border h-full flex flex-col justify-between z-10">
                  <div className="flex-1 flex flex-col">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary w-8 h-8 flex items-center justify-center shadow-md">
                      <span className="text-primary-foreground font-bold text-sm">3</span>
                    </div>
                    <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center mb-4 mt-2">
                      <Download className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{t('betaAccess.step3.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1">{t('betaAccess.step3.description')}</p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full mt-auto relative z-20 pointer-events-none"
                    >
                      <span>
                        {t('betaAccess.ctaDownload')}
                      </span>
                    </Button>
                  </div>
                </div>
              </a>
            </ScrollAnimation>
          </div>

          {/* Note */}
          <ScrollAnimation delay={400}>
            <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{t('betaAccess.note')}</span>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold">
                {t('benefits.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('benefits.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-12">
            {benefits.map(({ key, icon: Icon }, i) => (
              <ScrollAnimation key={key} delay={100 * (i + 1)} className="h-full">
                <div
                  className="bg-card backdrop-blur-sm rounded-xl border border-primary/20 p-6 shadow-lg text-center card-hover h-full flex flex-col items-center"
                >
                  <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(`benefits.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`benefits.${key}.description`)}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Screenshots Carousel */}
      <section className="py-16 md:py-24 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold">
                {t('features.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('features.title')}
              </h2>
            </div>
          </ScrollAnimation>

          {/* Carousel */}
          <ScrollAnimation delay={100} animation="fade-scale">
            <div className="mt-12 -mx-4 px-4 relative group/carousel">
              {/* Navigation buttons - visible on desktop */}
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 bg-background/90 border border-border rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-muted"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 bg-background/90 border border-border rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-muted"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scrollbar-hide">
                {features.map(({ key, icon: Icon, image }) => (
                  <div
                    key={key}
                    className="flex-none w-[280px] sm:w-[320px] snap-center bg-card backdrop-blur-sm rounded-lg border border-border p-4 shadow-lg group hover:border-primary/40 transition-colors"
                  >
                    <div className="relative aspect-[9/16] mb-4 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={`/images/mobile-app/${image}`}
                        alt={t(`imageAlt.${key}`)}
                        fill
                        sizes="320px"
                        className="object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold truncate">{t(`features.${key}.title`)}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{t(`features.${key}.description`)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Scroll hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ChevronLeft className="h-4 w-4" />
                <span>{t('features.scrollHint')}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/5 to-[#ffd60a]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold">
                {t('howItWorks.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {steps.map((step, index) => (
              <ScrollAnimation key={step} delay={100 * (index + 1)}>
                <div
                  className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 min-w-[200px] shadow-md card-hover"
                >
                  <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t(`howItWorks.${step}.title`)}</h4>
                    <p className="text-xs text-muted-foreground">{t(`howItWorks.${step}.description`)}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 md:py-24 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold">
                {t('plans.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('plans.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto mt-12">
            {/* Free Plan */}
            <ScrollAnimation delay={100} className="h-full">
              <div className="bg-card rounded-xl border border-border p-8 shadow-lg card-hover h-full">
                <h3 className="text-xl font-bold mb-4">{t('plans.free.title')}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t('plans.free.scans')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t('plans.free.students')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t('plans.free.groups')}
                  </li>
                </ul>
              </div>
            </ScrollAnimation>

            {/* Plus Plan */}
            <ScrollAnimation delay={200} className="h-full">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-purple-500 border-2 p-8 shadow-lg card-hover gradient-border h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">{t('plans.plus.title')}</h3>
                </div>
                <p className="text-muted-foreground font-semibold">{t('plans.plus.description')}</p>
              </div>
            </ScrollAnimation>
          </div>
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
                {t('cta.title')}
              </h2>
              <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('cta.description')}
              </p>
            </div>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href="/auth/register">{t('cta.register')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <a href="#beta-access">
                  {t('cta.download')}
                </a>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}
