"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

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

// Componente que utiliza useSearchParams pero envuelto en un Client Component específico
function NavigationEventsListener({ onNavigationChange }: { 
  onNavigationChange: (isNavigating: boolean, timestamp: number) => void 
}) {
  // Usar usePathname que no requiere suspense boundary
  const pathname = usePathname();
  
  // Efecto para detectar cambios de ruta usando solo pathname
  useEffect(() => {
    // Cuando el pathname cambia, actualizar el estado
    onNavigationChange(true, Date.now());

    // Simular un "after navigation complete"
    const timeout = setTimeout(() => {
      onNavigationChange(false, Date.now());
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname, onNavigationChange]);

  // Este componente no renderiza nada
  return null;
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

  // Manejador para los cambios de navegación desde el listener
  const handleNavigationChange = React.useCallback((_isNavigating: boolean, _timestamp: number) => {
    setNavigationState(prev => ({
      ...prev,
      isNavigating: _isNavigating,
      routeChanging: _isNavigating,
      lastNavigationTime: _timestamp
    }));
  }, []);

  return (
    <NavigationEventsContext.Provider value={{ navigationState, resetCache }}>
      <NavigationEventsListener onNavigationChange={handleNavigationChange} />
      {children}
    </NavigationEventsContext.Provider>
  );
} 