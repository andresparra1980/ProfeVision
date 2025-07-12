import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  FileText,
  CheckCircle,
  QrCode,
  Zap,
  XCircle,
  AlertCircle,
  Lightbulb,
  Camera,
  ScanLine,
  Shield,
} from "lucide-react"

export default function PaperExamsPage() {
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
              <Zap className="h-3 w-3 mr-1" />
              Calificación Instantánea
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Califica Exámenes Rápido con las{" "}
              <span className="text-[#0b890f]">Hojas de Respuesta</span>{" "}
              de ProfeVisión
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Transforma la evaluación de tus estudiantes con tecnología de vanguardia.{" "}
              <span className="font-semibold text-[#0b890f]">Califica exámenes en segundos</span>{" "}
              usando solo tu smartphone o tablet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href="/auth/register">Comenzar Ahora</Link>
              </Button>
              {/* <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#0b890f] text-[#0b890f] hover:bg-[#0b890f] hover:text-white"
              >
                <Link href="/how-it-works">Ver Cómo Funciona</Link>
              </Button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Hojas de Respuesta - Características */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Hojas de Respuesta
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Características y Uso
            </h2>
          </div>
          
          {/* Primera fila: Imagen y Formato Personalizado */}
          <div className="grid gap-8 lg:grid-cols-2 items-center mt-12">
            {/* Imagen de la hoja de respuesta */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/paper-exams/hoja-respuesta-sample.jpg"
                  alt="Hoja de respuesta ProfeVisión con código QR y campos de respuesta"
                  width={400}
                  height={600}
                  className="rounded-lg shadow-xl border"
                />
              </div>
            </div>

            {/* Formato Personalizado */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                Formato Personalizado
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Identificación única</h4>
                    <p className="text-sm text-muted-foreground">
                      Cada hoja incluye el nombre e identificación del estudiante
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Código QR inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Ubicado en la esquina superior izquierda, contiene toda la información del examen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Formato adaptable</h4>
                    <p className="text-sm text-muted-foreground">
                      Entre 1 y 40 campos de respuesta según la configuración del examen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Instrucciones y Áreas Restringidas */}
          <div className="grid gap-8 lg:grid-cols-2 mt-12">
            {/* Instrucciones */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                Instrucciones de Llenado
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#0b890f] mb-2">Usar bolígrafo negro o azul</h4>
                    <p className="text-sm text-muted-foreground">
                      para rellenar completamente las burbujas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#bc152b] mb-2">Evitar lápiz</h4>
                    <p className="text-sm text-muted-foreground">
                      puede generar brillos y causar errores en la calificación
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#0b890f] mb-2">Para corregir</h4>
                    <p className="text-sm text-muted-foreground">
                      Borrar completamente el interior de la burbuja incorrecta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Áreas Restringidas */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#bc152b]/20 p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-[#bc152b] mb-6">
                Áreas Restringidas - No Escribir
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">Sobre el código QR</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">En los bordes del formato</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#bc152b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#bc152b]">Dentro de la sección de respuestas</h4>
                    </div>
                  </div>
                </div>

                <div className="bg-[#ffd60a]/10 dark:bg-[#ffd60a]/20 backdrop-blur-sm rounded-lg border border-[#ffd60a]/30 p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-[#ffd60a]/80 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#ffd60a]/90 mb-2">Tip</h4>
                      <p className="text-sm text-muted-foreground">
                        Para notas adicionales, utiliza una hoja separada
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calificación Automática */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Tecnología Avanzada
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Calificación Automática
            </h2>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2 items-center mt-12">
            {/* Imagen del proceso */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/paper-exams/calificacion-automatica.jpg"
                  alt="Proceso de calificación automática con smartphone"
                  width={400}
                  height={600}
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Proceso */}
            <div className="bg-card backdrop-blur-sm rounded-lg border border-[#0b890f]/20 p-6 shadow-lg space-y-8">
              <h3 className="text-2xl font-bold text-[#0b890f] mb-6">
                Proceso Simple en 3 Pasos
              </h3>
              
              {/* Paso 1 */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#0b890f]" />
                    Escanea las Hojas
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Ingresa a la plataforma desde tu smartphone</li>
                    <li>• Haz clic en el botón &quot;Califica Ya!&quot;</li>
                    <li>• Escanea cada hoja de respuesta con la cámara</li>
                  </ul>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <ScanLine className="h-5 w-5 text-[#0b890f]" />
                    Detección Automática
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    El sistema identifica instantáneamente:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• ✓ Versión del examen</li>
                    <li>• ✓ Respuestas marcadas por el estudiante</li>
                    <li>• ✓ Identificación del estudiante</li>
                  </ul>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#0b890f] p-3 w-12 h-12 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#0b890f]" />
                    Confirma y Guarda
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Revisa las calificaciones detectadas</li>
                    <li>• <span className="font-semibold">Opciones disponibles:</span></li>
                    <li className="ml-4">○ Atrás: Para volver a escanear si es necesario</li>
                    <li className="ml-4">○ Guardar Resultados: Para confirmar y almacenar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ahorra tiempo y esfuerzo */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Resultado Final
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Ahorra tiempo y esfuerzo
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto mt-12">
            <p className="text-lg text-muted-foreground mb-6 text-center">
              Repite este proceso con cada examen y tendrás{" "}
              <span className="font-bold text-[#0b890f]">todos los resultados calificados e ingresados automáticamente</span>{" "}
              en el sistema de manera rápida y eficiente.
            </p>
            
            <div className="bg-gradient-to-r from-[#0b890f]/10 to-[#0b890f]/5 rounded-lg p-6 border border-[#0b890f]/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-[#0b890f]" />
                <h3 className="text-xl font-bold text-[#0b890f]">Ventaja</h3>
              </div>
              <p className="text-lg font-semibold text-center">
                Sin necesidad de calificación manual - todo el proceso es automático y preciso.
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
              Califica exámenes en segundos con las hojas de respuesta de ProfeVisión
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Digitaliza tu proceso de evaluación con tecnología de escaneo automático y obtén resultados precisos al instante.
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
                <Link href="/paper-exams">Ver Más Detalles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 