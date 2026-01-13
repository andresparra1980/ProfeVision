"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from 'next-intl'
import { Button } from "@/components/ui/button"
import { X, Cookie, Settings, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

interface CookieBannerProps {
  className?: string
}

export function CookieBanner({ className }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: true,
    marketing: true,
    functional: true,
  })

  const t = useTranslations('cookie-banner')
  const locale = useLocale()

  // 🌍 Helper function to get localized routes
  const routeMap = {
    'cookies': {
      es: '/cookies',
      en: '/cookies',
      fr: '/cookies',
      pt: '/cookies'
    }
  } as const;
  const getLocalizedRoute = (routeKey: keyof typeof routeMap | string): string => {
    if (routeKey in routeMap) {
      const routes = routeMap[routeKey as keyof typeof routeMap];
      return routes[locale as keyof typeof routes] || routes.en;
    }
    return routeKey;
  }

  useEffect(() => {
    setMounted(true)
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('profevision-cookie-consent')
    if (cookieConsent) {
      // User already made choice, don't show banner
      return
    }
    // Show banner after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('profevision-cookie-consent', JSON.stringify(consent))
    setIsVisible(false)
    
    // Initialize analytics if accepted
    if (consent.analytics) {
      // GTM dataLayer push for analytics consent
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'consent_update',
          analytics_consent: 'granted'
        })
      }
    }
  }

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('profevision-cookie-consent', JSON.stringify(consent))
    setIsVisible(false)
    
    // Update GTM consent
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        analytics_consent: preferences.analytics ? 'granted' : 'denied'
      })
    }
  }

  const rejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('profevision-cookie-consent', JSON.stringify(consent))
    setIsVisible(false)
  }

  // Don't show if user already made a choice (checked in localStorage)
  const shouldShow = mounted && isVisible

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t shadow-lg transition-transform duration-300",
        shouldShow ? "translate-y-0" : "translate-y-full pointer-events-none",
        className
      )}
      suppressHydrationWarning
    >
      <div className="container mx-auto p-3 md:p-4">
        {!showPreferences ? (
          // Main banner
                     <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
             <div className="flex items-start gap-2 flex-1">
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                 <Cookie className="h-3 w-3 text-white" />
               </div>
               <div className="flex-1">
                 <h3 className="font-medium text-base mb-1">{t('main.title')}</h3>
                 <p className="text-xs text-muted-foreground leading-snug">
                   {t('main.description')}{" "}
                   <Link href={getLocalizedRoute('cookies')} className="text-[#087a0c] hover:underline font-medium">
                     {t('main.moreInfo')}
                   </Link>
                 </p>
               </div>
             </div>
            
                         <div className="flex flex-col sm:flex-row gap-1.5 w-full md:w-auto">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowPreferences(true)}
                 className="flex items-center gap-1 h-8 px-3 text-xs"
               >
                 <Settings className="h-3 w-3" />
                 {t('main.configure')}
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={rejectAll}
                 className="hover:bg-muted h-8 px-3 text-xs"
               >
                 {t('main.rejectAll')}
               </Button>
               <Button
                 size="sm"
                 onClick={acceptAll}
                 className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f] text-white h-8 px-3 text-xs"
               >
                 <Check className="h-3 w-3 mr-1" />
                 {t('main.acceptAll')}
               </Button>
             </div>
          </div>
        ) : (
          // Preferences panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t('preferences.title')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">{t('preferences.necessary.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('preferences.necessary.description')}</p>
                  </div>
                  <div className="w-8 h-4 bg-[#0b890f] rounded-full flex items-center justify-end px-1">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm">{t('preferences.analytics.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('preferences.analytics.description')}</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className={cn(
                      "w-8 h-4 rounded-full flex items-center transition-colors",
                      preferences.analytics ? "bg-[#0b890f] justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className="w-3 h-3 bg-white rounded-full mx-0.5"></div>
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm">{t('preferences.functional.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('preferences.functional.description')}</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                    className={cn(
                      "w-8 h-4 rounded-full flex items-center transition-colors",
                      preferences.functional ? "bg-[#0b890f] justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className="w-3 h-3 bg-white rounded-full mx-0.5"></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm">{t('preferences.marketing.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('preferences.marketing.description')}</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                    className={cn(
                      "w-8 h-4 rounded-full flex items-center transition-colors",
                      preferences.marketing ? "bg-[#0b890f] justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className="w-3 h-3 bg-white rounded-full mx-0.5"></div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="flex-1 sm:flex-none"
              >
                {t('main.rejectAll')}
              </Button>
              <Button
                size="sm"
                onClick={acceptSelected}
                className="flex-1 sm:flex-none bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f] text-white"
              >
                {t('preferences.savePreferences')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 