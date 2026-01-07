'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { logoFont } from '@/lib/fonts'

export function SiteFooter() {
  const t = useTranslations('common')

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-2 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity justify-center md:justify-start w-fit mx-auto md:mx-0" title={`ProfeVisión - ${t('navigation.home')}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
                <span className={`font-bold text-white ${logoFont}`}>PV</span>
              </div>
              <div className="relative">
                <span className={`font-bold text-secondary dark:text-white text-xl ${logoFont}`}>ProfeVision</span>
                <div className="absolute -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
                  Beta
                </div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-2 max-w-xs mx-auto md:mx-0">
              {t('footer.description')}
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
            <div className="flex gap-4 justify-center md:justify-start">
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <span className="sr-only">Facebook</span>
              </a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Twitter/X">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                <span className="sr-only">Twitter/X</span>
              </a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6 col-span-1 md:col-span-2 lg:col-span-3">
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">{t('footer.sections.product')}</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="/how-it-works" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.howItWorks')}>
                    {t('footer.links.howItWorks')}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.pricing')}>
                    {t('footer.links.pricing')}
                  </Link>
                </li>
                <li>
                  <Link href="/exams-with-ai" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.aiGenerator')}>
                    {t('footer.links.aiGenerator')}
                  </Link>
                </li>
                <li>
                  <Link href="/mobile-app" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.mobileApp')}>
                    {t('footer.links.mobileApp')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">{t('footer.sections.company')}</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="/how-it-works" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.about')}>
                    {t('footer.links.about')}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.blog')}>
                    {t('footer.links.blog')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.contact')}>
                    {t('footer.links.contact')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">{t('footer.sections.legal')}</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="/terms" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.terms')}>
                    {t('footer.links.terms')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.privacy')}>
                    {t('footer.links.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-xs md:text-sm text-muted-foreground hover:text-foreground" title={t('footer.links.cookies')}>
                    {t('footer.links.cookies')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 md:mt-12 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className={`text-xs text-muted-foreground ${logoFont}`}>
            &copy; 2026 ProfeVision. {t('footer.copyright')}
          </p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-foreground" title={t('footer.links.cookiesPolicy')}>
              {t('footer.links.cookies')}
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground" title={t('footer.links.termsOfService')}>
              {t('footer.links.termsOfService')}
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground" title={t('footer.links.privacyPolicy')}>
              {t('footer.links.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 