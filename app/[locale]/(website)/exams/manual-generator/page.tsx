'use client'

import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Edit3, Save, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ManualGeneratorPage() {
  const t = useTranslations('common')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit mb-4">
            {t('navigation.manualGenerator')}
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t('navigation.manualGenerator')}
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Crea exámenes personalizados de forma manual con total control sobre cada pregunta y respuesta.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <FileText className="h-8 w-8 text-[#0b890f]" />
              <CardTitle className="text-lg">Creación Flexible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Diseña exámenes con múltiples tipos de preguntas y personaliza cada detalle según tus necesidades.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Plus className="h-8 w-8 text-[#0b890f]" />
              <CardTitle className="text-lg">Preguntas Ilimitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Agrega tantas preguntas como necesites sin restricciones de cantidad.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Edit3 className="h-8 w-8 text-[#0b890f]" />
              <CardTitle className="text-lg">Edición Avanzada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Editor de texto enriquecido con soporte para formatos, imágenes y fórmulas matemáticas.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Save className="h-8 w-8 text-[#0b890f]" />
              <CardTitle className="text-lg">Plantillas Reutilizables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Guarda tus exámenes como plantillas para reutilizar en futuras evaluaciones.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">¿Cómo funciona?</h2>
          <p className="text-muted-foreground mb-8">
            Sigue estos sencillos pasos para crear tu examen manual
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0b890f] text-white">
              1
            </div>
            <h3 className="mb-2 text-lg font-semibold">Configura el Examen</h3>
            <p className="text-sm text-muted-foreground">
              Define el título, instrucciones y configuración general del examen.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0b890f] text-white">
              2
            </div>
            <h3 className="mb-2 text-lg font-semibold">Añade Preguntas</h3>
            <p className="text-sm text-muted-foreground">
              Crea preguntas de opción múltiple, verdadero/falso o respuesta corta.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0b890f] text-white">
              3
            </div>
            <h3 className="mb-2 text-lg font-semibold">Publica y Comparte</h3>
            <p className="text-sm text-muted-foreground">
              Genera el examen y compártelo con tus estudiantes de forma segura.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="mx-auto max-w-md">
            <h2 className="mb-4 text-2xl font-bold">¡Comienza a crear tu examen!</h2>
            <p className="mb-6 text-muted-foreground">
              Únete a miles de profesores que ya confían en ProfeVision para crear exámenes de calidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[#0b890f] hover:bg-[#0b890f]/90">
                <Link href="/auth/registro">
                  Crear Cuenta Gratis
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/iniciar-sesion">
                  Iniciar Sesión
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 