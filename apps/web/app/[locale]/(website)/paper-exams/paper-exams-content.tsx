'use client';

import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import {
  FileText,
  CheckCircle,
  QrCode,
  Zap,
  XCircle,
  AlertCircle,
  Camera,
  ScanLine,
  Shield,
} from "lucide-react"
import { ScrollAnimation } from "@/components/ui/scroll-animation"

export function PaperExamsContent() {
  const t = useTranslations('common')

  // Internal links use i18n-aware Link which preserves current locale

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
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
                  <Zap className="h-3 w-3 mr-1" />
                  {t('paperExams.hero.badge')}
                </div>
              </div>

              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-display leading-tight">
                  {t('paperExams.hero.title')}{" "}
                  <span className="text-gradient-slow">{t('paperExams.hero.titleHighlight')}</span>
                  {t('paperExams.hero.titleEnd') && ` ${t('paperExams.hero.titleEnd')}`}
                </h1>
              </div>

              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <p className="max-w-[800px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                  {t('paperExams.hero.description')}{" "}
                  <span className="font-semibold text-primary">{t('paperExams.hero.descriptionHighlight')}</span>{" "}
                  {t('paperExams.hero.descriptionEnd')}
                </p>
              </div>

              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="btn-glow"
                  >
                    <Link href={'/auth/register'}>{t('paperExams.hero.cta')}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hojas de Respuesta - Características */}
        <section className="py-16 md:py-24 bg-muted/50 relative">
          <div className="absolute inset-0 dots-pattern opacity-30" />
          <div className="container px-4 md:px-6 relative z-10">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('paperExams.features.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('paperExams.features.title')}
                </h2>
              </div>
            </ScrollAnimation>

            {/* Primera fila: Imagen y Formato Personalizado */}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 md:items-center mt-12">
              {/* Imagen de la hoja de respuesta */}
              <ScrollAnimation delay={200} animation="fade-scale">
                <div className="relative flex items-center justify-center">
                  <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto aspect-[3/4]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary z-10" />
                    <Image
                      src="/images/paper-exams/hoja-respuesta-sample.jpg"
                      alt={t('paperExams.features.imageAlt')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </ScrollAnimation>

              {/* Contenido en tarjetas apiladas (Modules Style) */}
              <div className="flex flex-col justify-center space-y-6">
                {/* Formato Personalizado */}
                <ScrollAnimation delay={200}>
                  <div className="card-hover gradient-border group relative overflow-hidden rounded-lg border bg-card shadow-sm p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-primary">
                          {t('paperExams.features.customFormat.title')}
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold">{t('paperExams.features.customFormat.uniqueId.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.features.customFormat.uniqueId.description')}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <QrCode className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold">{t('paperExams.features.customFormat.qrCode.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.features.customFormat.qrCode.description')}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold">{t('paperExams.features.customFormat.adaptableFormat.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.features.customFormat.adaptableFormat.description')}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Instrucciones */}
                <ScrollAnimation delay={300}>
                  <div className="card-hover gradient-border group relative overflow-hidden rounded-lg border bg-card shadow-sm p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-primary">
                          {t('paperExams.instructions.title')}
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-primary mb-1">{t('paperExams.instructions.penUse.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.instructions.penUse.description')}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-secondary mb-1">{t('paperExams.instructions.avoidPencil.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.instructions.avoidPencil.description')}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-primary mb-1">{t('paperExams.instructions.correction.title')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('paperExams.instructions.correction.description')}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Áreas Restringidas */}
                <ScrollAnimation delay={400}>
                  <div className="card-hover gradient-border group relative overflow-hidden rounded-lg border bg-card shadow-sm p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="rounded-full bg-secondary/10 p-3">
                          <AlertCircle className="h-5 w-5 text-secondary" />
                        </div>
                        <h3 className="text-xl font-bold text-secondary">
                          {t('paperExams.restrictedAreas.title')}
                        </h3>
                      </div>
                      <ul className="space-y-3 mb-4">
                        <li className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-secondary">{t('paperExams.restrictedAreas.qrCode')}</h4>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-secondary">{t('paperExams.restrictedAreas.borders')}</h4>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-secondary">{t('paperExams.restrictedAreas.answersSection')}</h4>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        {/* Calificación Automática */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
          <div className="container px-4 md:px-6">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('paperExams.autoGrading.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('paperExams.autoGrading.title')}
                </h2>
              </div>
            </ScrollAnimation>

            <div className="grid gap-8 lg:grid-cols-2 items-center mt-12">
              {/* Imagen del proceso */}
              <ScrollAnimation delay={100} className="flex justify-center">
                <div className="relative w-full max-w-md card-hover">
                  <Image
                    src="/images/paper-exams/calificacion-automatica.jpg"
                    alt={t('paperExams.autoGrading.imageAlt')}
                    width={400}
                    height={600}
                    className="rounded-xl shadow-2xl border gradient-border"
                  />
                </div>
              </ScrollAnimation>

              {/* Proceso */}
              <ScrollAnimation delay={200}>
                <div className="flex flex-col gap-6">
                  <div className="bg-card backdrop-blur-sm rounded-xl border border-primary/20 p-8 shadow-lg space-y-8 card-hover card-tilt gradient-border">
                    <h3 className="text-2xl font-bold text-primary mb-6">
                      {t('paperExams.autoGrading.processTitle')}
                    </h3>

                    {/* Paso 1 */}
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                          <Camera className="h-5 w-5 text-primary" />
                          {t('paperExams.autoGrading.step1.title')}
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• {t('paperExams.autoGrading.step1.item1')}</li>
                          <li>• {t('paperExams.autoGrading.step1.item2')}</li>
                          <li>• {t('paperExams.autoGrading.step1.item3')}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Paso 2 */}
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                          <ScanLine className="h-5 w-5 text-primary" />
                          {t('paperExams.autoGrading.step2.title')}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t('paperExams.autoGrading.step2.description')}
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• ✓ {t('paperExams.autoGrading.step2.item1')}</li>
                          <li>• ✓ {t('paperExams.autoGrading.step2.item2')}</li>
                          <li>• ✓ {t('paperExams.autoGrading.step2.item3')}</li>
                        </ul>
                      </div>
                    </div>

                    {/* Paso 3 */}
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">3</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          {t('paperExams.autoGrading.step3.title')}
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• {t('paperExams.autoGrading.step3.item1')}</li>
                          <li>• <span className="font-semibold">{t('paperExams.autoGrading.step3.item2')}</span></li>
                          <li className="ml-4">○ {t('paperExams.autoGrading.step3.item3')}</li>
                          <li className="ml-4">○ {t('paperExams.autoGrading.step3.item4')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button
                      asChild
                      size="lg"
                      className="btn-glow"
                    >
                      <Link href={'/auth/register'}>{t('paperExams.hero.cta')}</Link>
                    </Button>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Ahorra tiempo y esfuerzo */}
        <section className="py-16 md:py-24 bg-muted/50 relative">
          <div className="absolute inset-0 dots-pattern opacity-30" />
          <div className="container px-4 md:px-6 relative z-10">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('paperExams.benefits.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('paperExams.benefits.title')}
                </h2>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={100} className="max-w-4xl mx-auto mt-12">
              <p className="text-lg text-muted-foreground mb-6 text-center">
                {t('paperExams.benefits.description')}{" "}
                <span className="font-bold text-primary">{t('paperExams.benefits.descriptionHighlight')}</span>{" "}
                {t('paperExams.benefits.descriptionEnd')}
              </p>

              <div className="bg-gradient-to-r from-[#0b890f]/10 to-[#0b890f]/5 rounded-lg p-6 border border-primary/20 card-hover card-tilt gradient-border">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary">{t('paperExams.benefits.advantage.title')}</h3>
                </div>
                <p className="text-lg font-semibold text-center">
                  {t('paperExams.benefits.advantage.description')}
                </p>
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
                  {t('paperExams.cta.title')}
                </h2>
                <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('paperExams.cta.description')}
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
                  <Link href={'/auth/register'}>{t('paperExams.cta.startNow')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  <Link href={'/paper-exams'}>{t('paperExams.cta.moreDetails')}</Link>
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </section>
      </div>
    </div>
  )
}
