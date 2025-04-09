"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { toast } from "@/components/ui/use-toast";

interface DashboardHeaderProps {
  user: any;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      
      // Force a hard redirect instead of using the router
      window.location.href = "/auth/login";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente."
      });
      setIsLoggingOut(false);
    }
  };

  // Get the user's name from metadata, preferring full_name
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario';

  return (
    <header className="flex h-16 items-center justify-between bg-card px-6">
      <div></div>
      
      <div className="flex items-center space-x-4">
        <ModeToggle />
        
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Perfil</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/dashboard/profile")}>
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              disabled={isLoggingOut} 
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 