'use client'

import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { useTranslations } from 'next-intl'
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
  Smartphone
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollAnimation } from "@/components/ui/scroll-animation"

export function HowItWorksContent() {
  const t = useTranslations('common')

  // Internal links use i18n-aware Link which preserves current locale

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
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
                {t('howItWorks.hero.badge')}
              </div>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-display leading-tight">
                {t('howItWorks.hero.title')} <span className="text-gradient-slow">{t('howItWorks.hero.titleHighlight')}</span> {t('howItWorks.hero.titleEnd')}
              </h1>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <p className="max-w-[800px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('howItWorks.hero.subtitle')}
              </p>
              <p className="max-w-[900px] text-foreground/80 mt-2">
                {t('howItWorks.hero.description')}
              </p>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="btn-glow"
                >
                  <Link href={'/auth/register'}>{t('howItWorks.hero.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="py-16 md:py-24 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('howItWorks.features.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.features.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Feature 1 */}
            <ScrollAnimation delay={100}>
              <Card className="card-hover card-tilt gradient-border border-0 shadow-lg transition-shadow bg-card h-full">
                <CardHeader>
                  <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center text-lg">{t('howItWorks.features.feature1.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature1.item1.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature1.item1.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature1.item2.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature1.item2.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>

            {/* Feature 2 */}
            <ScrollAnimation delay={200}>
              <Card className="card-hover card-tilt gradient-border border-0 shadow-lg transition-shadow bg-card h-full">
                <CardHeader>
                  <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center text-lg">{t('howItWorks.features.feature2.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature2.item1.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature2.item1.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature2.item2.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature2.item2.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>

            {/* Feature 3 */}
            <ScrollAnimation delay={300}>
              <Card className="card-hover card-tilt gradient-border border-0 shadow-lg transition-shadow bg-card h-full">
                <CardHeader>
                  <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                    <School className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center text-lg">{t('howItWorks.features.feature3.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature3.item1.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature3.item1.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature3.item2.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature3.item2.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('howItWorks.features.feature3.item3.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('howItWorks.features.feature3.item3.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('howItWorks.benefits.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.benefits.title')}
              </h2>
            </div>
          </ScrollAnimation>


          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 md:items-center mt-12">
            <ScrollAnimation delay={200} animation="fade-scale">
              <div className="relative flex items-center justify-center">
                <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto aspect-[4/3] md:aspect-square">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary z-10" />
                  <Image
                    src="/images/how-it-works/benefits_results.webp"
                    alt={t('howItWorks.benefits.title')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </ScrollAnimation>

            <div className="flex flex-col justify-center space-y-6">
              <ul className="space-y-4">
                {[
                  'timeSaving', 'accuracy', 'organization', 'accessibility', 'analytics'
                ].map((item, index) => (
                  <ScrollAnimation key={item} delay={100 + index * 100}>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5 shrink-0">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t(`howItWorks.benefits.${item}.title`)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t(`howItWorks.benefits.${item}.description`)}
                        </p>
                      </div>
                    </li>
                  </ScrollAnimation>
                ))}
              </ul>

              <ScrollAnimation delay={600}>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="btn-glow">
                    <Link href={'/auth/register'}>{t('howItWorks.hero.cta')}</Link>
                  </Button>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container px-4 md:px-6 relative z-10">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('howItWorks.comparison.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.comparison.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <ScrollAnimation delay={100} animation="fade-scale">
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left font-semibold">{t('howItWorks.comparison.table.feature')}</th>
                      <th className="p-4 text-center font-semibold text-primary">{t('howItWorks.comparison.table.profevision')}</th>
                      <th className="p-4 text-center font-semibold text-muted-foreground">{t('howItWorks.comparison.table.traditional')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.aiCreation')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.yes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.no')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.pdfUpload')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.yes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.no')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.omrGrading')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.rows.omrGradingYes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.rows.omrGradingNo')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.organization')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.rows.organizationYes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.rows.organizationNo')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.dashboard')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.rows.dashboardYes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.rows.dashboardNo')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.errorReduction')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.yes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.no')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.deviceAccess')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-medium">{t('howItWorks.comparison.table.yes')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-500 font-medium">{t('howItWorks.comparison.table.rows.deviceAccessNo')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.timeSaving')}</td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {t('howItWorks.comparison.table.rows.timeSavingMax')}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-200">
                          {t('howItWorks.comparison.table.rows.timeSavingMin')}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/5 to-[#ffd60a]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('howItWorks.whyChoose.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.whyChoose.title')}
              </h2>
              <p className="max-w-[800px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('howItWorks.whyChoose.description')}
              </p>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('howItWorks.faq.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                {t('howItWorks.faq.title')}
              </h2>
            </div>
          </ScrollAnimation>

          <ScrollAnimation delay={100}>
            <div className="mt-12 max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                    {t('howItWorks.faq.questions.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-popover opacity-80">
                      {t('howItWorks.faq.questions.q1.answer')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                    {t('howItWorks.faq.questions.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-popover opacity-80">
                      {t('howItWorks.faq.questions.q2.answer')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                    {t('howItWorks.faq.questions.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-popover opacity-80">
                      {t('howItWorks.faq.questions.q3.answer')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                    {t('howItWorks.faq.questions.q4.question')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-popover opacity-80">
                      {t('howItWorks.faq.questions.q4.answer')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                    {t('howItWorks.faq.questions.q5.question')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-popover opacity-80">
                      {t('howItWorks.faq.questions.q5.answer')}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                {t('howItWorks.cta.title')}
              </h2>
              <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('howItWorks.cta.description')}
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
                <Link href={'/auth/register'}>{t('howItWorks.cta.startFree')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href={'/pricing'}>{t('howItWorks.cta.viewPricing')}</Link>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}
