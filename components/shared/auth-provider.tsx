"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { useKeepAliveSession } from '@/lib/hooks/useKeepAliveSession';
import { logger } from '@/lib/utils/logger';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/']; // Use /auth/login and /auth/signup

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize keep-alive hook
  useKeepAliveSession();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Check initial session with explicit typing for the result
    supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }, error: AuthError | null }) => {
      if (isMounted) {
        if (error) {
          logger.error("Error fetching initial session:", error.message);
          setIsLoading(false);
           // Handle case where getSession fails - potentially redirect to login
           if (!PUBLIC_PATHS.includes(pathname)) {
               router.push('/auth/login');
           }
           return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        const isPublicPath = PUBLIC_PATHS.includes(pathname);
        if (!currentSession && !isPublicPath) {
          logger.log('No initial session and not on public path, redirecting to login.');
          router.push('/auth/login');
        } else if (currentSession && isPublicPath && pathname !== '/') {
            logger.log('Initial session found on public path (not home), redirecting to dashboard.');
            setTimeout(() => router.push('/dashboard'), 0);
        }
      }
    });

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
      if (!isMounted) return;

      logger.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      const isPublicPath = PUBLIC_PATHS.includes(pathname);

      if (event === 'SIGNED_OUT' && !isPublicPath) {
        logger.log('User signed out, redirecting to login.');
        // Prevent redirect loops if already on login
        if (pathname !== '/auth/login') {
           router.push('/auth/login');
        }
      }

      if (event === 'SIGNED_IN' && isPublicPath && pathname !== '/') {
        logger.log(`User signed in on public path (${pathname}), attempting redirect to dashboard.`);
        setTimeout(() => {
          logger.log('Executing redirect inside setTimeout');
          router.push('/dashboard');
        }, 0);
        logger.log('setTimeout for redirect scheduled.');
      }

      // Handle potential token refresh failures (indicated by null session when not explicitly signing out)
      if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION' && event !== 'USER_UPDATED' && !isPublicPath) {
         logger.log('Session became null (potentially token refresh failure), redirecting to login.');
         if (pathname !== '/auth/login') {
            router.push('/auth/login');
         }
      }

    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  const value = useMemo(() => ({
    session,
    user,
    isLoading,
  }), [session, user, isLoading]);

  // Optionally, show a loading indicator while checking session
  // if (isLoading) {
  //   return <div>Loading authentication...</div>;
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 