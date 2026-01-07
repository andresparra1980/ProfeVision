"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { FeatureSlideshow } from "@/components/shared/feature-slideshow"
import {
  BookOpen,
  ScanText,
  BarChart3,
  School,
  Users,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  Smartphone
} from "lucide-react"

export function HomeContent() {
  const t = useTranslations('common')
  const locale = useLocale()

  // Internal links use i18n-aware Link which preserves current locale

  return (
    <div className="flex min-h-screen flex-col">
      {/* Content wrapper - applying blur when menu is open */}
      <div className="flex-1 transition-all duration-200">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit">
                  {t('homepage.hero.badge')}
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  {t('homepage.hero.title')} <span className="text-[#0b890f]">{t('homepage.hero.titleHighlight')}</span>
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl">
                  {t('homepage.hero.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                  >
                    <Link href={'/auth/register'} title={t('homepage.hero.registerTitle')}>
                      {t('homepage.hero.startFree')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a href="#caracteristicas" title={t('homepage.hero.learnMoreTitle')}>
                      {t('homepage.hero.learnMore')}
                    </a>
                  </Button>
                </div>
                <div className="flex items-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('homepage.hero.trustText')} <span className="font-bold text-foreground">{t('homepage.hero.trustNumber')}</span> {t('homepage.hero.trustSuffix')}
                  </p>
                </div>
              </div>
              <FeatureSlideshow />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-16 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('homepage.features.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('homepage.features.title')}
              </h2>
              <p className="max-w-[700px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('homepage.features.description')}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BookOpen className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('homepage.features.examCreation.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('homepage.features.examCreation.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <Smartphone className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('homepage.features.aiGrading.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('homepage.features.aiGrading.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BarChart3 className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('homepage.features.resultAnalysis.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('homepage.features.resultAnalysis.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                {t('homepage.modules.badge')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t('homepage.modules.title')}</h2>
              <p className="max-w-[700px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('homepage.modules.description')}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <School className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.institutions.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.institutions.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.institutions.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.institutions.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/organization-setup/create-institution`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.institutions.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BookOpen className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.subjects.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.subjects.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.subjects.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.subjects.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/organization-setup/create-subject`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.subjects.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <Users className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.groups.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.groups.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.groups.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.groups.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/organization-setup/create-group`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.groups.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <FileSpreadsheet className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.grading.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.grading.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.grading.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.grading.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/organization-setup/grading-schemes`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.grading.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <ScanText className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.exams.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.exams.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.exams.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.exams.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/exam-creation`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.exams.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BarChart3 className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('homepage.modules.analysis.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.analysis.feature1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.analysis.feature2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">{t('homepage.modules.analysis.feature3')}</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href={`https://docs.profevision.com/${locale}/docs/results`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                      title={t('homepage.modules.analysis.linkTitle')}
                    >
                      <span>{t('homepage.modules.moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-16 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground w-fit">
                  {t('homepage.benefits.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {t('homepage.benefits.title')}
                </h2>
                <p className="max-w-[600px] text-foreground/80 md:text-xl">
                  {t('homepage.benefits.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('homepage.benefits.automation.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('homepage.benefits.automation.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('homepage.benefits.organization.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('homepage.benefits.organization.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('homepage.benefits.insights.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('homepage.benefits.insights.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('homepage.benefits.flexibility.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('homepage.benefits.flexibility.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('homepage.benefits.gradingSpeed.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('homepage.benefits.gradingSpeed.description')}
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                  >
                    <Link href={'/auth/register'} title={t('homepage.benefits.startFreeTitle')}>
                      {t('homepage.benefits.startFree')}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center lg:order-first">
                <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">{t('homepage.benefits.gradingTable.title')}</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{t('homepage.benefits.gradingTable.subject')}</h4>
                        <span className="text-xs bg-[#0b890f]/10 text-[#0b890f] px-2 py-1 rounded-full">{t('homepage.benefits.gradingTable.period')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{t('homepage.benefits.gradingTable.stats')}</div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">{t('homepage.benefits.gradingTable.student')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('homepage.benefits.gradingTable.exam1')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('homepage.benefits.gradingTable.exam2')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('homepage.benefits.gradingTable.final')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">Ana García</td>
                            <td className="px-4 py-2 text-center">4.8</td>
                            <td className="px-4 py-2 text-center">4.9</td>
                            <td className="px-4 py-2 text-center font-medium">4.9</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Carlos Pérez</td>
                            <td className="px-4 py-2 text-center">4.0</td>
                            <td className="px-4 py-2 text-center">4.2</td>
                            <td className="px-4 py-2 text-center font-medium">4.1</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">María López</td>
                            <td className="px-4 py-2 text-center">3.7</td>
                            <td className="px-4 py-2 text-center">4.0</td>
                            <td className="px-4 py-2 text-center font-medium">3.9</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <Button variant="outline" className="w-full">
                      {t('homepage.benefits.gradingTable.export')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contacto" className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
                {t('homepage.cta.title')}
              </h2>
              <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('homepage.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#0b890f] hover:bg-white/90"
                >
                  <Link href={'/auth/register'} title={t('homepage.cta.startTrialTitle')}>
                    {t('homepage.cta.startTrial')}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  <Link href={'/how-it-works'}>{t('homepage.cta.learnMore')}</Link>
                </Button>
              </div>
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">{t('homepage.cta.stats.teachers')}</div>
                  <p className="text-sm text-white/80">{t('homepage.cta.stats.teachersLabel')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">{t('homepage.cta.stats.institutions')}</div>
                  <p className="text-sm text-white/80">{t('homepage.cta.stats.institutionsLabel')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">{t('homepage.cta.stats.exams')}</div>
                  <p className="text-sm text-white/80">{t('homepage.cta.stats.examsLabel')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">{t('homepage.cta.stats.satisfaction')}</div>
                  <p className="text-sm text-white/80">{t('homepage.cta.stats.satisfactionLabel')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 
