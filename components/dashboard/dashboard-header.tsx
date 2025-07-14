"use client";

import { Bell, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardHeader() {
  const { isCollapsed, isMobile } = useSidebar();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  // Cargar estado de la notificación desde localStorage
  useEffect(() => {
    const dismissedData = localStorage.getItem('mobile-grading-notification-dismissed');
    
    if (!dismissedData) {
      // Si no existe, mostrar la notificación
      setNotificationDismissed(false);
      return;
    }
    
    try {
      const dismissedTimestamp = parseInt(dismissedData);
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
      
      if (now - dismissedTimestamp > sevenDaysInMs) {
        // Han pasado más de 7 días, mostrar la notificación nuevamente
        setNotificationDismissed(false);
        // Limpiar el localStorage para empezar de nuevo
        localStorage.removeItem('mobile-grading-notification-dismissed');
      } else {
        // Aún no han pasado 7 días, mantener cerrada
        setNotificationDismissed(true);
      }
    } catch (_error) {
      // Si hay error al parsear, mostrar la notificación
      setNotificationDismissed(false);
      localStorage.removeItem('mobile-grading-notification-dismissed');
    }
  }, []);

  const handleNotificationToggle = () => {
    setShowNotification(!showNotification);
  };

  const handleDismissNotification = () => {
    setNotificationDismissed(true);
    setShowNotification(false);
    // Guardar timestamp actual para revisar en 7 días
    localStorage.setItem('mobile-grading-notification-dismissed', Date.now().toString());
  };

  return (
    <>
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
          <div className="relative">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={handleNotificationToggle}>
              <Bell className="h-5 w-5" />
              {!notificationDismissed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleNotificationToggle}>
              <Bell className="h-5 w-5" />
              {!notificationDismissed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Notificación flotante */}
      {(showNotification || (!notificationDismissed && !showNotification)) && !notificationDismissed && (
        <div className="fixed top-16 left-0 right-0 z-50 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Alert className="border bg-card shadow-lg">
              <Bell className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-foreground pr-8">
                <strong>Recordatorio:</strong> Para calificar exámenes en papel, accede a{" "}
                <a 
                  href="https://www.profevision.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  www.profevision.com
                </a>{" "}
                desde tu celular.
              </AlertDescription>
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="mini"
                  className="absolute right-1 top-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={handleDismissNotification}
                >
                  <X className="size-3" />
                  <span className="sr-only">Cerrar notificación</span>
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
} 