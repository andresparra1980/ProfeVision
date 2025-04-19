"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const resizeListenerRef = useRef<(() => void) | null>(null);
  
  // Detectar tamaño de pantalla
  useEffect(() => {
    // Asegurarse que el código solo se ejecute en el cliente
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768); // 768px es el punto de quiebre md en Tailwind
      };
      
      // Comprobar al inicio
      checkIsMobile();
      
      // Usar throttle para evitar demasiadas actualizaciones durante el redimensionamiento
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
      
      const handleResize = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
          checkIsMobile();
          resizeTimeout = null;
        }, 100);
      };
      
      // Almacenar la referencia del listener para limpieza
      resizeListenerRef.current = handleResize;
      
      // Actualizar al cambiar el tamaño de la ventana
      window.addEventListener('resize', handleResize);
      
      return () => {
        if (resizeListenerRef.current) {
          window.removeEventListener('resize', resizeListenerRef.current);
          resizeListenerRef.current = null;
        }
        
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
      };
    }
  }, []);

  // Cargar preferencia guardada al inicio
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('sidebar-collapsed');
        setIsCollapsed(savedState === 'true');
      } catch (error) {
        console.error('Error al acceder a localStorage:', error);
      }
    }
  }, []);
  
  // Asegurarse de que en móvil nunca esté contraído
  useEffect(() => {
    if (isMobile && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isMobile, isCollapsed]);

  const toggleCollapse = () => {
    // En móvil no permitir contraer
    if (isMobile) return;
    
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    // Guardar la preferencia envuelta en try-catch para evitar errores
    try {
      localStorage.setItem('sidebar-collapsed', String(newState));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
} 