"use client"

import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { ScrollAnimation } from "@/components/ui/scroll-animation"
import {
  BookOpen,
  ScanText,
  BarChart3,
  School,
  Users,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Sparkles
} from "lucide-react"

export function HomeContent() {
  const t = useTranslations('common')
  const locale = useLocale()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 transition-all duration-200">

        {/* Hero Section */}
        <section className="py-12 md:py-20 relative overflow-hidden">
          {/* Mesh Gradient Background */}
          <div className="mesh-gradient" aria-hidden="true" />

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float hidden md:block" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float-rotate hidden md:block" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-secondary/10 rounded-full animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} />

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('homepage.hero.badge')}
                  </div>
                </div>

                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl font-display leading-tight">
                    {t('homepage.hero.title')} <span className="text-gradient-slow">{t('homepage.hero.titleHighlight')}</span> {t('homepage.hero.titleEnd')}
                  </h1>
                </div>

                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                  <p className="max-w-[600px] text-foreground/80 md:text-xl">
                    {t('homepage.hero.description')}
                  </p>
                </div>

                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="btn-glow"
                    >
                      <Link href={'/auth/register'} title={t('homepage.hero.registerTitle')}>
                        {t('homepage.hero.startFree')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gradient-border">
                      <a href="#caracteristicas" title={t('homepage.hero.learnMoreTitle')}>
                        {t('homepage.hero.learnMore')}
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                  <div className="flex items-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      {t('homepage.hero.trustText')} <span className="font-bold text-foreground">{t('homepage.hero.trustNumber')}</span> {t('homepage.hero.trustSuffix')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center animate-fade-in-up opacity-0" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                <div className="hero-image-wrapper relative h-full w-full">
                  <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1 / 1' }}>
                    <Image
                      src="/images/hero/ProfeEscaneo_1_1.webp"
                      alt="Profesor usando ProfeVision para escanear exámenes"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-card border rounded-xl shadow-lg p-3 animate-float hidden md:flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('homepage.hero.floatingBadge.label')}</p>
                    <p className="text-sm font-bold text-primary">{t('homepage.hero.floatingBadge.count')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-16 md:py-24 bg-muted/50 relative">
          <div className="absolute inset-0 dots-pattern opacity-50" />
          <div className="container px-4 md:px-6 relative z-10">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('homepage.features.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('homepage.features.title')}
                </h2>
                <p className="max-w-[700px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('homepage.features.description')}
                </p>
              </div>
            </ScrollAnimation>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <ScrollAnimation delay={100}>
                <div className="card-hover card-tilt gradient-border flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl text-center font-bold">{t('homepage.features.examCreation.title')}</h3>
                  <p className="text-center text-muted-foreground">
                    {t('homepage.features.examCreation.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={200}>
                <div className="card-hover card-tilt gradient-border flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl text-center font-bold">{t('homepage.features.aiGrading.title')}</h3>
                  <p className="text-center text-muted-foreground">
                    {t('homepage.features.aiGrading.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={300}>
                <div className="card-hover card-tilt gradient-border flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl text-center font-bold">{t('homepage.features.resultAnalysis.title')}</h3>
                  <p className="text-center text-muted-foreground">
                    {t('homepage.features.resultAnalysis.description')}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
          <div className="container px-4 md:px-6">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('homepage.modules.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">{t('homepage.modules.title')}</h2>
                <p className="max-w-[700px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('homepage.modules.description')}
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {[
                { icon: School, key: 'institutions' },
                { icon: BookOpen, key: 'subjects' },
                { icon: Users, key: 'groups' },
                { icon: FileSpreadsheet, key: 'grading' },
                { icon: ScanText, key: 'exams' },
                { icon: BarChart3, key: 'analysis' }
              ].map((item, index) => (
                <ScrollAnimation key={item.key} delay={index * 100}>
                  <div className="card-hover gradient-border group relative overflow-hidden rounded-lg border bg-card shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold">{t(`homepage.modules.${item.key}.title`)}</h3>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{t(`homepage.modules.${item.key}.feature${i}`)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex justify-end">
                        <a
                          href={`https://docs.profevision.com/${locale}/docs/organization-setup/${item.key === 'institutions' ? 'create-institution' : item.key === 'subjects' ? 'create-subject' : item.key === 'groups' ? 'create-group' : item.key === 'grading' ? 'grading-schemes' : item.key === 'exams' ? 'exam-creation' : 'results'}`}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-primary hover:bg-muted"
                          title={t(`homepage.modules.${item.key}.linkTitle`)}
                        >
                          <span>{t('homepage.modules.moreInfo')}</span>
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-16 md:py-24 bg-muted/50 relative">
          <div className="absolute inset-0 dots-pattern opacity-30" />
          <div className="container px-4 md:px-6 relative z-10">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('homepage.benefits.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('homepage.benefits.title')}
                </h2>
              </div>
            </ScrollAnimation>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 md:items-center">
              <ScrollAnimation delay={200} animation="fade-scale">
                <div className="relative flex items-center justify-center">
                  <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto aspect-[4/3] md:aspect-square">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary z-10" />
                    <Image
                      src="/images/key-benefits/keybenefits.webp"
                      alt="ProfeVision Key Benefits"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </ScrollAnimation>

              <div className="flex flex-col justify-center space-y-6">
                <ScrollAnimation delay={200}>
                  <p className="max-w-[600px] text-foreground/80 md:text-xl">
                    {t('homepage.benefits.description')}
                  </p>
                </ScrollAnimation>

                <ul className="space-y-4">
                  {[
                    'automation', 'organization', 'insights', 'flexibility', 'gradingSpeed'
                  ].map((item, index) => (
                    <ScrollAnimation key={item} delay={300 + index * 100}>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5 shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{t(`homepage.benefits.${item}.title`)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t(`homepage.benefits.${item}.description`)}
                          </p>
                        </div>
                      </li>
                    </ScrollAnimation>
                  ))}
                </ul>

                <ScrollAnimation delay={800}>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button asChild size="lg" className="btn-glow">
                      <Link href={'/auth/register'} title={t('homepage.benefits.startFreeTitle')}>
                        {t('homepage.benefits.startFree')}
                      </Link>
                    </Button>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contacto" className="py-16 md:py-24 relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="animated-gradient absolute inset-0" />

          {/* Floating shapes */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float" />
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-lg rotate-45 animate-float-rotate" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full animate-float-slow" />

          <div className="container px-4 md:px-6 relative z-10">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white font-display">
                  {t('homepage.cta.title')}
                </h2>
                <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('homepage.cta.description')}
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={200}>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#0b890f] hover:bg-white/90 shadow-lg"
                >
                  <Link href={'/auth/register'} title={t('homepage.cta.startTrialTitle')}>
                    {t('homepage.cta.startTrial')}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-lg"
                >
                  <Link href={'/how-it-works'}>{t('homepage.cta.learnMore')}</Link>
                </Button>
              </div>
            </ScrollAnimation>

            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { value: t('homepage.cta.stats.teachers'), label: t('homepage.cta.stats.teachersLabel') },
                { value: t('homepage.cta.stats.institutions'), label: t('homepage.cta.stats.institutionsLabel') },
                { value: t('homepage.cta.stats.exams'), label: t('homepage.cta.stats.examsLabel') },
                { value: t('homepage.cta.stats.satisfaction'), label: t('homepage.cta.stats.satisfactionLabel') }
              ].map((stat, index) => (
                <ScrollAnimation key={index} delay={300 + index * 100}>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl md:text-4xl font-bold text-white font-display">{stat.value}</div>
                    <p className="text-sm text-white/80 mt-1">{stat.label}</p>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
