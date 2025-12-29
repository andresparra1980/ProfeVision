"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabase/client";
import type {
  Session,
  User,
  AuthChangeEvent,
  AuthError,
} from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { getLocalizedRoute } from "@/i18n/route-constants";

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

  // 🌍 Generar rutas localizadas dinámicamente (alineado con middleware)
  // Con localePrefix: 'always', SIEMPRE se antepone el prefijo del locale
  const getLocalizedRoutes = useMemo(() => {
    const base = `/${locale}`;
    const loginPaths: Record<string, string> = {
      es: "iniciar-sesion",
      en: "login",
      fr: "connexion",
      pt: "entrar",
    };
    return {
      login: `${base}/auth/${loginPaths[locale] || "login"}`,
      dashboard: `${base}/dashboard`,
    };
  }, [locale]);

  // 🔐 Rutas públicas localizadas - Lista completa actualizada (sincronizada con middleware)
  const getPublicPaths = useMemo(() => {
    // Usar mapeo de rutas compartido desde route-constants.ts
    const getRoute = (key: string) => getLocalizedRoute(key, locale);

    return [
      // Rutas con prefijo de locale
      `/${locale}`,
      `/${locale}/`,

      // Páginas de contenido estático
      `/${locale}/${getRoute("privacy")}`,
      `/${locale}/${getRoute("terms")}`,
      `/${locale}/${getRoute("cookies")}`,
      `/${locale}/${getRoute("dataDeletion")}`,

      // Páginas de información
      `/${locale}/${getRoute("howItWorks")}`,
      `/${locale}/${getRoute("pricing")}`,
      `/${locale}/${getRoute("contact")}`,
      `/${locale}/${getRoute("blog")}`,

      // Páginas de exámenes
      `/${locale}/${getRoute("examsWithAI")}`,
      `/${locale}/${getRoute("paperExams")}`,

      // Páginas de gestión (información pública)
      `/${locale}/${getRoute("institutions")}`,
      `/${locale}/${getRoute("subjects")}`,
      `/${locale}/${getRoute("groups")}`,
      `/${locale}/${getRoute("students")}`,
      `/${locale}/${getRoute("reports")}`,
      `/${locale}/${getRoute("mobileApp")}`,

      // Páginas de autenticación
      `/${locale}/auth/${getRoute("login")}`,
      `/${locale}/auth/${getRoute("register")}`,
      `/${locale}/auth/${getRoute("resetPassword")}`,
      `/${locale}/auth/${getRoute("updatePassword")}`,
      `/${locale}/auth/${getRoute("verifyEmail")}`,
      `/${locale}/auth/${getRoute("emailConfirmed")}`,
    ];
  }, [locale]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 🔐 Verificar sesión inicial (lógica preservada)
    supabase.auth
      .getSession()
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null };
          error: AuthError | null;
        }) => {
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
              logger.log(
                "No initial session and not on public path, redirecting to login.",
              );
              router.push(routes.login);
            }
            // Permitir que usuarios autenticados naveguen libremente por páginas públicas
          }
        },
      );

    // 🔐 Listener de cambios de autenticación (lógica preservada)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        logger.log(`Supabase auth event: ${event}`);

        if (event === "TOKEN_REFRESHED") {
          logger.log("Auth state changed: TOKEN_REFRESHED", {
            hasSession: !!newSession,
          });
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        const routes = getLocalizedRoutes;
        const publicPaths = getPublicPaths;
        const isPublicPath = publicPaths.includes(pathname);

        if (event === "SIGNED_OUT" && !isPublicPath) {
          logger.log("User signed out, redirecting to login.");
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }

        if (
          !newSession &&
          event !== "SIGNED_OUT" &&
          event !== "INITIAL_SESSION" &&
          event !== "USER_UPDATED" &&
          !isPublicPath
        ) {
          logger.log(
            "Session became null (potentially token refresh failure), redirecting to login.",
          );
          if (pathname !== routes.login) {
            router.push(routes.login);
          }
        }
      },
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname, locale, getLocalizedRoutes, getPublicPaths]);

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
    }),
    [session, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
