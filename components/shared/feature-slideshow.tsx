"use client"

import { useState, useEffect } from 'react'
import { LucideIcon, Clock, Brain, School, Target, Zap } from 'lucide-react'

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
}

export function FeatureSlideshow({ 
  autoAdvanceInterval = 5000, 
  className = "" 
}: FeatureSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Slideshow data
  const slides: Slide[] = [
    {
      icon: Clock,
      title: "Calificación en Minutos",
      subtitle: "Tecnología OMR + IA",
      description: "Nuestra aplicación para escanear exámenes con tecnología OMR (Visión Artificial) para papel y la IA para online te dan resultados instantáneos.",
      color: "text-[#0b890f]",
      bgColor: "bg-[#0b890f]/10"
    },
    {
      icon: Brain,
      title: "Creación de Exámenes con IA",
      subtitle: "Generación Inteligente",
      description: "Genera pruebas de calidad rápidamente, adaptadas a tus necesidades.",
      color: "text-[#bc152b]",
      bgColor: "bg-[#bc152b]/10"
    },
    {
      icon: School,
      title: "Gestión Educativa Completa",
      subtitle: "Todo Centralizado",
      description: "Centraliza instituciones, materias, grupos y estudiantes sin esfuerzo.",
      color: "text-[#ffd60a]",
      bgColor: "bg-[#ffd60a]/10"
    },
    {
      icon: Target,
      title: "Análisis Detallado de Rendimiento",
      subtitle: "Insights Clave",
      description: "Obtén insights clave para mejorar la enseñanza y el aprendizaje de tus estudiantes.",
      color: "text-[#0b890f]",
      bgColor: "bg-[#0b890f]/10"
    },
    {
      icon: Zap,
      title: "Plataforma Intuitiva",
      subtitle: "Fácil de Usar",
      description: "Diseñada para educadores, fácil de usar desde el primer momento.",
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
      {/* <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/20 to-[#ffd60a]/20 rounded-2xl blur-xl -z-10" /> */}
      <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto transition-all duration-500">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{currentSlideData.title}</h3>
            <div className="flex gap-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-[#0b890f] w-6' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
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
              <p className="text-sm text-muted-foreground">Tiempo Ahorrado</p>
              <p className="font-bold text-xl">95%</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Precisión</p>
              <p className="font-bold text-xl">99.9%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 