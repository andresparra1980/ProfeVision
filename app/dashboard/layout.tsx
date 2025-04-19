"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { ScanExamFeature } from "@/components/exam/scan-exam-feature";
import { toast } from "@/components/ui/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { SidebarProvider } from "@/lib/contexts/sidebar-context";
import { usePing } from "@/lib/hooks/use-ping";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Usar el hook de ping para mantener la conexión activa
  usePing();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente."
      });
      
      window.location.href = "/auth/login";
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: err.message || "Ha ocurrido un error. Intenta nuevamente."
      });
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          router.push("/auth/login");
          return;
        }
        
        setUser(data.session.user);
        setLoading(false);
      } catch (error) {
        console.error("Error al verificar sesión:", error);
        router.push("/auth/login");
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        if (event === "SIGNED_OUT") {
          if (window.location.pathname !== "/auth/login") {
             router.push("/auth/login");
          }
        } else if (session) {
          setUser(session.user);
        } else {
           if (window.location.pathname !== "/auth/login") {
             router.push("/auth/login");
           }
        }
      }
    );

    return () => {
      // Limpiar suscripciones al desmontar
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
              {children}
            </div>
          </main>
        </div>
        <ScanExamFeature />
      </div>
    </SidebarProvider>
  );
} 