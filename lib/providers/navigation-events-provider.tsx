"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Interfaz para el estado de navegación
interface NavigationState {
  isNavigating: boolean;
  routeChanging: boolean;
  lastNavigationTime: number;
}

// Interfaz para el contexto
interface NavigationEventsContextType {
  navigationState: NavigationState;
  resetCache: () => void;
}

// Crear el contexto
const NavigationEventsContext = createContext<NavigationEventsContextType | undefined>(undefined);

// Hook para usar el contexto
export function useNavigationEvents() {
  const context = useContext(NavigationEventsContext);
  if (!context) {
    throw new Error('useNavigationEvents must be used within a NavigationEventsProvider');
  }
  return context;
}

interface NavigationEventsProviderProps {
  children: React.ReactNode;
}

export function NavigationEventsProvider({ children }: NavigationEventsProviderProps) {
  // Estado para la navegación
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    routeChanging: false, 
    lastNavigationTime: Date.now()
  });

  // Obtener el pathname y searchParams para detectar cambios de ruta
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Función para resetear caché
  const resetCache = () => {
    // Forzar la recarga de datos a través de un cambio en el estado
    setNavigationState(prev => ({
      ...prev,
      lastNavigationTime: Date.now()
    }));
    
    // También podríamos agregar mecanismos adicionales para limpiar caché
    console.log('Caché de navegación reseteada:', new Date().toISOString());
  };

  // Efecto para detectar cambios de ruta
  useEffect(() => {
    // Cuando el pathname o los searchParams cambian, actualizar el estado
    setNavigationState(prev => ({
      ...prev,
      isNavigating: true,
      routeChanging: true,
      lastNavigationTime: Date.now()
    }));

    // Simular un "after navigation complete"
    const timeout = setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        routeChanging: false
      }));
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return (
    <NavigationEventsContext.Provider value={{ navigationState, resetCache }}>
      {children}
    </NavigationEventsContext.Provider>
  );
} 