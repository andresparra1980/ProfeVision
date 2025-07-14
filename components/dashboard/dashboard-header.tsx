"use client";

import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import { cn } from "@/lib/utils";

export default function DashboardHeader() {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <header className={cn(
      "flex h-16 items-center bg-card px-6 relative",
      isCollapsed && !isMobile ? "pl-4" : "pl-6" // Menos padding izquierdo cuando el sidebar está colapsado en desktop
    )}>
      {/* Logo para móviles - siempre en el centro */}
      <span className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-secondary md:hidden">
          <div className="relative">
            <span className="font-bold text-xl text-secondary dark:text-secondary">ProfeVision</span>
            <div className="absolute  -right-1 text-[8px] text-black dark:text-white font-bold px-1 py-0.5 rounded-full leading-none">
              Beta
            </div>
          </div>
      </span>
      
      {/* Logo para desktop - visible y centrado solo cuando el sidebar está contraído */}
      {isCollapsed && !isMobile && (
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <span className="font-bold text-xl text-secondary dark:text-secondary">ProfeVision</span>
            <div className="absolute  -right-1 text-[8px] dark:text-white font-bold px-1 py-0.5 rounded-full leading-none">
              Beta
            </div>
          </div>
        </div>
      )}
      
      {/* Contenedor derecho para íconos */}
      <div className="ml-auto flex items-center space-x-2">
        <a href="https://docs.profevision.com" target="_blank" rel="noopener noreferrer" className="hidden md:block">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Documentación</span>
          </Button>
        </a>
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
} 