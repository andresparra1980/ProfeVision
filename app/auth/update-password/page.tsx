"use client";

import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

// Client component that uses useSearchParams
function UpdatePasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Check if we have any tokens in URL
  useEffect(() => {
    const checkSession = async () => {
      logger.auth("Checking session in update-password page", {
        source: searchParams.get('source'),
        type: searchParams.get('type'),
        timestamp: searchParams.get('timestamp'),
        hasCode: !!searchParams.get('code')
      });
      
      // Try multiple approaches to get a valid session
      
      // Approach 1: Direct tokens from URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (accessToken && refreshToken && type === 'recovery') {
        logger.auth("Found direct recovery tokens in URL", {
          type,
          hasAccessToken: true,
          hasRefreshToken: true
        });
        
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            logger.auth("Error setting session from URL tokens", { error });
          } else {
            logger.auth("Successfully set session from URL tokens");
            // Check if session was actually set
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              logger.auth("Verified session was set correctly");
              return; // Session is set, we can continue
            } else {
              logger.auth("Token was accepted but no session created");
            }
          }
          // If error or no session, continue to next approach
        } catch (e) {
          logger.auth("Exception setting session from URL tokens", { error: e });
        }
      }
      
      // Approach 2: Try code exchange if code is present
      const code = searchParams.get('code');
      if (code) {
        logger.auth("Found code in URL, attempting exchange", { hasCode: true });
        try {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            logger.auth("Error exchanging code for session", { error: exchangeError });
          } else if (exchangeData.session) {
            logger.auth("Successfully exchanged code for session");
            return; // Session is set, we can continue
          }
          // If error or no session, continue to next approach
        } catch (e) {
          logger.auth("Exception exchanging code for session", { error: e });
        }
      }
      
      // Approach 3: Check for existing session
      const { data, error } = await supabase.auth.getSession();
      
      logger.auth("Session check result", { 
        hasSession: !!data.session, 
        hasError: !!error,
        errorMessage: error?.message,
        flowType: accessToken ? 'direct' : (code ? 'code' : 'callback')
      });
      
      // If there's an error or no session, show error message
      if (error || !data.session) {
        logger.auth("No valid session for password update", { 
          hasError: !!error,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          code: !!code
        });
        setError("El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.");
      } else {
        logger.auth("Valid session found for password update");
      }
    };
    
    checkSession();
  }, [searchParams]);

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: UpdatePasswordFormValues) {
    setIsLoading(true);
    try {
      logger.auth("Attempting to update password");
      
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        logger.auth("Error updating password", { error });
        throw error;
      }

      logger.auth("Password successfully updated");
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });
      
      router.push("/auth/login");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Error</CardTitle>
              <CardDescription className="text-center text-destructive">
                {error}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild variant="outline" className="w-full">
                <a href="/auth/reset-password">Solicitar nuevo enlace</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Nueva contraseña</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu nueva contraseña
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Wrapper component
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
} 