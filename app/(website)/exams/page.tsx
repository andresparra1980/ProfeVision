import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileEdit,
  Upload,
  CheckCircle, 
  Target,
  BarChart3,
  Recycle,
  Zap,
  Brain,
} from "lucide-react"

export default function ExamsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit">
              Generador de Exámenes
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Crea Exámenes con <span className="text-[#0b890f]">Inteligencia Artificial</span> en segundos
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Transforma cualquier contenido educativo en evaluaciones completas y personalizadas. 
              ProfeVisión utiliza IA avanzada para generar preguntas de opción múltiple, verdadero/falso 
              y abiertas desde tus materiales de clase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href="/auth/register">Comenzar Ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Métodos de Creación
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Características Principales
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Creación con IA */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <Brain className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">Creación con IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  Utiliza inteligencia artificial avanzada para generar preguntas personalizadas automáticamente.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Genera preguntas de opción múltiple, verdadero/falso y abiertas
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Personaliza tema, dificultad y estilo
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Selecciona número de opciones de respuesta
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Ajusta según sección del plan de estudios
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Ahorra tiempo y mejora la calidad
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creación Manual */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <FileEdit className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">Creación Manual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  Plataforma amigable e intuitiva para crear exámenes completamente personalizados.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Interfaz fácil de usar y navegable
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Control total sobre cada pregunta
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Configura título, materia y grupo
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Establece duración y puntaje total
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Añade instrucciones personalizadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Importación de Archivos */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <Upload className="h-8 w-8 text-[#0b890f]" />
                </div>
                <CardTitle className="text-center text-lg">Importación de Archivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  Sube y convierte tus exámenes existentes desde múltiples formatos de archivo.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Compatible con PDF, DOC y DOCX
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Procesa apuntes de conferencias
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Convierte libros de texto
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Importa presentaciones existentes
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0b890f] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Reutiliza contenido académico previo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Proceso Paso a Paso
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              ¿Cómo Funciona?
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Paso 1 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-bold">Elige tu Método</h3>
              <p className="text-muted-foreground">
                Selecciona entre crear con IA, manual o importar archivos existentes según tus 
                necesidades específicas.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-bold">Configura tu Examen</h3>
              <p className="text-muted-foreground">
                Define parámetros como tema, dificultad, número de preguntas y tipo de evaluación 
                deseada.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/80 p-6 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-bold">Genera y Descarga</h3>
              <p className="text-muted-foreground">
                Obtén tu examen listo para usar con hojas de respuesta en PDF personalizadas para 
                cada estudiante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios para Educadores */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Ventajas Clave
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Beneficios para Educadores
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#ffd60a]/20 to-[#ffd60a]/10 p-4">
                <Zap className="h-6 w-6 text-[#ffd60a]" />
              </div>
              <h3 className="text-lg text-center font-bold">Ahorra Tiempo</h3>
              <p className="text-center text-muted-foreground text-sm">
                Reduce el tiempo de creación de exámenes de horas a minutos
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#bc152b]/20 to-[#bc152b]/10 p-4">
                <Target className="h-6 w-6 text-[#bc152b]" />
              </div>
              <h3 className="text-lg text-center font-bold">Alta Precisión</h3>
              <p className="text-center text-muted-foreground text-sm">
                IA entrenada para generar preguntas relevantes y bien estructuradas
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <BarChart3 className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">Formatos Múltiples</h3>
              <p className="text-center text-muted-foreground text-sm">
                Soporte para diferentes tipos de preguntas y estilos de evaluación
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Recycle className="h-6 w-6 text-[#0b890f]" />
              </div>
              <h3 className="text-lg text-center font-bold">Reutilizable</h3>
              <p className="text-center text-muted-foreground text-sm">
                Importa y adapta contenido existente fácilmente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              Transforma tu contenido en pruebas interesantes en segundos
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Genera múltiples tipos de preguntas a partir de texto o archivos cargados de manera inteligente y eficiente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href="/auth/register">Comenzar Ahora</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href="/how-it-works">Conocer Más</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 