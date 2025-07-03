"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { MainNavigation } from "@/components/shared/main-navigation"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { 
  BookOpen, 
  Building, 
  Users, 
  GraduationCap, 
  FileText, 
  Brain, 
  ScanLine,
  BarChart3,
  Smartphone
} from "lucide-react"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFuncionesOpen, setIsFuncionesOpen] = useState(false)
  const [isExamenesOpen, setIsExamenesOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsFuncionesOpen(false)
    setIsExamenesOpen(false)
  }
  
  const toggleFunciones = () => setIsFuncionesOpen(!isFuncionesOpen)
  const toggleExamenes = () => setIsExamenesOpen(!isExamenesOpen)

  // Componente para items del menú móvil
  const MobileMenuItem = ({ 
    href, 
    title, 
    icon: Icon, 
    onClick,
    isSubItem = false,
    isSubSubItem = false 
  }: {
    href?: string
    title: string
    icon?: React.ComponentType<{ className?: string }>
    onClick?: () => void
    isSubItem?: boolean
    isSubSubItem?: boolean
  }) => {
    const baseClasses = "flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors"
    const subItemClasses = isSubItem ? "ml-4 text-sm py-2" : ""
    const subSubItemClasses = isSubSubItem ? "ml-8 text-xs py-2 border-l-2 border-muted pl-3" : ""
    
    const content = (
      <>
        {Icon && <Icon className={`${isSubSubItem ? 'h-3 w-3' : isSubItem ? 'h-4 w-4' : 'h-5 w-5'}`} />}
        <span className="flex-1">{title}</span>
      </>
    )

    if (href) {
      return (
        <Link 
          href={href} 
          className={`${baseClasses} ${subItemClasses} ${subSubItemClasses}`}
          onClick={closeMenu}
        >
          {content}
        </Link>
      )
    }

    return (
      <button 
        className={`${baseClasses} ${subItemClasses} ${subSubItemClasses} w-full text-left`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <>
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="ProfeVisión - Inicio | Aplicación para escanear y calificar exámenes">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
              <span className="font-bold text-white">PV</span>
            </div>
            <span className="font-bold text-xl text-secondary dark:text-white">ProfeVision</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 relative overflow-visible">
              <MainNavigation />
            </nav>
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" className="bg-accent text-black dark:text-black">
                <Link href="/auth/login" title="Iniciar sesión en ProfeVisión - Acceder a tu cuenta">Iniciar Sesión</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90">
                <Link href="/auth/register" title="Registrarse en ProfeVisión - Crear cuenta gratuita">Registrarse</Link>
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
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b shadow-lg animate-in slide-in-from-top-5 duration-300 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="container py-4">
              {/* Inicio */}
              <MobileMenuItem href="/" title="Inicio" />
              
              {/* Funciones - Dropdown */}
              <div>
                <div className="flex items-center gap-3 py-3 px-4 text-base font-medium hover:text-[#0b890f] transition-colors">
                  <button 
                    className="flex items-center gap-3 w-full text-left"
                    onClick={toggleFunciones}
                  >
                    <span className="flex-1">Funciones</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFuncionesOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {isFuncionesOpen && (
                  <div className="bg-muted/30 py-2">
                    <MobileMenuItem 
                      href="/how-it-works" 
                      title="¿Cómo Funciona ProfeVision?" 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href="/institutions-management" 
                      title="Gestión de Instituciones" 
                      icon={Building}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href="/subjects-management" 
                      title="Gestión de Materias" 
                      icon={BookOpen}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href="/groups-management" 
                      title="Gestión de Grupos" 
                      icon={Users}
                      isSubItem
                    />
                    
                    {/* Exámenes - Sub-dropdown */}
                    <div className="ml-4">
                      <div className="flex items-center gap-3 py-2 px-4 text-sm font-medium hover:text-[#0b890f] transition-colors">
                        <button 
                          className="flex items-center gap-3 w-full text-left"
                          onClick={toggleExamenes}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="flex-1">Exámenes</span>
                          <ChevronRight className={`h-3 w-3 transition-transform ${isExamenesOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                      
                      {isExamenesOpen && (
                        <div className="bg-muted/50 py-1">
                          <MobileMenuItem 
                            href="/exams" 
                            title="Generador Manual" 
                            icon={FileText}
                            isSubSubItem
                          />
                          <MobileMenuItem 
                            href="/exams" 
                            title="Generador con IA" 
                            icon={Brain}
                            isSubSubItem
                          />
                          <MobileMenuItem 
                            href="/exams" 
                            title="Exámenes en Papel" 
                            icon={ScanLine}
                            isSubSubItem
                          />
                        </div>
                      )}
                    </div>
                    
                    <MobileMenuItem 
                      href="/students-management" 
                      title="Gestión de Estudiantes" 
                      icon={GraduationCap}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href="/reports" 
                      title="Gestión de Reportes" 
                      icon={BarChart3}
                      isSubItem
                    />
                    <MobileMenuItem 
                      href="/mobile-app" 
                      title="Aplicación Móvil" 
                      icon={Smartphone}
                      isSubItem
                    />
                  </div>
                )}
              </div>
              
              {/* Precios */}
              <MobileMenuItem href="/pricing" title="Precios" />
              
              {/* Blog */}
              <MobileMenuItem href="/blog" title="Blog" />
              
              {/* Contacto */}
              <MobileMenuItem href="/contact" title="Contacto" />
              
              {/* Botones de autenticación */}
              <div className="pt-4 mt-4 flex flex-col gap-3 border-t">
                <Button asChild variant="outline" size="sm" className="bg-accent text-black dark:text-black justify-center text-base">
                  <Link href="/auth/login" onClick={closeMenu} title="Iniciar sesión en ProfeVisión">Iniciar Sesión</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#0b890f] hover:bg-[#0b890f]/90 text-base">
                  <Link href="/auth/register" onClick={closeMenu} title="Registrarse gratis en ProfeVisión">Registrarse</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
} 