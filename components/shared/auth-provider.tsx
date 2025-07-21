"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import type { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // 🌍 Generar rutas localizadas dinámicamente
  const getLocalizedRoutes = useMemo(() => ({
    login: `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    dashboard: `/${locale}/${locale === 'es' ? 'panel' : 'dashboard'}`,
  }), [locale]);

  // 🔐 Rutas públicas localizadas - Lista completa actualizada (sincronizada con middleware)
  const getPublicPaths = useMemo(() => [
    // Rutas con prefijo de locale
    `/${locale}`,
    `/${locale}/`,
    
    // Páginas de contenido estático
    `/${locale}/${locale === 'es' ? 'privacidad' : 'privacy'}`,
    `/${locale}/${locale === 'es' ? 'terminos' : 'terms'}`,
    `/${locale}/${locale === 'es' ? 'cookies' : 'cookies'}`,
    
    // Páginas de información
    `/${locale}/${locale === 'es' ? 'como-funciona' : 'how-it-works'}`,
    `/${locale}/${locale === 'es' ? 'precios' : 'pricing'}`,
    `/${locale}/${locale === 'es' ? 'contacto' : 'contact'}`,
    `/${locale}/${locale === 'es' ? 'blog' : 'blog'}`,
    
    // Páginas de exámenes
    `/${locale}/${locale === 'es' ? 'examenes-con-ia' : 'exams-with-ai'}`,
    `/${locale}/${locale === 'es' ? 'examenes-papel' : 'paper-exams'}`,
    
    // Páginas de gestión (información pública)
    `/${locale}/${locale === 'es' ? 'gestion-instituciones' : 'institutions-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-materias' : 'subjects-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-grupos' : 'groups-management'}`,
    `/${locale}/${locale === 'es' ? 'gestion-estudiantes' : 'students-management'}`,
    `/${locale}/${locale === 'es' ? 'reportes' : 'reports'}`,
    `/${locale}/${locale === 'es' ? 'aplicacion-movil' : 'mobile-app'}`,
    
    // Páginas de autenticación
    `/${locale}/auth/${locale === 'es' ? 'iniciar-sesion' : 'login'}`,
    `/${locale}/auth/${locale === 'es' ? 'registro' : 'register'}`,
    `/${locale}/auth/${locale === 'es' ? 'restablecer-contrasena' : 'reset-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'actualizar-contrasena' : 'update-password'}`,
    `/${locale}/auth/${locale === 'es' ? 'verificar-email' : 'verify-email'}`,
    `/${locale}/auth/${locale === 'es' ? 'email-confirmado' : 'email-confirmed'}`,
    
    // Rutas sin prefijo de idioma solo para el locale por defecto (español)
    ...(locale === 'es' ? [
      '/',
      '/privacidad',
      '/terminos',
      '/cookies',
      '/como-funciona',
      '/gestion-instituciones',
      '/gestion-materias',
      '/gestion-grupos',
      '/gestion-estudiantes',
      '/reportes',
      '/aplicacion-movil',
      '/precios',
      '/contacto',
      '/blog',
      '/examenes',
      '/examenes/generador-manual',
      '/examenes/generador-ia',
      '/examenes-con-ia',
      '/examenes-papel',
      '/auth/iniciar-sesion',
      '/auth/registro',
      '/auth/restablecer-contrasena',
      '/auth/actualizar-contrasena',
      '/auth/verificar-email',
      '/auth/email-confirmado'
    ] : [])
  ], [locale]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 🔐 Verificar sesión inicial (lógica preservada)
    supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }, error: AuthError | null }) => {
      if (isMounted) {
        if (error) {
          logger.error("Error fetching initial session:", error.message);
          setIsLoading(false);
          const routes = getLocalizedRoutes;
          const publicPaths = getPublicPaths;
          
          if (!publicPaths.includes(pathname)) {
            router.push(routes.login);
          }
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        const routes = getLocalizedRoutes;
        const publicPaths = getPublicPaths;
        const isPublicPath = publicPaths.includes(pathname);
        
        if (!currentSession && !isPublicPath) {
          logger.log('No initial session and not on public path, redirecting to login.');
          router.push(routes.login);
        }
        // Permitir que usuarios autenticados naveguen libremente por páginas públicas
      }
    });

    // 🔐 Listener de cambios de autenticación (lógica preservada)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        logger.log(`Supabase auth event: ${event}`);

        if (event === 'TOKEN_REFRESHED') {
          logger.log('Auth state changed: TOKEN_REFRESHED', { hasSession: !!newSession });
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        const routes = getLocalizedRoutes;
        const publicPaths = getPublicPaths;
        const isPublicPath = publicPaths.includes(pathname);

        if (event === 'SIGNED_OUT' && !isPublicPath) {
          logger.log('User signed out, redirecting to login.');
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }

        if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION' && event !== 'USER_UPDATED' && !isPublicPath) {
          logger.log('Session became null (potentially token refresh failure), redirecting to login.');
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname, locale, getLocalizedRoutes, getPublicPaths]);

  const value = useMemo(() => ({
    session,
    user,
    isLoading,
  }), [session, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 