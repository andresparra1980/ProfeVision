import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  BookOpen, 
  School, 
  CheckCircle, 
  X,
  Clock,
  Target,
  Building,
  Smartphone,
  BarChart3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HowItWorksPage() {
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
              ¿Cómo Funciona?
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Crea y califica exámenes en <span className="text-[#0b890f]">segundos</span> con ProfeVision
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              La forma más rápida y moderna de evaluar a tus estudiantes
            </p>
            <p className="max-w-[900px] text-muted-foreground">
              ¿Te gustaría crear exámenes en minutos y calificarlos en segundos? Con <strong>ProfeVision</strong> puedes hacerlo. 
              Nuestra plataforma está diseñada para profesores y escuelas que buscan ahorrar tiempo y obtener resultados precisos. 
              Crea exámenes con inteligencia artificial, sube tus pruebas en PDF y califica automáticamente escaneando las hojas 
              de respuesta impresas con tu celular. Además, organiza todo por instituciones, materias y clases, y accede a un 
              dashboard con métricas detalladas de los resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href="/auth/register">Empieza ahora gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Funcionalidades Principales
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              ¿Qué puedes hacer con ProfeVision?
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                  <BookOpen className="h-8 w-8 text-[#0b890f]" />
                </div>
                                 <CardTitle className="text-center text-lg">1. Crea exámenes con IA o sube tus pruebas en PDF</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-start gap-2">
                     <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">Genera exámenes automáticamente:</p>
                       <p className="text-sm text-muted-foreground">
                         Usa nuestra inteligencia artificial para crear exámenes personalizados en segundos. 
                         Elige entre preguntas de opción múltiple, abiertas o mixtas.
                       </p>
                     </div>
                   </div>
                   <div className="flex items-start gap-2">
                     <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">Sube tus exámenes en PDF:</p>
                       <p className="text-sm text-muted-foreground">
                         Si ya tienes tus pruebas listas, simplemente súbelas a la plataforma. 
                         No necesitas transcribir nada.
                       </p>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Feature 2 */}
             <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
               <CardHeader>
                 <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                   <Smartphone className="h-8 w-8 text-[#0b890f]" />
                 </div>
                 <CardTitle className="text-center text-lg">2. Califica más rápido con tu celular</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-start gap-2">
                     <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">Escanea hojas de respuesta impresas:</p>
                       <p className="text-sm text-muted-foreground">
                         Imprime las hojas de respuesta, aplícalas en clase y luego escanéalas con tu celular 
                         usando nuestra tecnología de Visión Artificial (OMR). Obtén las calificaciones al instante, 
                         sin errores y sin esfuerzo manual.
                       </p>
                     </div>
                   </div>
                   <div className="flex items-start gap-2">
                     <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">Resultados automáticos y precisos:</p>
                       <p className="text-sm text-muted-foreground">
                         Olvídate de revisar hoja por hoja. ProfeVision te entrega los resultados en segundos 
                         y los organiza automáticamente.
                       </p>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Feature 3 */}
             <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
               <CardHeader>
                 <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4 w-fit mx-auto">
                   <School className="h-8 w-8 text-[#0b890f]" />
                 </div>
                 <CardTitle className="text-center text-lg">3. Organiza todo por instituciones, materias y clases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Crea tu institución:</p>
                      <p className="text-sm text-muted-foreground">
                        Registra tu escuela, academia o centro educativo en pocos pasos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Agrega materias y clases:</p>
                      <p className="text-sm text-muted-foreground">
                        Organiza tus exámenes y resultados por materia y grupo. 
                        Así tendrás todo ordenado y fácil de encontrar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Dashboard con métricas:</p>
                      <p className="text-sm text-muted-foreground">
                        Visualiza el rendimiento de tus estudiantes con gráficos y reportes claros. 
                        Analiza resultados por clase, materia o período y toma mejores decisiones.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Ventajas
            </div>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Beneficios de usar ProfeVision
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                <Clock className="h-6 w-6 text-[#0b890f]" />
              </div>
                             <h3 className="text-lg text-center font-bold">Ahorra tiempo</h3>
               <p className="text-center text-muted-foreground">
                 Crea y califica exámenes en minutos.
               </p>
             </div>
             
             <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
               <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                 <Target className="h-6 w-6 text-[#0b890f]" />
               </div>
               <h3 className="text-lg text-center font-bold">Resultados precisos</h3>
               <p className="text-center text-muted-foreground">
                 Elimina errores humanos con la calificación automática.
               </p>
             </div>
             
             <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
               <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                 <Building className="h-6 w-6 text-[#0b890f]" />
               </div>
               <h3 className="text-lg text-center font-bold">Organización total</h3>
               <p className="text-center text-muted-foreground">
                 Mantén tus exámenes y resultados ordenados por institución, materia y clase.
               </p>
             </div>
             
             <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
               <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                 <Smartphone className="h-6 w-6 text-[#0b890f]" />
               </div>
               <h3 className="text-lg text-center font-bold">Acceso desde cualquier dispositivo</h3>
               <p className="text-center text-muted-foreground">
                 Trabaja desde tu computadora o celular.
               </p>
             </div>
             
             <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
               <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                 <BarChart3 className="h-6 w-6 text-[#0b890f]" />
               </div>
               <h3 className="text-lg text-center font-bold">Análisis avanzado</h3>
              <p className="text-center text-muted-foreground">
                Visualiza el progreso de tus estudiantes con métricas claras y útiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Comparación
            </div>
                         <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
               ProfeVision vs. Métodos tradicionales
             </h2>
          </div>
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Característica</th>
                    <th className="p-4 text-center font-semibold text-[#0b890f]">ProfeVision</th>
                    <th className="p-4 text-center font-semibold text-muted-foreground">Métodos tradicionales</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Creación de exámenes con IA</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Subida de exámenes en PDF</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Calificación automática (OMR)</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí, con escaneo desde el celular</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No, manual</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Organización por institución/materia</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí, todo centralizado</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">Limitada, dispersa</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Dashboard de métricas y reportes</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí, en tiempo real</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No, requiere trabajo manual</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Reducción de errores humanos</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Acceso desde cualquier dispositivo</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                        <span className="text-[#0b890f] font-medium">Sí</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">No siempre</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Ahorro de tiempo</td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className="bg-[#0b890f]/10 text-[#0b890f] border-[#0b890f]/20">
                        Máximo
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-200">
                        Mínimo
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/5 to-[#ffd60a]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              La Mejor Elección
            </div>
                         <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
               ¿Por qué elegir ProfeVision?
             </h2>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ProfeVision es la herramienta ideal para profesores y escuelas que quieren modernizar 
              la <strong>evaluación escolar digital</strong>. Nuestra plataforma es fácil de usar, rápida y confiable. 
              Olvídate de procesos manuales y lleva tus exámenes al siguiente nivel con inteligencia 
              artificial y tecnología de escaneo.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
              Preguntas Frecuentes
            </div>
                         <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
               Preguntas frecuentes (FAQ)
             </h2>
          </div>
          
                     <div className="mt-12 max-w-3xl mx-auto">
             <Accordion type="single" collapsible className="w-full space-y-4">
               <AccordionItem value="item-1" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                 <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                   ¿Puedo usar ProfeVision en cualquier tipo de escuela?
                 </AccordionTrigger>
                 <AccordionContent className="px-6 pb-4">
                   <p className="text-popover opacity-80">
                     Sí, la plataforma se adapta a escuelas, academias y centros de formación de cualquier tamaño.
                   </p>
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-2" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                 <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                   ¿La calificación automática es confiable?
                 </AccordionTrigger>
                 <AccordionContent className="px-6 pb-4">
                   <p className="text-popover opacity-80">
                     Sí, nuestra tecnología de Visión Artificial (OMR) garantiza resultados rápidos y precisos.
                   </p>
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-3" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                 <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                   ¿Puedo subir exámenes en PDF?
                 </AccordionTrigger>
                 <AccordionContent className="px-6 pb-4">
                   <p className="text-popover opacity-80">
                     Por supuesto. Solo súbelos a la plataforma y comienza a calificar.
                   </p>
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-4" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                 <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                   ¿Necesito equipo especial para escanear las hojas de respuesta?
                 </AccordionTrigger>
                 <AccordionContent className="px-6 pb-4">
                   <p className="text-popover opacity-80">
                     No, solo necesitas tu celular con la app de ProfeVision.
                   </p>
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-5" className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                 <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                   ¿La plataforma es segura?
                 </AccordionTrigger>
                 <AccordionContent className="px-6 pb-4">
                   <p className="text-popover opacity-80">
                     Sí, protegemos toda tu información con los más altos estándares de seguridad.
                   </p>
                 </AccordionContent>
               </AccordionItem>
             </Accordion>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              ProfeVision es la herramienta ideal para modernizar la evaluación escolar digital
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Únete a miles de profesores y escuelas que ya están transformando sus procesos de evaluación con tecnología avanzada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href="/auth/register">Prueba ProfeVision gratis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              >
                <Link href="/pricing">Ver Precios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}