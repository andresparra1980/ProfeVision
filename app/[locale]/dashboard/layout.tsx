"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { ScanExamFeature } from "@/components/exam/scan-exam-feature";
import { toast } from "sonner";
import type { User, Session } from '@supabase/supabase-js';
import { SidebarProvider } from "@/lib/contexts/sidebar-context";
import { OnboardingProvider } from "@/lib/contexts/onboarding-context";
import logger from "@/lib/utils/logger";
import { useTranslations, useLocale } from 'next-intl';
import { useWelcomeModal } from "@/lib/hooks/useWelcomeModal";
import { WelcomeTierModal } from "@/components/shared/welcome-tier-modal";

// Helper function to delete cookies by name prefix
function deleteSupabaseCookies() {
  const cookies = document.cookie.split(";");
  logger.log('[DashboardLayout] Attempting to clear Supabase cookies...');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    // Target cookies starting with sb- (common Supabase pattern)
    if (name.startsWith('sb-')) {
      logger.log(`[DashboardLayout] Deleting cookie: ${name}`);
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  }
  logger.log('[DashboardLayout] Cookie clearing attempt finished.');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dashboard');
  const tTiers = useTranslations('tiers');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { showWelcome, setShowWelcome } = useWelcomeModal();

  // Pages that should use full width (not constrained to 1024px)
  const isFullWidthPage = pathname?.includes('/grades');

  const handleLogout = async () => {
    let signOutError: Error | null = null;
    try {
      setIsLoggingOut(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      logger.log('[DashboardLayout] Session state before logout:', { session: sessionData.session, error: sessionError });

      // Attempt sign out, but don't let it block the redirect if it fails
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        signOutError = error; // Store error to log it
        // Optionally: Check if it's the specific 403 and decide if user needs a toast
        // For now, we'll just log it and proceed to redirect.
      }
      
    } catch (error: unknown) {
      // Catch errors from getSession or unexpected signOut issues
      signOutError = error instanceof Error ? error : new Error(String(error));
    } finally {
      if (signOutError) {
        logger.error('[DashboardLayout] Error during signOut attempt:', signOutError);
        // Decide if you want to toast here even if redirecting
        // toast({ variant: "destructive", title: "Error al cerrar sesión", ... }); 
      } else {
        // Only toast success if signOut didn't error
        toast.success(t('user.logoutSuccessTitle', { defaultValue: locale === 'en' ? 'Signed out' : 'Sesión cerrada' }), { 
          description: t('user.logoutSuccessDescription', { defaultValue: locale === 'en' ? 'You have been signed out successfully.' : 'Has cerrado sesión correctamente.' }) 
        });
      }
      
      // Manually clear Supabase cookies before redirecting
      deleteSupabaseCookies();
      
      // Always redirect to clear client state
      logger.log('[DashboardLayout] Redirecting to login after logout attempt.');
      router.push({ pathname: '/auth/login' });
      
      // It might take a moment for redirect, ensure isLoggingOut is reset eventually
      // Setting it false here might be too soon if redirect hangs, but often okay.
      setIsLoggingOut(false); 
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        router.push("/auth/login");
        return;
      }
      
      setUser(data.session.user);
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        logger.log('%%% DASHBOARD LAYOUT EVENT:', { event, session });
        logger.log(`[DashboardLayout] Auth event: ${event}`, { hasSession: !!session });
        if (event === "SIGNED_OUT") {
          logger.log('[DashboardLayout] SIGNED_OUT detected.');
          setUser(null);
          if (window.location.pathname !== "/auth/login") {
             logger.log('[DashboardLayout] Redirecting to login...');
             router.push("/auth/login");
          }
        } else if (session) {
          logger.log('[DashboardLayout] Session updated/received.');
          setUser(session.user);
        } else {
           logger.log('[DashboardLayout] Null session detected (and not SIGNED_OUT).');
           setUser(null);
           if (window.location.pathname !== "/auth/login") {
             logger.log('[DashboardLayout] Redirecting to login...');
             router.push("/auth/login");
           }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <OnboardingProvider>
      <div className="flex h-screen overflow-hidden relative">
        {user ? (
          <DashboardSidebar user={user} handleLogout={handleLogout} isLoggingOut={isLoggingOut} />
        ) : (
          <div className="w-64 bg-card border-r border-muted/20 dark:border-muted/40"></div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden bg-card transition-all duration-200">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto pl-2 pt-2 pr-2 pb-20 md:pb-2">
            <div className="bg-background dark:bg-background bg-graph-paper dark:bg-graph-paper-dark text-foreground rounded-2xl min-h-full p-4 md:p-6 shadow-sm">
              <div className={isFullWidthPage ? "w-full" : "max-w-[1024px] mx-auto"}>
                {children}
              </div>
            </div>
          </main>
        </div>
        <ScanExamFeature />

        {/* Welcome Modal para primer login */}
        <WelcomeTierModal
          open={showWelcome}
          onOpenChange={setShowWelcome}
          onComplete={() => {
            setShowWelcome(false);
            toast.success(tTiers('welcome.success', { defaultValue: 'Welcome to ProfeVision!' }), {
              description: tTiers('welcome.successDesc', { defaultValue: 'Your account has been set up successfully.' }),
            });
          }}
        />
      </div>
      </OnboardingProvider>
    </SidebarProvider>
  );
} 