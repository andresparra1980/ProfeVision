'use client'

import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Sparkles, Clock, Target, Zap, BookOpen } from "lucide-react"
import Link from "next/link"

export default function AIGeneratorPage() {
  const t = useTranslations('common')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 w-fit mb-4">
            ✨ {t('navigation.aiGenerator')}
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t('navigation.aiGenerator')}
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            {t('navigation.aiGeneratorDescription')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Brain className="h-8 w-8 text-purple-600" />
              <CardTitle className="text-lg">Inteligencia Artificial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Utiliza modelos de IA avanzados para generar preguntas relevantes y de alta calidad.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-lg">Generación Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crea exámenes completos en segundos, ahorrando horas de trabajo manual.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Target className="h-8 w-8 text-green-600" />
              <CardTitle className="text-lg">Contenido Personalizado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adapta el contenido a tu materia específica y nivel educativo.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Sparkles className="h-8 w-8 text-yellow-600" />
              <CardTitle className="text-lg">Variedad de Preguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Genera diferentes tipos de preguntas: opción múltiple, verdadero/falso, y más.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Zap className="h-8 w-8 text-orange-600" />
              <CardTitle className="text-lg">Dificultad Adaptable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajusta automáticamente el nivel de dificultad según tus especificaciones.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <CardTitle className="text-lg">Basado en Currículo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Genera preguntas alineadas con objetivos curriculares específicos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">¿Cómo funciona la IA?</h2>
          <p className="text-muted-foreground mb-8">
            Proceso inteligente para crear exámenes de alta calidad
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              1
            </div>
            <h3 className="mb-2 text-lg font-semibold">Especifica el Tema</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa el tema, materia y nivel educativo que deseas evaluar.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              2
            </div>
            <h3 className="mb-2 text-lg font-semibold">Configura Parámetros</h3>
            <p className="text-sm text-muted-foreground">
              Define número de preguntas, tipo de evaluación y dificultad.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              3
            </div>
            <h3 className="mb-2 text-lg font-semibold">IA Genera Contenido</h3>
            <p className="text-sm text-muted-foreground">
              La inteligencia artificial crea preguntas relevantes y respuestas.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              4
            </div>
            <h3 className="mb-2 text-lg font-semibold">Revisa y Ajusta</h3>
            <p className="text-sm text-muted-foreground">
              Revisa el examen generado y realiza ajustes si es necesario.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Beneficios del Generador con IA</h2>
            <p className="text-muted-foreground">
              Descubre por qué los profesores eligen nuestra tecnología de IA
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Ahorro de Tiempo</h3>
                <p className="text-sm text-muted-foreground">Reduce el tiempo de creación de exámenes en un 90%</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Calidad Consistente</h3>
                <p className="text-sm text-muted-foreground">Preguntas bien estructuradas y pedagogicamente sólidas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Variedad Infinita</h3>
                <p className="text-sm text-muted-foreground">Nunca te quedes sin ideas para nuevas preguntas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Adaptación Automática</h3>
                <p className="text-sm text-muted-foreground">Se ajusta al nivel y currículo de tus estudiantes</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="mx-auto max-w-md">
            <h2 className="mb-4 text-2xl font-bold">¡Prueba la IA gratis!</h2>
            <p className="mb-6 text-muted-foreground">
              Experimenta el poder de la inteligencia artificial para crear exámenes excepcionales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/auth/registro">
                  Generar con IA
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/iniciar-sesion">
                  Ver Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 