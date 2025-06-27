"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { FeatureSlideshow } from "@/components/shared/feature-slideshow"
import {
  BookOpen,
  ScanText,
  BarChart3,
  School,
  Users,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Menu,
  X
} from "lucide-react"
import Image from 'next/image'
import { useMemo, useState } from 'react'

export default function Home() {
  const avatarSeeds = useMemo(
    () => Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 10)),
    []
  )
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-bold text-white dark:text-background">PV</span>
            </div>
            <span className="font-bold text-xl text-secondary">ProfeVision</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#caracteristicas" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                Características
              </Link>
              <Link href="#modulos" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                Módulos
              </Link>
              <Link href="#beneficios" className="text-sm font-medium hover:text-[#0b890f] transition-colors">
                Beneficios
              </Link>
            </nav>
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" className="bg-accent text-black dark:text-black">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90">
                <Link href="/auth/register">Registrarse</Link>
              </Button>
            </div>
            <ModeToggle />
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-muted"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b shadow-lg animate-in slide-in-from-top-5 duration-300 z-50">
            <div className="container py-4 flex flex-col gap-3">
              <Link 
                href="#caracteristicas" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
              >
                Características
              </Link>
              <Link 
                href="#modulos" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
              >
                Módulos
              </Link>
              <Link 
                href="#beneficios" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
              >
                Beneficios
              </Link>
              <div className="pt-2 flex flex-col gap-2 border-t">
                <Button asChild variant="outline" size="sm" className="bg-accent text-black dark:text-black justify-center text-base" onClick={closeMenu}>
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90 text-base" onClick={closeMenu}>
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Empty spacer div to push content below fixed header */}
      <div className="h-16"></div>
      
      {/* Content wrapper - applying blur when menu is open */}
      <div 
        className={`flex-1 transition-all duration-200 ${isMenuOpen ? 'blur-xl' : ''}`} 
        onClick={isMenuOpen ? closeMenu : undefined}
        style={{ opacity: isMenuOpen ? 0.6 : 1 }}
      >
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5 -z-10" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit">
                  ¡Nuevo! Calificación con Visión Artificial (OMR)
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                La Mejor Aplicación <span className="text-[#0b890f]"> para Escanear y Calificar Exámenes en Papel</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                En ProfeVisión, entendemos los desafíos de la educación moderna. Hemos desarrollado la solución todo en uno que automatiza la creación, 
                calificación y gestión de exámenes con IA, liberando tu valioso tiempo para que te concentres en lo que realmente importa: enseñar y potenciar 
                el aprendizaje de tus estudiantes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                  >
                    <Link href="/auth/register">Comenzar Gratis!</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#caracteristicas">Conocer Más</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {avatarSeeds.map((seed) => (
                      <Image
                        key={seed}
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-background"
                        unoptimized
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Más de <span className="font-bold text-foreground">1,000+</span> profesores confían en nosotros
                  </p>
                </div>
              </div>
              <FeatureSlideshow />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-16 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                Características Principales
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Todo lo que necesitas en una sola plataforma
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                ProfeVision simplifica tu trabajo como educador con herramientas potentes e intuitivas
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BookOpen className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl font-bold">Creación de Exámenes</h3>
                <p className="text-center text-muted-foreground">
                  Genera exámenes personalizados con nuestra asistencia de IA. Múltiples formatos, preguntas de calidad y
                  plantillas reutilizables.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <Smartphone className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl font-bold">Calificación con IA</h3>
                <p className="text-center text-muted-foreground">
                  Califica exámenes en minutos con tecnología OMR (Optical Mark Recognition). Escanea y procesa hojas de
                  respuestas automáticamente con tu smartphone.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-gradient-to-br from-[#0b890f]/20 to-[#0b890f]/10 p-4">
                  <BarChart3 className="h-6 w-6 text-[#0b890f]" />
                </div>
                <h3 className="text-xl font-bold">Análisis de Resultados</h3>
                <p className="text-center text-muted-foreground">
                  Obtén insights valiosos sobre el desempeño de tus estudiantes. Identifica áreas de mejora y tendencias
                  con nuestros reportes detallados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffd60a]/5 to-[#0b890f]/5 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                Módulos Principales
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Gestión educativa completa</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Organiza todos los aspectos de tu entorno educativo en un solo lugar
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <School className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Gestión de Instituciones</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Crea y administra múltiples instituciones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Configura ajustes específicos por institución</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Analíticas por institución</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-entities"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BookOpen className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Gestión de Materias</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Crea y organiza materias por institución</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Añade descripciones y detalles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Estructura tu plan de estudios</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-subjects"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <Users className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Gestión de Grupos</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Crea y administra grupos de estudiantes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Define períodos académicos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Importación masiva de estudiantes</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-groups"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <FileSpreadsheet className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Esquema de Calificaciones</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Define esquemas detallados por grupo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Configura períodos y componentes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Asigna pesos porcentuales</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-groups#sistema-de-calificaciones"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <ScanText className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Gestión de Exámenes</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Crea exámenes con asistencia de IA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Genera hojas de respuesta con QR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Calificación automática con Visión Artificial (OMR)</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-exams"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#0b890f]/10 p-3">
                      <BarChart3 className="h-5 w-5 text-[#0b890f]" />
                    </div>
                    <h3 className="text-lg font-bold">Análisis y Resultados</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Estadísticas detalladas de exámenes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Reportes en Excel y PDF</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#0b890f] shrink-0 mt-0.5" />
                      <span className="text-sm">Vista detallada por estudiante</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <a
                      href="https://docs.profevision.com/dashboard-exams#ver-resultados-del-examen"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group-hover:text-[#0b890f] hover:bg-muted"
                    >
                      <span>Más información</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-16 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground w-fit">
                  Beneficios Clave
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ahorra tiempo y mejora la calidad educativa
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  ProfeVision te permite enfocarte en lo que realmente importa: la enseñanza y el aprendizaje de tus
                  estudiantes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Automatización Inteligente</h3>
                      <p className="text-sm text-muted-foreground">
                        Reduce el tiempo dedicado a tareas administrativas y de calificación.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Organización Centralizada</h3>
                      <p className="text-sm text-muted-foreground">
                        Toda la información educativa en un solo lugar, accesible cuando la necesites.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Insights Valiosos</h3>
                      <p className="text-sm text-muted-foreground">
                        Toma decisiones basadas en datos para mejorar el rendimiento académico.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Flexibilidad Total</h3>
                      <p className="text-sm text-muted-foreground">
                        Adapta la plataforma a tus necesidades específicas y flujo de trabajo.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-[#0b890f]/10 p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-[#0b890f]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Calificación en Minutos, No en Horas</h3>
                      <p className="text-sm text-muted-foreground">
                        La tecnología OMR (Optical Mark Recognition) convierte horas de calificación manual en minutos,
                        permitiéndote enfocarte en la enseñanza.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                  >
                    <Link href="/auth/register">Comenzar Gratis</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#contacto">Solicitar Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center lg:order-first">
                {/* <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/20 to-[#ffd60a]/20 rounded-2xl blur-xl -z-10" /> */}
                <div className="relative bg-card backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Tabulado de Notas</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Matemáticas - Grupo A</h4>
                        <span className="text-xs bg-[#0b890f]/10 text-[#0b890f] px-2 py-1 rounded-full">Período 2</span>
                      </div>
                      <div className="text-sm text-muted-foreground">25 estudiantes · Promedio: 4.2</div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Estudiante</th>
                            <th className="px-4 py-2 text-center font-medium">Examen 1</th>
                            <th className="px-4 py-2 text-center font-medium">Examen 2</th>
                            <th className="px-4 py-2 text-center font-medium">Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">Ana García</td>
                            <td className="px-4 py-2 text-center">4.8</td>
                            <td className="px-4 py-2 text-center">4.9</td>
                            <td className="px-4 py-2 text-center font-medium">4.9</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Carlos Pérez</td>
                            <td className="px-4 py-2 text-center">4.0</td>
                            <td className="px-4 py-2 text-center">4.2</td>
                            <td className="px-4 py-2 text-center font-medium">4.1</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">María López</td>
                            <td className="px-4 py-2 text-center">3.7</td>
                            <td className="px-4 py-2 text-center">4.0</td>
                            <td className="px-4 py-2 text-center font-medium">3.9</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <Button variant="outline" className="w-full">
                      Exportar Calificaciones
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contacto" className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 -z-10" />
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#ffd60a]/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#0b890f]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#0b890f] text-white hover:bg-[#0b890f]/80 w-fit">
                ¡Comienza Hoy!
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Transforma tu experiencia educativa con ProfeVision
              </h2>
              <p className="text-muted-foreground md:text-xl">
                Únete a miles de educadores que ya están optimizando su trabajo y mejorando los resultados de sus
                estudiantes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-[#0b890f] to-[#0b890f]/90 hover:from-[#0b890f]/90 hover:to-[#0b890f]"
                >
                  <Link href="/auth/register">Registrarse Gratis</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#contacto">Solicitar Demo</Link>
                </Button>
              </div>
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">1000+</div>
                  <p className="text-sm text-muted-foreground">Profesores Activos</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">50+</div>
                  <p className="text-sm text-muted-foreground">Instituciones</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">100K+</div>
                  <p className="text-sm text-muted-foreground">Exámenes Calificados</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold">98%</div>
                  <p className="text-sm text-muted-foreground">Satisfacción</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity w-fit">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0b890f] to-[#0b890f]/70 flex items-center justify-center">
                  <span className="font-bold text-white">PV</span>
                </div>
                <span className="font-bold text-xl">ProfeVision</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                La plataforma integral que simplifica la gestión educativa para profesores e instituciones.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4">Producto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Testimonios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Guías
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Carreras
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Licencias
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} ProfeVision. Todos los derechos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
                Términos de Servicio
              </Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
