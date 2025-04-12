"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar tamaño de pantalla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768); // 768px es el punto de quiebre md en Tailwind
      };
      
      // Comprobar al inicio
      checkIsMobile();
      
      // Actualizar al cambiar el tamaño de la ventana
      window.addEventListener('resize', checkIsMobile);
      
      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }
  }, []);

  // Cargar preferencia guardada al inicio
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed');
      setIsCollapsed(savedState === 'true');
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
    localStorage.setItem('sidebar-collapsed', String(newState));
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