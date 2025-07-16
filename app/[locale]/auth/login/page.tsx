"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useLocalizedRoute } from '@/lib/utils/i18n-routes';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const locale = useLocale();
  const routes = useLocalizedRoute(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 🌍 Schema de validación localizado
  const loginSchema = z.object({
    email: z.string().email({ message: tErrors('invalidEmail') }),
    password: z.string().min(6, { message: tErrors('passwordTooShort') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: t('validationError'),
        description: t('captchaError'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: {
          captchaToken,
        }
      });

      if (error) {
        throw error;
      }

              // 🔄 Redirección localizada
        router.push(routes.dashboard.home());
      router.refresh();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t('loginError'),
        description: error instanceof Error ? error.message : tErrors('generalError'),
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

      // 🔄 Rutas localizadas con utilidad
    const resetPasswordPath = routes.auth.resetPassword();
    const registerPath = routes.auth.register();

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
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              <Link 
                href={resetPasswordPath}
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder=""
              {...form.register("password")}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
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
                  title: tErrors('captchaError'),
                  description: tErrors('captchaError'),
                });
              }}
              onExpire={() => setCaptchaToken(null)}
              className="mx-auto"
              options={{
                language: locale === 'es' ? 'es' : 'en',
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
          {t('noAccount')}{" "}
          <Link href={registerPath} className="text-primary hover:underline" title={t('signUp')}>
            {t('signUp')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 