'use client';

import { Link } from "@/i18n/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileEdit,
  Upload,
  CheckCircle, 
  Target,
  BarChart3,
  Recycle,
  Zap,
  Brain,
} from "lucide-react"

export function ExamsWithAIContent() {
  const t = useTranslations('common')

  // Internal links use i18n-aware Link which preserves current locale

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
              {t('exams.hero.badge')}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t('exams.hero.title')} <span className="text-[#0b890f]">{t('exams.hero.titleHighlight')}</span> {t('exams.hero.titleEnd')}
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('exams.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href={'/auth/register'}>{t('exams.hero.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('exams.features.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('exams.features.title')}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Creación con IA */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <Brain className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('exams.features.aiCreation.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  {t('exams.features.aiCreation.description')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.aiCreation.item1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.aiCreation.item2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.aiCreation.item3')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.aiCreation.item4')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.aiCreation.item5')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creación Manual */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <FileEdit className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('exams.features.manualCreation.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  {t('exams.features.manualCreation.description')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.manualCreation.item1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.manualCreation.item2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.manualCreation.item3')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.manualCreation.item4')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.manualCreation.item5')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Importación de Archivos */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <Upload className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('exams.features.fileImport.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  {t('exams.features.fileImport.description')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.fileImport.item1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.fileImport.item2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.fileImport.item3')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.fileImport.item4')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('exams.features.fileImport.item5')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('exams.process.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('exams.process.title')}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Paso 1 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-bold">{t('exams.process.step1.title')}</h3>
              <p className="text-muted-foreground">
                {t('exams.process.step1.description')}
              </p>
            </div>

            {/* Paso 2 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-bold">{t('exams.process.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('exams.process.step2.description')}
              </p>
            </div>

            {/* Paso 3 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-bold">{t('exams.process.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('exams.process.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios para Educadores */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('exams.benefits.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('exams.benefits.title')}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#ffd60a]/20 to-[#ffd60a]/10 p-4">
                <Zap className="h-6 w-6 text-[#ffd60a]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('exams.benefits.timeSaving.title')}</h3>
              <p className="text-center text-muted-foreground text-sm">
                {t('exams.benefits.timeSaving.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#bc152b]/20 to-[#bc152b]/10 p-4">
                <Target className="h-6 w-6 text-[#bc152b]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('exams.benefits.precision.title')}</h3>
              <p className="text-center text-muted-foreground text-sm">
                {t('exams.benefits.precision.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <BarChart3 className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('exams.benefits.formats.title')}</h3>
              <p className="text-center text-muted-foreground text-sm">
                {t('exams.benefits.formats.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Recycle className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('exams.benefits.reusable.title')}</h3>
              <p className="text-center text-muted-foreground text-sm">
                {t('exams.benefits.reusable.description')}
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
              {t('exams.cta.title')}
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('exams.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href={'/auth/register'}>{t('exams.cta.startNow')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href={'/how-it-works'}>{t('exams.cta.learnMore')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
