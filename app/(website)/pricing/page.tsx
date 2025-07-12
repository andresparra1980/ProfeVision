import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Zap } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Badge className="bg-[#0b890f] text-white hover:bg-[#0b890f]/80">
              <Zap className="h-3 w-3 mr-1" />
              Lanzamiento Especial
            </Badge>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              ¡Gratis Durante el <span className="text-[#0b890f]">Lanzamiento</span>!
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Aprovecha el acceso gratuito a ProfeVisión mientras estamos en fase de lanzamiento. 
              Todas las funciones disponibles sin costo.
            </p>
          </div>
        </div>
      </section>

      {/* Oferta de Lanzamiento */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#0b890f]/10 to-[#0b890f]/5 p-8 rounded-lg border border-[#0b890f]/20 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Plan de Lanzamiento
              </h2>
              <div className="text-6xl font-bold text-[#0b890f] mb-2">
                GRATIS
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Acceso completo durante la fase de lanzamiento
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Estudiantes ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Exámenes ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Generación con IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Calificación automática OMR</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Reportes avanzados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Gestión de instituciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Aplicación móvil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0b890f]" />
                    <span>Soporte prioritario</span>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
              >
                <Link href="/auth/register">¡Regístrate Gratis Ahora!</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Planes Futuros */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
              Planes Futuros
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Cuando finalice el período de lanzamiento, ofreceremos planes flexibles para 
              docentes e instituciones de todos los tamaños.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card p-6 rounded-lg border opacity-60">
              <h3 className="text-2xl font-semibold mb-4">Plan Básico</h3>
              <div className="text-2xl font-bold mb-4 text-muted-foreground">Próximamente</div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Hasta 500 estudiantes</li>
                <li>• Exámenes ilimitados</li>
                <li>• Reportes básicos</li>
                <li>• Soporte por email</li>
              </ul>
            </div>
            
            <div className="bg-card p-6 rounded-lg border opacity-60">
              <h3 className="text-2xl font-semibold mb-4">Plan Institucional</h3>
              <div className="text-2xl font-bold mb-4 text-muted-foreground">Próximamente</div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Estudiantes ilimitados</li>
                <li>• Múltiples instituciones</li>
                <li>• Reportes avanzados</li>
                <li>• Soporte dedicado</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-white">
              ¿Listo para Revolucionar tus Evaluaciones?
            </h2>
            <p className="max-w-[600px] text-white/90 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Únete ahora y obtén acceso gratuito a todas las funciones de ProfeVisión 
              durante nuestro período de lanzamiento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-[#0b890f] hover:bg-white/90"
              >
                <Link href="/auth/register">Comenzar Gratis</Link>
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