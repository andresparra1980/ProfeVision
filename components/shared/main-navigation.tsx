import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { 
  BookOpen, 
  FileText, 
  Brain, 
  ScanLine,
  Smartphone
} from "lucide-react"

interface ListItemProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  className?: string
  children?: React.ReactNode
}

const ListItem = React.forwardRef<
  HTMLAnchorElement,
  ListItemProps
>(({ className, title, children, icon: Icon, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          href={href || "#"}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3 w-3" />}
            <div className="text-xs font-medium leading-none">{title}</div>
          </div>
          {children && (
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground transition-colors">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

// Componente especializado para los sub-items de Exámenes
const ExamenSubItem = ({ href, title, icon: Icon, children }: ListItemProps) => {
  return (
    <li className="ml-4"> {/* Indentación reducida */}
      <NavigationMenuLink asChild>
        <Link
          className="block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group border-l-2 border-muted pl-3"
          href={href || "#"}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3 w-3" />} {/* Íconos más pequeños para sub-items */}
            <div className="text-xs font-medium leading-none">{title}</div>
          </div>
          {children && (
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground transition-colors">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export function MainNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Inicio */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/" className={navigationMenuTriggerStyle()}>
              Inicio
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Funciones */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="hover:text-[#0b890f]">
            Funciones
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="p-3 md:w-[600px] lg:w-[700px]">
              <div className="grid grid-cols-3 gap-4">
                {/* Columna 1 */}
                <ul className="space-y-1">
                  {/* Cómo funciona - Primer item clickeable */}
                  <ListItem 
                    href="/how-it-works" 
                    title="¿Cómo Funciona ProfeVision?"
                    icon={BookOpen}
                  >
                    Descubre cómo transformar tu forma de crear, administrar y calificar exámenes
                  </ListItem>
                  
                  {/* <ListItem 
                    href="/institutions-management" 
                    title="Gestión de Instituciones"
                    icon={Building}
                  >
                    Administra múltiples instituciones educativas
                  </ListItem>
                  <ListItem 
                    href="/subjects-management" 
                    title="Gestión de Materias"
                    icon={BookOpen}
                  >
                    Organiza y gestiona todas tus materias
                  </ListItem>
                  <ListItem 
                    href="/groups-management" 
                    title="Gestión de Grupos"
                    icon={Users}
                  >
                    Administra grupos y estudiantes eficientemente
                  </ListItem> */}
                </ul>

                {/* Columna 2 - Exámenes (Central) */}
                <ul className="space-y-1">
                  {/* Exámenes - Categoría principal */}
                  <li className="mb-1">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <FileText className="h-3 w-3" />
                      <div>
                        <div className="text-xs font-medium">Exámenes</div>
                        <p className="text-xs text-muted-foreground">
                          Crea y administra exámenes de múltiples formas
                        </p>
                      </div>
                    </div>
                  </li>
                  
                  {/* Sub-items de Exámenes */}
                  <ExamenSubItem 
                    href="/exams" 
                    title="Generador Manual"
                    icon={FileText}
                  >
                    Crea exámenes paso a paso de forma manual
                  </ExamenSubItem>
                  <ExamenSubItem 
                    href="/exams" 
                    title="Generador con IA"
                    icon={Brain}
                  >
                    Genera exámenes automáticamente con inteligencia artificial
                  </ExamenSubItem>
                  <ExamenSubItem 
                    href="/paper-exams" 
                    title="Exámenes en Papel"
                    icon={ScanLine}
                  >
                    Escanea y califica exámenes físicos automáticamente
                  </ExamenSubItem>
                </ul>

                {/* Columna 3 */}
                <ul className="space-y-1">
                  {/* <ListItem 
                    href="/students-management" 
                    title="Gestión de Estudiantes"
                    icon={GraduationCap}
                  >
                    Control completo de información estudiantil
                  </ListItem>
                  <ListItem 
                    href="/reports" 
                    title="Gestión de Reportes"
                    icon={BarChart3}
                  >
                    Análisis detallado del desempeño estudiantil
                  </ListItem> */}
                  <ListItem 
                    href="/mobile-app" 
                    title="Aplicación Móvil"
                    icon={Smartphone}
                  >
                    En desarrollo - Próximamente disponible
                  </ListItem>
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Precios */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/pricing" className={navigationMenuTriggerStyle()}>
              Precios
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Blog */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/blog" className={navigationMenuTriggerStyle()}>
              Blog
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Contacto */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/contact" className={navigationMenuTriggerStyle()}>
              Contacto
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
} 