"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="ProfeVisión - Inicio | Aplicación para escanear y calificar exámenes">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
              <span className="font-bold text-white">PV</span>
            </div>
            <span className="font-bold text-xl text-secondary dark:text-white">ProfeVision</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
                        <Link href="/#caracteristicas" className="text-sm font-medium hover:text-[#0b890f] transition-colors" title="Características de ProfeVisión - Funcionalidades de la aplicación">
            Características
          </Link>
          <Link href="/#modulos" className="text-sm font-medium hover:text-[#0b890f] transition-colors" title="Módulos de ProfeVisión - Gestión educativa completa">
            Módulos
          </Link>
          <Link href="/#beneficios" className="text-sm font-medium hover:text-[#0b890f] transition-colors" title="Beneficios de ProfeVisión - Ahorra tiempo y mejora la educación">
            Beneficios
          </Link>
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
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b shadow-lg animate-in slide-in-from-top-5 duration-300 z-50">
            <div className="container py-4 flex flex-col gap-3">
              <Link 
                href="/#caracteristicas" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
                title="Características de ProfeVisión - Funcionalidades de la aplicación"
              >
                Características
              </Link>
              <Link 
                href="/#modulos" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
                title="Módulos de ProfeVisión - Gestión educativa completa"
              >
                Módulos
              </Link>
              <Link 
                href="/#beneficios" 
                className="text-base font-medium hover:text-[#0b890f] transition-colors py-2"
                onClick={closeMenu}
                title="Beneficios de ProfeVisión - Ahorra tiempo y mejora la educación"
              >
                Beneficios
              </Link>
              <div className="pt-2 flex flex-col gap-2 border-t">
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