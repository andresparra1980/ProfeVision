"use client"

import * as React from "react"
import { useTranslations, useLocale } from 'next-intl'
import { Link as IntlLink } from '@/i18n/navigation'
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
        <IntlLink
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          href={href as any || "#"}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          {children && (
            <p className="line-clamp-4 text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground transition-colors mt-1">
              {children}
            </p>
          )}
        </IntlLink>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

// Componente especializado para los sub-items de Exámenes
const ExamenSubItem = ({ href, title, icon: Icon, children }: ListItemProps) => {
  return (
    <li className="ml-2"> {/* Indentación más sutil */}
      <NavigationMenuLink asChild>
        <IntlLink
          className="block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group border-l-2 border-muted/50 pl-3"
          href={href as any || "#"}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3 w-3" />} {/* Íconos más pequeños para sub-items */}
            <div className="text-xs font-medium leading-none">{title}</div>
          </div>
          {children && (
            <p className="line-clamp-4 text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground transition-colors mt-1">
              {children}
            </p>
          )}
        </IntlLink>
      </NavigationMenuLink>
    </li>
  )
}

export function MainNavigation() {
  const t = useTranslations('common')
  const locale = useLocale()



  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Inicio */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <IntlLink href="/" className={navigationMenuTriggerStyle()}>
              {t('navigation.home')}
            </IntlLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Funciones */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="hover:text-[#0b890f]">
            {t('navigation.functions')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="p-4 w-[600px]">
              <div className="grid grid-cols-3 gap-6">
                {/* Columna 1 */}
                <ul className="space-y-2">
                  {/* Cómo funciona - Primer item clickeable */}
                  <ListItem 
                    href="/how-it-works" 
                    title={t('navigation.howItWorks')}
                    icon={BookOpen}
                  >
                    {t('navigation.howItWorksDescription')}
                  </ListItem>
                </ul>

                {/* Columna 2 - Exámenes (Central) */}
                <ul className="space-y-2">
                  {/* Exámenes - Categoría principal */}
                  <li className="mb-2">
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted/30">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('navigation.exams')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('navigation.examsDescription')}
                        </p>
                      </div>
                    </div>
                  </li>
                  
                  {/* Sub-items de Exámenes */}
                  <ExamenSubItem 
                    href="/exams-with-ai" 
                    title={t('navigation.aiGenerator')}
                    icon={Brain}
                  >
                    {t('navigation.aiGeneratorDescription')}
                  </ExamenSubItem>
                  <ExamenSubItem 
                    href="/paper-exams" 
                    title={t('navigation.paperExams')}
                    icon={ScanLine}
                  >
                    {t('navigation.paperExamsDescription')}
                  </ExamenSubItem>
                </ul>

                {/* Columna 3 */}
                <ul className="space-y-2">
                  <ListItem 
                    href="/mobile-app" 
                    title={t('navigation.mobileApp')}
                    icon={Smartphone}
                  >
                    {t('navigation.mobileAppDescription')}
                  </ListItem>
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Precios */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <IntlLink href="/pricing" className={navigationMenuTriggerStyle()}>
              {t('navigation.pricing')}
            </IntlLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Blog */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <IntlLink href="/blog" className={navigationMenuTriggerStyle()}>
              {t('navigation.blog')}
            </IntlLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Contacto */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <IntlLink href="/contact" className={navigationMenuTriggerStyle()}>
              {t('navigation.contact')}
            </IntlLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
} 