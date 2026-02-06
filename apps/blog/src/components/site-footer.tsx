import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'

const logoFont = "font-bold tracking-tight"

export function SiteFooter() {
    const t = useTranslations('common')
    const locale = useLocale()

    return (
        <footer className="border-t bg-card mt-auto">
            <div className="container px-4 md:px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Logo and description */}
                    <div className="col-span-1 md:col-span-2 text-center md:text-left">
                        <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity justify-center md:justify-start w-fit mx-auto md:mx-0" title="ProfeVisión Blog">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
                                <span className={`font-bold text-white ${logoFont}`}>PV</span>
                            </div>
                            <div className="relative">
                                <span className={`font-bold text-secondary dark:text-white text-xl ${logoFont}`}>ProfeVision</span>
                                <span className="ml-2 text-sm text-muted-foreground">Blog</span>
                            </div>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2 max-w-xs mx-auto md:mx-0">
                            {t('footerDescription')}
                        </p>
                        <a
                            href="mailto:info@profevision.com"
                            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 justify-center md:justify-start transition-colors w-fit mx-auto md:mx-0"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                            </svg>
                            info@profevision.com
                        </a>
                    </div>

                    {/* Navigation links */}
                    <div>
                        <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">{t('navigation')}</h3>
                        <ul className="space-y-1 md:space-y-2">
                            <li>
                                <Link href="/" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('home')}>
                                    {t('home')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/categories" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('categories')}>
                                    {t('categories')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/authors" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('authors')}>
                                    {t('authors')}
                                </Link>
                            </li>
                            <li>
                                <a href={`https://profevision.com/${locale}`} className="text-xs md:text-sm text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer" title={t('mainSite')}>
                                    {t('mainSite')}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-8 md:mt-12 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center">
                    <p className={`text-xs text-muted-foreground ${logoFont}`}>
                        &copy; 2026 ProfeVision. {t('copyright')}
                    </p>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        <a href={`https://profevision.com/${locale}/cookies`} className="text-xs text-muted-foreground hover:text-foreground" title={t('cookies')}>
                            {t('cookies')}
                        </a>
                        <a href={`https://profevision.com/${locale}/terms`} className="text-xs text-muted-foreground hover:text-foreground" title={t('terms')}>
                            {t('terms')}
                        </a>
                        <a href={`https://profevision.com/${locale}/privacy`} className="text-xs text-muted-foreground hover:text-foreground" title={t('privacy')}>
                            {t('privacy')}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

