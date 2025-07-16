'use client';

import Link from "next/link"
import Image from "next/image"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { 
  FileText,
  CheckCircle,
  QrCode,
  Zap,
  XCircle,
  AlertCircle,
  Lightbulb,
  Camera,
  ScanLine,
  Shield,
} from "lucide-react"

export default function PaperExamsPage() {
  const t = useTranslations('common')
  const locale = useLocale()

  // Helper function to get localized routes
  const getLocalizedRoute = (route: string) => {
    if (locale === 'es') {
      const routeMap: Record<string, string> = {
        '/auth/register': '/auth/registro',
        '/paper-exams': '/examenes-papel',
      }
      return routeMap[route] || route
    }
    return route
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit">
              <Zap className="h-3 w-3 mr-1" />
              {t('paperExams.hero.badge')}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t('paperExams.hero.title')}{" "}
              <span className="text-[#0b890f]">{t('paperExams.hero.titleHighlight')}</span>{" "}
              {t('paperExams.hero.titleEnd')}
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('paperExams.hero.description')}{" "}
              <span className="font-semibold text-[#0b890f]">{t('paperExams.hero.descriptionHighlight')}</span>{" "}
              {t('paperExams.hero.descriptionEnd')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href={getLocalizedRoute('/auth/register')}>{t('paperExams.hero.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hojas de Respuesta - Características */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('paperExams.features.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('paperExams.features.title')}
            </h2>
          </div>
          
          {/* Primera fila: Imagen y Formato Personalizado */}
          <div className="grid gap-8 lg:grid-cols-2 items-center mt-12">
            {/* Imagen de la hoja de respuesta */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/paper-exams/hoja-respuesta-sample.jpg"
                  alt={t('paperExams.features.imageAlt')}
                  width={400}
                  height={600}
                  className="rounded-lg shadow-xl border"
                />
              </div>
            </div>

            {/* Formato Personalizado */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                {t('paperExams.features.customFormat.title')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">{t('paperExams.features.customFormat.uniqueId.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.features.customFormat.uniqueId.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">{t('paperExams.features.customFormat.qrCode.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.features.customFormat.qrCode.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">{t('paperExams.features.customFormat.adaptableFormat.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.features.customFormat.adaptableFormat.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Instrucciones y Áreas Restringidas */}
          <div className="grid gap-8 lg:grid-cols-2 mt-12">
            {/* Instrucciones */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                {t('paperExams.instructions.title')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#0b890f] mb-2">{t('paperExams.instructions.penUse.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.instructions.penUse.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#bc152b] mb-2">{t('paperExams.instructions.avoidPencil.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.instructions.avoidPencil.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#0b890f] mb-2">{t('paperExams.instructions.correction.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('paperExams.instructions.correction.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Áreas Restringidas */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#bc152b]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#bc152b] mb-6">
                {t('paperExams.restrictedAreas.title')}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">{t('paperExams.restrictedAreas.qrCode')}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">{t('paperExams.restrictedAreas.borders')}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">{t('paperExams.restrictedAreas.answersSection')}</h4>
                    </div>
                  </div>
                </div>

                <div className="bg-[#ffd60a]/10 dark:bg-[#ffd60a]/20 backdrop-blur-sm rounded-lg border border-[#ffd60a]/30 p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-[#ffd60a]/80 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#ffd60a]/90 mb-2">{t('paperExams.restrictedAreas.tip.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('paperExams.restrictedAreas.tip.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calificación Automática */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('paperExams.autoGrading.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('paperExams.autoGrading.title')}
            </h2>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2 items-center mt-12">
            {/* Imagen del proceso */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/paper-exams/calificacion-automatica.jpg"
                  alt={t('paperExams.autoGrading.imageAlt')}
                  width={400}
                  height={600}
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Proceso */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg space-y-8">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                {t('paperExams.autoGrading.processTitle')}
              </h3>
              
              {/* Paso 1 */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#0b890f]" />
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
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <ScanLine className="h-5 w-5 text-[#0b890f]" />
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
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#0b890f]" />
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
          </div>
        </div>
      </section>

      {/* Ahorra tiempo y esfuerzo */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('paperExams.benefits.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('paperExams.benefits.title')}
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto mt-12">
            <p className="text-lg text-muted-foreground mb-6 text-center">
              {t('paperExams.benefits.description')}{" "}
              <span className="font-bold text-[#0b890f]">{t('paperExams.benefits.descriptionHighlight')}</span>{" "}
              {t('paperExams.benefits.descriptionEnd')}
            </p>
            
            <div className="bg-gradient-to-r from-[#0b890f]/10 to-[#0b890f]/5 rounded-lg p-6 border border-[#0b890f]/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-[#0b890f]" />
                <h3 className="text-xl font-bold text-[#0b890f]">{t('paperExams.benefits.advantage.title')}</h3>
              </div>
              <p className="text-lg font-semibold text-center">
                {t('paperExams.benefits.advantage.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              {t('paperExams.cta.title')}
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('paperExams.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href={getLocalizedRoute('/auth/register')}>{t('paperExams.cta.startNow')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href={getLocalizedRoute('/paper-exams')}>{t('paperExams.cta.moreDetails')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 