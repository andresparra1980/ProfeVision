"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithRedirect } from "@/lib/supabase";
import { toast } from "sonner";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 🌍 Schema de validación localizado
  const registerSchema = z.object({
    nombres: z.string().min(2, { message: t('firstNameTooShort') || 'El nombre debe tener al menos 2 caracteres' }),
    apellidos: z.string().min(2, { message: t('lastNameTooShort') || 'El apellido debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: tErrors('invalidEmail') }),
    password: z.string().min(6, { message: tErrors('passwordTooShort') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: tErrors('passwordMismatch'),
    path: ["confirmPassword"],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    if (!captchaToken) {
      toast.error(tErrors('captchaRequired'), {
        description: tErrors('validationError'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUpWithRedirect(
        data.email, 
        data.password, 
        {
          nombre: data.nombres,
          apellido: data.apellidos,
          full_name: `${data.nombres} ${data.apellidos}`,
          preferred_locale: locale,
        },
        captchaToken,
        locale as 'es' | 'en'
      );

      if (error) {
        throw error;
      }

      toast.success(t('success'), {
        description: t('successDescription'),
      });
      
      // 🔄 Redirección localizada
      const verifyEmailPath = locale === 'es' ? '/auth/verify-email' : '/en/auth/verify-email';
      router.push(verifyEmailPath);
    } catch (error: unknown) {
      toast.error(t('error'), {
        description: getAuthErrorMessage(error, tErrors),
      });
      
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  // 🔄 Rutas localizadas
  const loginPath = locale === 'es' ? '/auth/login' : '/en/auth/login';

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
        <CardDescription className="text-center">
          {t('description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">{t('firstName')}</Label>
            <Input
              id="nombres"
              placeholder={t("firstNamePlaceholder")}
              {...form.register("nombres")}
              disabled={isLoading}
            />
            {form.formState.errors.nombres && (
              <p className="text-sm text-destructive">{form.formState.errors.nombres.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apellidos">{t('lastName')}</Label>
            <Input
              id="apellidos"
              placeholder={t("lastNamePlaceholder")}
              {...form.register("apellidos")}
              disabled={isLoading}
            />
            {form.formState.errors.apellidos && (
              <p className="text-sm text-destructive">{form.formState.errors.apellidos.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
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
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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
                toast.error(tErrors('captchaError'));
              }}
              onExpire={() => setCaptchaToken(null)}
              className="mx-auto"
              options={{
                language: locale,
                theme: "auto",
              }}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
            {isLoading ? t('submitting') : t('submit')}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm">
          {t('hasAccount')}{" "}
          <Link href={loginPath} className="text-primary hover:underline" title={t('signIn')}>
            {t('signIn')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 