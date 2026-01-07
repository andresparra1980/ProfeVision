'use client'

import { Link } from "@/i18n/navigation"
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
  Clock,
  Target,
  Building,
  Smartphone,
  BarChart3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function HowItWorksContent() {
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
              {t('howItWorks.hero.badge')}
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t('howItWorks.hero.title')} <span className="text-[#0b890f]">{t('howItWorks.hero.titleHighlight')}</span> {t('howItWorks.hero.titleEnd')}
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorks.hero.subtitle')}
            </p>
            <p className="max-w-[900px] text-muted-foreground">
              {t('howItWorks.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href={'/auth/register'}>{t('howItWorks.hero.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('howItWorks.features.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('howItWorks.features.title')}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <BookOpen className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('howItWorks.features.feature1.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('howItWorks.features.feature1.item1.title')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('howItWorks.features.feature1.item1.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
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

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <Smartphone className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('howItWorks.features.feature2.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('howItWorks.features.feature2.item1.title')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('howItWorks.features.feature2.item1.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
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

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <School className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">{t('howItWorks.features.feature3.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('howItWorks.features.feature3.item1.title')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('howItWorks.features.feature3.item1.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('howItWorks.features.feature3.item2.title')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('howItWorks.features.feature3.item2.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
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
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('howItWorks.benefits.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('howItWorks.benefits.title')}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Clock className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('howItWorks.benefits.timeSaving.title')}</h3>
              <p className="text-center text-muted-foreground">
                {t('howItWorks.benefits.timeSaving.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Target className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('howItWorks.benefits.accuracy.title')}</h3>
              <p className="text-center text-muted-foreground">
                {t('howItWorks.benefits.accuracy.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Building className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('howItWorks.benefits.organization.title')}</h3>
              <p className="text-center text-muted-foreground">
                {t('howItWorks.benefits.organization.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Smartphone className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('howItWorks.benefits.accessibility.title')}</h3>
              <p className="text-center text-muted-foreground">
                {t('howItWorks.benefits.accessibility.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <BarChart3 className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">{t('howItWorks.benefits.analytics.title')}</h3>
              <p className="text-center text-muted-foreground">
                {t('howItWorks.benefits.analytics.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('howItWorks.comparison.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('howItWorks.comparison.title')}
            </h2>
          </div>
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">{t('howItWorks.comparison.table.feature')}</th>
                    <th className="p-4 text-center font-semibold text-[#0b890f]">{t('howItWorks.comparison.table.profevision')}</th>
                    <th className="p-4 text-center font-semibold text-muted-foreground">{t('howItWorks.comparison.table.traditional')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 font-medium">{t('howItWorks.comparison.table.rows.aiCreation')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.yes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.yes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.rows.omrGradingYes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.rows.organizationYes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.rows.dashboardYes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.yes')}</span>
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
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">{t('howItWorks.comparison.table.yes')}</span>
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
                      <Badge variant="secondary" className="bg-[#0b890f]/10 text-[#0b890f] border-[#0b890f]/20">
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
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/5 to-[#ffd60a]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('howItWorks.whyChoose.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('howItWorks.whyChoose.title')}
            </h2>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorks.whyChoose.description')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              {t('howItWorks.faq.badge')}
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              {t('howItWorks.faq.title')}
            </h2>
          </div>
          
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              {t('howItWorks.cta.title')}
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorks.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
          </div>
        </div>
      </section>
    </div>
  )
} 
