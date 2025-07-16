'use client'

import Link from "next/link"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  BookOpen, 
  School, 
  CheckCircle, 
  X,
  Clock,
  Target,
  Building,
  Smartphone,
  BarChart3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HowItWorksPage() {
  const t = useTranslations('common')
  const locale = useLocale()

  // Helper function to get localized auth routes
  const getAuthRoute = (route: string) => {
    if (locale === 'es') {
      return `/auth/${route === 'register' ? 'registro' : 'iniciar-sesion'}`
    }
    return `/auth/${route}`
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
              {t('howItWorks.badge')}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t('howItWorks.title')}
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorks.subtitle')}
            </p>
            <p className="max-w-[900px] text-muted-foreground">
              {t('howItWorks.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href={getAuthRoute('register')}>{t('howItWorks.tryFree')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#demo">{t('howItWorks.seeDemo')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t('howItWorks.stepsTitle')}
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorks.stepsDescription')}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Card className="relative overflow-hidden border-2 border-[#0b890f]/20 hover:border-[#0b890f]/40 transition-colors">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#0b890f] text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#0b890f]/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#0b890f]" />
                </div>
                <CardTitle className="text-lg">{t('howItWorks.steps.step1.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('howItWorks.steps.step1.description')}
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden border-2 border-[#0b890f]/20 hover:border-[#0b890f]/40 transition-colors">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#0b890f] text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#0b890f]/10 flex items-center justify-center mb-4">
                  <School className="w-6 h-6 text-[#0b890f]" />
                </div>
                <CardTitle className="text-lg">{t('howItWorks.steps.step2.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('howItWorks.steps.step2.description')}
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden border-2 border-[#0b890f]/20 hover:border-[#0b890f]/40 transition-colors">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#0b890f] text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#0b890f]/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-[#0b890f]" />
                </div>
                <CardTitle className="text-lg">{t('howItWorks.steps.step3.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('howItWorks.steps.step3.description')}
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden border-2 border-[#0b890f]/20 hover:border-[#0b890f]/40 transition-colors">
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#0b890f] text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#0b890f]/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-[#0b890f]" />
                </div>
                <CardTitle className="text-lg">{t('howItWorks.steps.step4.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('howItWorks.steps.step4.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              {t('homepage.ctaTitle')}
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('homepage.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href={getAuthRoute('register')}>{t('buttons.startTrial')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 