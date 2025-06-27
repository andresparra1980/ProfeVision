"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { logger } from "@/lib/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const resetSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ResetFormValues) {
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
      logger.auth("Attempting to reset password", { 
        email: data.email,
      });
      
      const { error } = await resetPassword(data.email, captchaToken);

      if (error) {
        logger.auth("Error resetting password", { error, email: data.email });
        throw error;
      }

      logger.auth("Password reset email sent", { email: data.email });
      setIsSubmitted(true);
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un enlace para restablecer tu contraseña.",
      });
    } catch (error: unknown) {
      logger.auth("Exception resetting password", { 
        error: error instanceof Error ? error : new Error('Unknown error'),
        email: data.email
      });
      
      toast({
        variant: "destructive",
        title: "Error",
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

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Revisa tu correo</CardTitle>
          <CardDescription className="text-center">
            Hemos enviado un enlace para restablecer tu contraseña a tu dirección de correo.
            Por favor, revisa tu bandeja de entrada.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Si no has recibido el correo en unos minutos, revisa tu carpeta de spam
            o intenta nuevamente.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              Volver a iniciar sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Restablecer contraseña</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu correo electrónico para recibir instrucciones para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          
          <div className="flex justify-center">
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
            {isLoading ? "Enviando..." : "Enviar instrucciones"}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 