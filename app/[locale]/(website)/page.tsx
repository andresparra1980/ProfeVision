"use client"

import Link from "next/link"
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
import Image from 'next/image'
import { useMemo } from 'react'

export default function LocaleHomePage() {
  const t = useTranslations('common.homepage')
  const tButtons = useTranslations('common.buttons')
  const locale = useLocale()

  // Helper function to get localized auth routes
  const getAuthRoute = (route: string) => {
    if (locale === 'es') {
      return `/auth/${route === 'register' ? 'registro' : 'iniciar-sesion'}`
    }
    return `/auth/${route}`
  }

  // Helper function to get localized routes
  const getRoute = (route: string) => {
    if (locale === 'es') {
      const routeMap: { [key: string]: string } = {
        'how-it-works': '/como-funciona',
        'pricing': '/precios',
        'contact': '/contacto',
        'blog': '/blog',
        'exams': '/examenes',
        'institutions-management': '/gestion-instituciones',
        'subjects-management': '/gestion-materias',
        'groups-management': '/gestion-grupos',
        'students-management': '/gestion-estudiantes',
        'reports': '/reportes',
        'mobile-app': '/aplicacion-movil',
        'paper-exams': '/examenes-papel'
      }
      return routeMap[route] || route
    }
    return `/${route}`
  }

  const avatarSeeds = useMemo(
    () => Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 10)),
    []
  )

  return (
    <div className="flex min-h-screen flex-col">
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
                  {t('newBadge')}
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  {locale === 'es' ? (
                    <>
                      La Mejor Aplicación <span className="text-[#0b890f]">para Escanear y Calificar Exámenes en Papel</span>
                    </>
                  ) : (
                    <>
                      The Best App <span className="text-[#0b890f]">for Scanning and Grading Paper Exams</span>
                    </>
                  )}
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  {t('heroDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                  >
                    <Link href={getAuthRoute('register')} title={`${tButtons('startFree')} - ${t('heroTitle')}`}>
                      {tButtons('startFree')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#caracteristicas" title={t('featuresDescription')}>
                      {tButtons('learnMore')}
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {avatarSeeds.map((seed, index) => (
                      <Image
                        key={seed}
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`}
                        alt={`Teacher avatar ${index + 1}`}
                        title={`Teacher using ProfeVision`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-background"
                        unoptimized
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('trustedBy')}
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
                {t('featuresTag')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('featuresTitle')}
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('featuresDescription')}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BookOpen className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('features.examCreation.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('features.examCreation.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <Smartphone className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('features.aiGrading.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('features.aiGrading.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BarChart3 className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl text-center font-bold">{t('features.analytics.title')}</h3>
                <p className="text-center text-muted-foreground">
                  {t('features.analytics.description')}
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
                {t('modulesTag')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t('modulesTitle')}</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('modulesDescription')}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {/* Institutions Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <School className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.institutions.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.institutions.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BookOpen className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.subjects.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.subjects.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Groups Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <Users className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.groups.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.groups.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Grading Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <FileSpreadsheet className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.grading.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.grading.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Exams Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <ScanText className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.exams.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.exams.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Reports Module */}
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BarChart3 className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">{t('modules.reports.title')}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.raw('modules.reports.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted">
                      <span>{t('moreInfo')}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
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
                  {t('benefitsTag')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {t('benefitsTitle')}
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  {t('benefitsDescription')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('benefits.automation.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('benefits.automation.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('benefits.organization.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('benefits.organization.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('benefits.insights.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('benefits.insights.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('benefits.flexibility.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('benefits.flexibility.description')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('benefits.speed.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('benefits.speed.description')}
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
                    <Link href={getAuthRoute('register')} title={`${tButtons('startFree')} - ProfeVision`}>
                      {tButtons('startFree')}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center lg:order-first">
                <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">{t('gradeTable.title')}</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{t('gradeTable.subject')}</h4>
                        <span className="text-xs bg-[#0b890f]/10 text-[#0b890f] px-2 py-1 rounded-full">{t('gradeTable.period')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">25 {t('gradeTable.students')} · {t('gradeTable.average')}: 4.2</div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">{t('gradeTable.student')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('gradeTable.exam1')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('gradeTable.exam2')}</th>
                            <th className="px-4 py-2 text-center font-medium">{t('gradeTable.final')}</th>
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
                      {tButtons('exportGrades')}
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
                {t('ctaTitle')}
              </h2>
              <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('ctaDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#0b890f] hover:bg-white/90"
                >
                  <Link href={getAuthRoute('register')} title={`${tButtons('startTrial')} - ProfeVision`}>
                    {tButtons('startTrial')}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  <Link href={getRoute('how-it-works')}>{tButtons('learnMore')}</Link>
                </Button>
              </div>
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">1000+</div>
                  <p className="text-sm text-white/80">{t('stats.teachers')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">50+</div>
                  <p className="text-sm text-white/80">{t('stats.institutions')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">100K+</div>
                  <p className="text-sm text-white/80">{t('stats.exams')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white">98%</div>
                  <p className="text-sm text-white/80">{t('stats.satisfaction')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 