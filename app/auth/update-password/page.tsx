"use client";

import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
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

interface PasswordUpdateError {
  code: number;
  error_code: string;
  msg: string;
}

// Client component that uses useSearchParams
function UpdatePasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Check if we have any tokens in URL
  useEffect(() => {
    const checkSession = async () => {
      // Try multiple approaches to get a valid session
      
      // Approach 1: Direct token from URL
      const accessToken = searchParams.get('access_token');
      
      if (accessToken) {
        try {
          // Try to create a session using just the access token
          const { data, error } = await supabase.auth.getUser(accessToken);
          
          if (!error && data.user) {
            // Successfully authenticated
            return;
          }
        } catch (_e) {
          // Continue to next approach
        }
      }
      
      // Approach 2: Try direct tokens
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (refreshToken && type === 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken || '',
            refresh_token: refreshToken
          });
          
          if (!error) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              return; // Session is set
            }
          }
        } catch (_e) {
          // Continue to next approach
        }
      }
      
      // Approach 3: Check for existing session
      const { data, error } = await supabase.auth.getSession();
      
      // If there's an error or no session, show error message
      if (error || !data.session) {
        setError("El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.");
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
      // Get access token from URL if available
      const accessToken = searchParams.get('access_token');
      let error: PasswordUpdateError | Error | null = null;
      
      if (accessToken) {
        // Direct approach using fetch when we have an access token from URL
        try {
          // Direct API call to Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({
              password: data.password
            })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            error = new Error(result.error || "Error al actualizar la contraseña");
          }
        } catch (e) {
          error = new Error(e instanceof Error ? e.message : "Error al actualizar la contraseña");
        }
      } else {
        // Regular update using existing session (if any)
        const updateResult = await supabase.auth.updateUser({
          password: data.password,
        });
        error = updateResult.error;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });
      
      router.push("/auth/login");
    } catch (error: unknown) {
      let errorMsg = "Ha ocurrido un error. Intenta nuevamente.";
      const typedError = error as PasswordUpdateError;
      if (
        typedError.error_code === "same_password" ||
        typedError.msg === "New password should be different from the old password."
      ) {
        errorMsg = "La nueva contraseña debe ser diferente a la anterior.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error al actualizar la contraseña, la nueva contraseña debe ser diferente a la anterior.",
        description: errorMsg,
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
                <Link href="/auth/reset-password">Solicitar nuevo enlace</Link>
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