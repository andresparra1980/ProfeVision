"use client";

import { Bell } from "lucide-react";
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
        ProfeVision
      </span>
      
      {/* Logo para desktop - visible y centrado solo cuando el sidebar está contraído */}
      {isCollapsed && !isMobile && (
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <span className="text-xl font-bold text-secondary">
            ProfeVision
          </span>
        </div>
      )}
      
      {/* Contenedor derecho para íconos */}
      <div className="ml-auto flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
} 