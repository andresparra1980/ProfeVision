"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { MainNavigation } from "@/components/shared/main-navigation"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { 
  BookOpen, 
  FileText, 
  Brain, 
  ScanLine,
  Smartphone
} from "lucide-react"

export function SiteHeader() {
  const t = useTranslations('common')
  const locale = useLocale()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFuncionesOpen, setIsFuncionesOpen] = useState(false)
  const [isExamenesOpen, setIsExamenesOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsFuncionesOpen(false)
    setIsExamenesOpen(false)
  }
  
  const toggleFunciones = () => setIsFuncionesOpen(!isFuncionesOpen)
  const toggleExamenes = () => setIsExamenesOpen(!isExamenesOpen)

  // Helper function to get localized routes
  const getLocalizedRoute = (route: string) => {
    if (locale === 'es') {
      const routeMap: { [key: string]: string } = {
        'how-it-works': '/como-funciona',
        'pricing': '/precios',
        'contact': '/contacto',
        'blog': '/blog',
        'exams': '/examenes',
        'exams/manual-generator': '/examenes/generador-manual',
        'exams/ai-generator': '/examenes/generador-ia',
        'paper-exams': '/examenes-papel',
        'institutions-management': '/gestion-instituciones',
        'subjects-management': '/gestion-materias',
        'groups-management': '/gestion-grupos',
        'students-management': '/gestion-estudiantes',
        'reports': '/reportes',
        'mobile-app': '/aplicacion-movil'
      }
      return routeMap[route] || `/${route}`
    }
    return `/${route}`
  }

  // Helper function to get localized auth routes
  const getAuthRoute = (route: string) => {
    if (locale === 'es') {
      return `/auth/${route === 'register' ? 'registro' : 'iniciar-sesion'}`
    }
    return `/auth/${route}`
  }

  // Componente para items del menú móvil
  const MobileMenuItem = ({ 
    href, 
    title, 
    icon: Icon, 
    onClick,
    isSubItem = false,
    isSubSubItem = false 
  }: {
    href?: string
    title: string
    icon?: React.ComponentType<{ className?: string }>
    onClick?: () => void
    isSubItem?: boolean
    isSubSubItem?: boolean
  }) => {
    const baseClasses = "flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors"
    const subItemClasses = isSubItem ? "ml-4 text-sm py-2" : ""
    const subSubItemClasses = isSubSubItem ? "ml-8 text-xs py-2 border-l-2 border-muted pl-3" : ""

    const content = (
      <>
        {Icon && <Icon className="h-4 w-4 text-[#0b890f]" />}
        <span>{title}</span>
        {onClick && (
          <span className="ml-auto">
            {(title === t('navigation.functions') && isFuncionesOpen) || (title === t('navigation.exams') && isExamenesOpen) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
      </>
    )

    if (href) {
      return (
        <Link 
          href={href} 
          className={`${baseClasses} ${subItemClasses} ${subSubItemClasses}`}
          onClick={closeMenu}
        >
          {content}
        </Link>
      )
    }

    return (
      <button 
        className={`${baseClasses} ${subItemClasses} ${subSubItemClasses} w-full text-left`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <>
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={`ProfeVisión - ${t('navigation.home')} | ${t('homepage.heroTitle')}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
              <span className="font-bold text-white">PV</span>
            </div>
            <div className="relative">
              <span className="font-bold text-xl text-secondary dark:text-white">ProfeVision</span>
              <div className="absolute -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
                Beta
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 relative overflow-visible">
              <MainNavigation />
            </nav>
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" className="bg-accent text-black dark:text-black">
                <Link href={getAuthRoute('login')} title={`${t('buttons.login')} - ProfeVision`}>
                  {t('buttons.login')}
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90">
                <Link href={getAuthRoute('register')} title={`${t('buttons.register')} - ProfeVision`}>
                  {t('buttons.register')}
                </Link>
              </Button>
            </div>
            <LanguageSwitcher />
            <ModeToggle />
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-muted"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="absolute top-16 inset-x-0 bg-background/95 backdrop-blur-md border-b md:hidden z-40">
            <div className="container py-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Cómo funciona */}
              <MobileMenuItem href={getLocalizedRoute('how-it-works')} title={t('navigation.howItWorks')} />
              
              {/* Exámenes */}
              <div>
                <MobileMenuItem 
                  title={t('navigation.exams')} 
                  icon={FileText}
                  onClick={toggleExamenes}
                />
                {isExamenesOpen && (
                  <div className="border-l-2 border-muted ml-4">
                    <MobileMenuItem 
                      href={getLocalizedRoute('exams')} 
                      title={t('navigation.exams')}
                      icon={FileText}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('exams/manual-generator')} 
                      title={t('navigation.manualGenerator')}
                      icon={FileText}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('exams/ai-generator')} 
                      title={t('navigation.aiGenerator')}
                      icon={Brain}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('paper-exams')} 
                      title={t('navigation.paperExams')}
                      icon={ScanLine}
                      isSubItem
                    />
                  </div>
                )}
              </div>
              
              {/* Funciones */}
              <div>
                <MobileMenuItem 
                  title={t('navigation.functions')} 
                  icon={BookOpen}
                  onClick={toggleFunciones}
                />
                {isFuncionesOpen && (
                  <div className="border-l-2 border-muted ml-4">
                    <MobileMenuItem 
                      href={getLocalizedRoute('institutions-management')} 
                      title={t('navigation.institutionsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('subjects-management')} 
                      title={t('navigation.subjectsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('groups-management')} 
                      title={t('navigation.groupsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('students-management')} 
                      title={t('navigation.studentsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('reports')} 
                      title={t('navigation.reportsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href={getLocalizedRoute('mobile-app')} 
                      title={t('navigation.mobileApp')} 
                      icon={Smartphone}
                      isSubItem
                    />
                  </div>
                )}
              </div>
              
              {/* Precios */}
              <MobileMenuItem href={getLocalizedRoute('pricing')} title={t('navigation.pricing')} />
              
              {/* Blog */}
              <MobileMenuItem href={getLocalizedRoute('blog')} title={t('navigation.blog')} />
              
              {/* Contacto */}
              <MobileMenuItem href={getLocalizedRoute('contact')} title={t('navigation.contact')} />
              
              {/* Selector de idioma en mobile */}
              <div className="py-3 px-4 border-t mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('language.label')}</span>
                  <LanguageSwitcher />
                </div>
              </div>
              
              {/* Botones de autenticación */}
              <div className="pt-4 flex flex-col gap-3">
                <Button asChild variant="outline" size="sm" className="bg-accent text-black dark:text-black justify-center text-base">
                  <Link href={getAuthRoute('login')} onClick={closeMenu} title={`${t('buttons.login')} - ProfeVision`}>
                    {t('buttons.login')}
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90 text-base">
                  <Link href={getAuthRoute('register')} onClick={closeMenu} title={`${t('buttons.register')} - ProfeVision`}>
                    {t('buttons.register')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
}
