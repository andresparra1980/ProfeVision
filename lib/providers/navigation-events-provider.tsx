"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Interfaz para el estado de navegación
interface NavigationState {
  isNavigating: boolean;
  routeChanging: boolean;
  lastNavigationTime: number;
  networkError: boolean;
  authError: boolean;
}

// Interfaz para el contexto
interface NavigationEventsContextType {
  navigationState: NavigationState;
  resetCache: () => void;
  checkConnection: () => Promise<boolean>;
  checkAuthentication: () => Promise<boolean>;
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
function NavigationEventsListener({ onNavigationChange, onError }: { 
  onNavigationChange: (_isNavigating: boolean, _timestamp: number) => void;
  onError: (_type: 'network' | 'auth') => void;
}) {
  // Usar usePathname que no requiere suspense boundary
  const pathname = usePathname();
  
  // Efecto para detectar cambios de ruta usando solo pathname
  useEffect(() => {
    // Cuando el pathname cambia, actualizar el estado
    onNavigationChange(true, Date.now());

    // Verificar conectividad
    const checkConnectivity = async () => {
      try {
        // Intentar hacer una petición ligera para verificar conectividad
        const response = await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            onError('auth');
          } else {
            onError('network');
          }
        }
      } catch (error) {
        console.error('Error de conectividad:', error);
        onError('network');
      }
    };

    checkConnectivity();

    // Simular un "after navigation complete"
    const timeout = setTimeout(() => {
      onNavigationChange(false, Date.now());
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname, onNavigationChange, onError]);

  // Este componente no renderiza nada
  return null;
}

interface NavigationEventsProviderProps {
  children: React.ReactNode;
}

export function NavigationEventsProvider({ children }: NavigationEventsProviderProps) {
  const router = useRouter();
  
  // Estado para la navegación
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    routeChanging: false, 
    lastNavigationTime: Date.now(),
    networkError: false,
    authError: false
  });

  // Función para verificar conexión
  const checkConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-store'
      });
      
      const isConnected = response.ok;
      
      setNavigationState(prev => ({
        ...prev,
        networkError: !isConnected
      }));
      
      return isConnected;
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      setNavigationState(prev => ({
        ...prev,
        networkError: true
      }));
      return false;
    }
  };

  // Función para verificar autenticación
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check', { 
        method: 'GET',
        cache: 'no-store'
      });
      
      const isAuthenticated = response.ok;
      
      setNavigationState(prev => ({
        ...prev,
        authError: !isAuthenticated
      }));
      
      // Si hay error de autenticación, redirigir al login
      if (!isAuthenticated) {
        router.push('/auth/login');
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  };

  // Función para resetear caché
  const resetCache = () => {
    // Forzar la recarga de datos a través de un cambio en el estado
    setNavigationState(prev => ({
      ...prev,
      lastNavigationTime: Date.now(),
      networkError: false,
      authError: false
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

  // Manejador de errores
  const handleError = React.useCallback((_type: 'network' | 'auth') => {
    setNavigationState(prev => ({
      ...prev,
      networkError: _type === 'network',
      authError: _type === 'auth'
    }));
    
    // Si es error de autenticación, redirigir al login después de un breve delay
    if (_type === 'auth') {
      setTimeout(() => {
        router.push('/auth/login');
      }, 1000);
    }
  }, [router]);

  // Verificar conexión periódicamente cuando está activo
  useEffect(() => {
    // Verificar al inicio
    checkConnection();
    
    // Establecer intervalo para verificar cada minuto
    const interval = setInterval(() => {
      // Solo verificar si no hay navegación activa
      if (!navigationState.isNavigating) {
        checkConnection();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [navigationState.isNavigating]);

  return (
    <NavigationEventsContext.Provider value={{ 
      navigationState, 
      resetCache, 
      checkConnection,
      checkAuthentication 
    }}>
      <NavigationEventsListener 
        onNavigationChange={handleNavigationChange} 
        onError={handleError}
      />
      {children}
    </NavigationEventsContext.Provider>
  );
} 