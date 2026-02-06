"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@profevision/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, Home, ExternalLink, Tag, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@profevision/ui/tooltip"
import { logoFont } from "@/lib/fonts"


interface MobileMenuItemProps {
    href: string
    title: string
    icon?: React.ComponentType<{ className?: string }>
    onNavigate?: () => void
}

function MobileMenuItem({
    href,
    title,
    icon: Icon,
    onNavigate,
}: MobileMenuItemProps) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors"
            onClick={onNavigate}
        >
            {Icon && <Icon className="h-4 w-4 text-[#0b890f]" />}
            <span>{title}</span>
        </Link>
    )
}

export function SiteHeader() {
    const t = useTranslations('common')
    const locale = useLocale()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    return (
        <>
            <header
                className={`fixed w-full z-[2000] border-b bg-card`}
                suppressHydrationWarning
            >
                <div className="container flex h-16 items-center justify-between relative">
                    {/* Logo - links to blog home */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={`ProfeVisión Blog - ${t('home')}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
                            <span className={`font-bold text-white ${logoFont}`}>PV</span>
                        </div>
                        <div className="relative">
                            <span className={`font-bold text-xl text-secondary dark:text-white ${logoFont}`}>ProfeVision</span>
                            <span className="ml-2 text-sm text-muted-foreground">Blog</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Desktop navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                                            {t('home')}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('home')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/categories" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                                            {t('categories')}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('categories')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/authors" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                                            {t('authors')}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('authors')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </nav>

                        {/* Go to ProfeVision button */}
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="hidden md:flex gap-2 text-background dark:text-foreground"
                        >
                            <a
                                href={`https://profevision.com/${locale}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {t('mainSite')}
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </Button>

                        <TooltipProvider>
                            <LanguageSwitcher />
                        </TooltipProvider>
                        <ModeToggle />

                        {/* Mobile menu button */}
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
                            <MobileMenuItem href="/" title={t('home')} icon={Home} onNavigate={closeMenu} />
                            <MobileMenuItem href="/categories" title={t('categories')} icon={Tag} onNavigate={closeMenu} />
                            <MobileMenuItem href="/authors" title={t('authors')} icon={User} onNavigate={closeMenu} />

                            {/* Link back to main site */}
                            <div className="border-t mt-4 pt-4">
                                <a
                                    href={`https://profevision.com/${locale}`}
                                    className="flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4 text-[#0b890f]" />
                                    <span>{t('mainSite')}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        </>
    )
}

