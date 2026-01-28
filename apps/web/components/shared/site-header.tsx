"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { MainNavigation } from "@/components/shared/main-navigation"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"

import {
  BookOpen,
  Brain,
  ScanLine,
  Smartphone
} from "lucide-react"
import { AppPathnames } from "@/i18n/routing"
import { useAuth } from "./auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Moved outside to prevent re-creation on every render
interface MobileMenuItemProps {
  href?: AppPathnames
  title: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  onNavigate?: () => void
  isSubItem?: boolean
  isSubSubItem?: boolean
  isExpanded?: boolean
  hasSubmenu?: boolean
}

function MobileMenuItem({
  href,
  title,
  icon: Icon,
  onClick,
  onNavigate,
  isSubItem = false,
  isSubSubItem = false,
  isExpanded = false,
  hasSubmenu = false
}: MobileMenuItemProps) {
  const baseClasses = "flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors"
  const subItemClasses = isSubItem ? "ml-4 text-sm py-2" : ""
  const subSubItemClasses = isSubSubItem ? "ml-8 text-xs py-2 border-l-2 border-muted pl-3" : ""

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 text-[#0b890f]" />}
      <span>{title}</span>
      {hasSubmenu && (
        <span className="ml-auto">
          {isExpanded ? (
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
        onClick={onNavigate}
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

export function SiteHeader() {
  const t = useTranslations('common')
  const { session, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFuncionesOpen, setIsFuncionesOpen] = useState(false)

  // Hydration fix: ensure consistent render between server and client
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsFuncionesOpen(false)
  }

  const toggleFunciones = () => setIsFuncionesOpen(!isFuncionesOpen)

  // Show loading state on server and during initial client render
  const showAuthLoading = !mounted || isLoading

  return (
    <>
      <header
        className={`fixed w-full z-[2000] border-b ${isMenuOpen ? 'bg-white dark:bg-background' : 'bg-background/80 backdrop-blur-md'}`}
        suppressHydrationWarning
      >
        <div className="container flex h-16 items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={`ProfeVisión - ${t('navigation.home')} | ${t('homepage.hero.title')}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
              <span className={`font-bold text-white font-logo`}>PV</span>
            </div>
            <div className="relative">
              <span className={`font-bold text-xl text-secondary dark:text-white font-logo`}>ProfeVision</span>
              <div className="absolute -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
                Beta
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 relative overflow-visible">
              <MainNavigation />
            </nav>
            {/* Auth buttons - consistent wrapper structure for hydration */}
            <div className="hidden md:flex items-center gap-2" suppressHydrationWarning>
              {showAuthLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ) : session ? (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild size="sm" variant="secondary" className="text-background dark:text-foreground">
                          <Link href="/dashboard">
                            {t('buttons.goToDashboard')}
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {`${t('buttons.goToDashboard')} - ProfeVision`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" className="bg-accent text-black dark:text-black">
                    <Link href="/auth/login" title={`${t('buttons.login')} - ProfeVision`}>
                      {t('buttons.login')}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary justify-center">
                    <Link href="/auth/register" title={`${t('buttons.register')} - ProfeVision`}>
                      {t('buttons.register')}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            <TooltipProvider>
              <LanguageSwitcher />
            </TooltipProvider>
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
          <div className="fixed top-16 inset-x-0 bottom-0 bg-white dark:bg-background md:hidden z-[60] border-t shadow-lg">
            <div className="container py-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Inicio */}
              <MobileMenuItem href='/' title={t('navigation.home')} onNavigate={closeMenu} />

              {/* Funciones (replica del menú de escritorio) */}
              <div>
                <MobileMenuItem
                  title={t('navigation.functions')}
                  icon={BookOpen}
                  onClick={toggleFunciones}
                  hasSubmenu
                  isExpanded={isFuncionesOpen}
                />
                {isFuncionesOpen && (
                  <div className="border-l-2 border-muted ml-4">
                    <MobileMenuItem
                      href='/how-it-works'
                      title={t('navigation.howItWorks')}
                      icon={BookOpen}
                      isSubItem
                      onNavigate={closeMenu}
                    />
                    <MobileMenuItem
                      href='/exams-with-ai'
                      title={t('navigation.aiGenerator')}
                      icon={Brain}
                      isSubItem
                      onNavigate={closeMenu}
                    />
                    <MobileMenuItem
                      href='/paper-exams'
                      title={t('navigation.paperExams')}
                      icon={ScanLine}
                      isSubItem
                      onNavigate={closeMenu}
                    />
                    <MobileMenuItem
                      href='/mobile-app'
                      title={t('navigation.mobileApp')}
                      icon={Smartphone}
                      isSubItem
                      onNavigate={closeMenu}
                    />
                  </div>
                )}
              </div>

              {/* Precios */}
              <MobileMenuItem href='/pricing' title={t('navigation.pricing')} onNavigate={closeMenu} />

              {/* Contacto */}
              <MobileMenuItem href='/contact' title={t('navigation.contact')} onNavigate={closeMenu} />

              {/* Blog */}
              <MobileMenuItem href='/blog' title={t('navigation.blog')} onNavigate={closeMenu} />

              <div className="border-t mt-4">
                {/* Mobile auth buttons - consistent wrapper structure */}
                <div className="pt-4 flex flex-col gap-3" suppressHydrationWarning>
                  {showAuthLoading ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : session ? (
                    <div className="flex flex-col gap-3">
                      <Button asChild size="lg" className="w-full" variant="secondary">
                        <Link href="/dashboard" onClick={closeMenu} title={`${t('buttons.goToDashboard')} - ProfeVision`}>
                          {t('buttons.goToDashboard')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline" size="sm" className="bg-accent text-black dark:text-black justify-center text-base">
                        <Link href="/auth/login" onClick={closeMenu} title={`${t('buttons.login')} - ProfeVision`}>
                          {t('buttons.login')}
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="bg-primary justify-center">
                        <Link href="/auth/register" onClick={closeMenu} title={`${t('buttons.register')} - ProfeVision`}>
                          {t('buttons.register')}
                        </Link>
                      </Button>
                    </div>
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
