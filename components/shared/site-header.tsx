"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from 'next-intl'
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
import { AppPathnames } from "@/i18n/routing"
import { useAuth } from "./auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export function SiteHeader() {
  const t = useTranslations('common')
  const { session, isLoading } = useAuth()
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

  // Componente para items del menú móvil
  const MobileMenuItem = ({ 
    href, 
    title, 
    icon: Icon, 
    onClick,
    isSubItem = false,
    isSubSubItem = false 
  }: {
    href?: AppPathnames
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={href as any} 
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
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={`ProfeVisión - ${t('navigation.home')} | ${t('homepage.hero.title')}`}>
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
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ) : session ? (
                <Button asChild size="sm" variant="secondary" className="text-background dark:text-foreground">
                  <Link href="/dashboard" title={`${t('buttons.goToDashboard')} - ProfeVision`}>
                    {t('buttons.goToDashboard')}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" className="bg-accent text-black dark:text-black">
                    <Link href="/auth/login" title={`${t('buttons.login')} - ProfeVision`}>
                      {t('buttons.login')}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90">
                    <Link href="/auth/register" title={`${t('buttons.register')} - ProfeVision`}>
                      {t('buttons.register')}
                    </Link>
                  </Button>
                </>
              )}
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
              <MobileMenuItem href='/how-it-works' title={t('navigation.howItWorks')} />
              
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
                      href='/exams' 
                      title={t('navigation.exams')}
                      icon={FileText}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/exams/manual-generator' 
                      title={t('navigation.manualGenerator')}
                      icon={FileText}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/exams/ai-generator' 
                      title={t('navigation.aiGenerator')}
                      icon={Brain}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/paper-exams' 
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
                      href='/institutions-management' 
                      title={t('navigation.institutionsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/subjects-management' 
                      title={t('navigation.subjectsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/groups-management' 
                      title={t('navigation.groupsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/students-management' 
                      title={t('navigation.studentsManagement')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/reports' 
                      title={t('navigation.reports')} 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href='/mobile-app' 
                      title={t('navigation.mobileApp')} 
                      icon={Smartphone}
                      isSubItem
                    />
                  </div>
                )}
              </div>

              {/* Precios */}
              <MobileMenuItem href='/pricing' title={t('navigation.pricing')} />
              
              {/* Contacto */}
              <MobileMenuItem href='/contact' title={t('navigation.contact')} />

              {/* Blog */}
              <MobileMenuItem href='/blog' title={t('navigation.blog')} />
              
              <div className="border-t mt-4">
                <div className="pt-4 flex flex-col gap-3">
                  {isLoading ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : session ? (
                    <Button asChild size="lg" className="w-full" variant="secondary">
                      <Link href="/dashboard" onClick={closeMenu} title={`${t('buttons.goToDashboard')} - ProfeVision`}>
                        {t('buttons.goToDashboard')}
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" size="sm" className="bg-accent text-black dark:text-black justify-center text-base">
                        <Link href="/auth/login" onClick={closeMenu} title={`${t('buttons.login')} - ProfeVision`}>
                          {t('buttons.login')}
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90 text-base">
                        <Link href="/auth/register" onClick={closeMenu} title={`${t('buttons.register')} - ProfeVision`}>
                          {t('buttons.register')}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
