"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithRedirect } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor, completa el CAPTCHA para continuar.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUpWithRedirect(
        data.email, 
        data.password, 
        {
          full_name: data.name,
          name: data.name,
        },
        captchaToken
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Registro exitoso",
        description: "Se ha enviado un correo de confirmación a tu dirección de email.",
      });
      
      router.push("/auth/verify-email");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.",
      });
      
      // Resetear el CAPTCHA en caso de error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      
      <div className="flex-1 flex items-start justify-center pt-24 pb-36 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
              <CardDescription className="text-center">
                Regístrate para acceder a todas las funcionalidades
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    placeholder="Juan Pérez"
                    {...form.register("name")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    {...form.register("email")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
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
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-center mt-6 mb-6">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => {
                      setCaptchaToken(null);
                      toast({
                        variant: "destructive",
                        title: "Error de CAPTCHA",
                        description: "Error al validar el CAPTCHA. Por favor, inténtalo de nuevo.",
                      });
                    }}
                    onExpire={() => setCaptchaToken(null)}
                    className="mx-auto"
                    options={{
                      language: "es",
                      theme: "auto",
                    }}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
                  {isLoading ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center pt-2 pb-8">
              <div className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 