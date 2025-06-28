import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-2 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity justify-center md:justify-start w-fit mx-auto md:mx-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc152b] to-[#ea4359]/70 flex items-center justify-center">
                <span className="font-bold text-white">PV</span>
              </div>
              <span className="font-bold text-secondary dark:text-white text-xl">ProfeVision</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto md:mx-0">
              La plataforma integral que simplifica la gestión educativa para profesores e instituciones.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
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
          <div className="grid grid-cols-3 gap-4 md:gap-6 col-span-1 md:col-span-2 lg:col-span-3">
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">Producto</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="/#caracteristicas" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Testimonios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Guías
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">Empresa</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Contacto
                  </Link>
                </li>
                {/* <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Carreras
                  </Link>
                </li> */}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 md:mb-4 text-sm md:text-base">Legal</h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link href="/terms" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Cookies
                  </Link>
                </li>
                {/* <li>
                  <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                    Licencias
                  </Link>
                </li> */}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 md:mt-12 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ProfeVision. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-foreground">
              Cookies
            </Link>
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
  )
} 