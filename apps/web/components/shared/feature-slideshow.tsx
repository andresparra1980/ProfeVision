"use client"

import { useState, useEffect } from 'react'
import { LucideIcon, Clock, Brain, School, Target, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Slide {
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  color: string
  bgColor: string
}

interface FeatureSlideshowProps {
  autoAdvanceInterval?: number
  className?: string
  showNeonEffect?: boolean
}

export function FeatureSlideshow({ 
  autoAdvanceInterval = 5000, 
  className = "",
  showNeonEffect = false
}: FeatureSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const t = useTranslations('feature-slideshow')

  // Slideshow data with translations
  const slides: Slide[] = [
    {
      icon: Clock,
      title: t('slides.0.title'),
      subtitle: t('slides.0.subtitle'),
      description: t('slides.0.description'),
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    },
    {
      icon: School,
      title: t('slides.1.title'),
      subtitle: t('slides.1.subtitle'),
      description: t('slides.1.description'),
      color: "text-[#ffd60a]",
      bgColor: "bg-[#ffd60a]/10"
    },
    {
      icon: Brain,
      title: t('slides.2.title'),
      subtitle: t('slides.2.subtitle'),
      description: t('slides.2.description'),
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    },
    {
      icon: Target,
      title: t('slides.3.title'),
      subtitle: t('slides.3.subtitle'),
      description: t('slides.3.description'),
      color: "text-[#0b890f]",
      bgColor: "bg-[#0b890f]/10"
    },
    {
      icon: Zap,
      title: t('slides.4.title'),
      subtitle: t('slides.4.subtitle'),
      description: t('slides.4.description'),
      color: "text-[#bc152b]",
      bgColor: "bg-[#bc152b]/10"
    }
  ]

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, autoAdvanceInterval)

    return () => clearInterval(timer)
  }, [slides.length, autoAdvanceInterval])

  const currentSlideData = slides[currentSlide]

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {showNeonEffect ? (
        <>
          {/* Neon gradient border container */}
          <div className="relative p-0.5 rounded-2xl bg-gradient-to-r from-[#0b890f]/70 via-[#ffd60a]/70 to-[#bc152b]/70 shadow-2xl">
            {/* Extended glowing effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#0b890f]/40 via-[#ffd60a]/40 to-[#bc152b]/40 rounded-2xl blur-lg opacity-50 animate-[pulse_2s_ease-in-out_infinite] -z-10" />
            
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b890f]/50 via-[#ffd60a]/50 to-[#bc152b]/50 rounded-2xl blur-sm opacity-75 animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
            
            {/* Main card content */}
            <div className="relative bg-card backdrop-blur-sm rounded-xl shadow-xl overflow-hidden w-full max-w-md mx-auto transition-all duration-500">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-base">{currentSlideData.title}</h2>
                  <div className="flex gap-1" role="status" aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}>
                    {slides.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'bg-[#0b890f] w-6' 
                            : 'bg-muted-foreground/30'
                        }`}
                        role="presentation"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full ${currentSlideData.bgColor} flex items-center justify-center transition-all duration-500`}>
                      <currentSlideData.icon className={`h-8 w-8 ${currentSlideData.color} transition-all duration-500`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-2">{currentSlideData.subtitle}</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{currentSlideData.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-foreground/70">{t('metrics.timeSaved')}</p>
                    <p className="font-bold text-xl">95%</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-foreground/70">{t('metrics.accuracy')}</p>
                    <p className="font-bold text-xl">99.9%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Simple border version */
        <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto transition-all duration-500">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-base">{currentSlideData.title}</h2>
              <div className="flex gap-1" role="status" aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}>
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-[#0b890f] w-6' 
                        : 'bg-muted-foreground/30'
                    }`}
                    role="presentation"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-full ${currentSlideData.bgColor} flex items-center justify-center transition-all duration-500`}>
                  <currentSlideData.icon className={`h-8 w-8 ${currentSlideData.color} transition-all duration-500`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg mb-2">{currentSlideData.subtitle}</h4>
                <p className="text-base text-muted-foreground leading-relaxed">{currentSlideData.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-foreground/70">{t('metrics.timeSaved')}</p>
                <p className="font-bold text-xl">95%</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-foreground/70">{t('metrics.accuracy')}</p>
                <p className="font-bold text-xl">99.9%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 