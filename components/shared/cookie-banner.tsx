"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('profevision-cookie-consent')
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
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

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t shadow-lg",
      "animate-in slide-in-from-bottom-5 duration-300",
      className
    )}>
      <div className="container mx-auto p-4 md:p-6">
        {!showPreferences ? (
          // Main banner
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/70 flex items-center justify-center flex-shrink-0 mt-1">
                <Cookie className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">🍪 Respetamos tu privacidad</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies para mejorar tu experiencia en ProfeVision, analizar el tráfico y personalizar el contenido. 
                  Puedes gestionar tus preferencias en cualquier momento.{" "}
                  <Link href="/cookies" className="text-[#0b890f] hover:underline font-medium">
                    Más información
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="hover:bg-muted"
              >
                Rechazar todo
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f] text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Aceptar todo
              </Button>
            </div>
          </div>
        ) : (
          // Preferences panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Preferencias de cookies</h3>
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
                    <h4 className="font-medium text-sm">Cookies necesarias</h4>
                    <p className="text-xs text-muted-foreground">Esenciales para el funcionamiento</p>
                  </div>
                  <div className="w-8 h-4 bg-[#0b890f] rounded-full flex items-center justify-end px-1">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm">Cookies analíticas</h4>
                    <p className="text-xs text-muted-foreground">Nos ayudan a mejorar el sitio</p>
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
                    <h4 className="font-medium text-sm">Cookies funcionales</h4>
                    <p className="text-xs text-muted-foreground">Mejoran la funcionalidad</p>
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
                    <h4 className="font-medium text-sm">Cookies de marketing</h4>
                    <p className="text-xs text-muted-foreground">Personalización de anuncios</p>
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
                Rechazar todo
              </Button>
              <Button
                size="sm"
                onClick={acceptSelected}
                className="flex-1 sm:flex-none bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f] text-white"
              >
                Guardar preferencias
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 