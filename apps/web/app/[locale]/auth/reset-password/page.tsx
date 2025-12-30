"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/supabase";
import { toast } from "sonner";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { logger } from "@/lib/utils/logger";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tErrors = useTranslations('auth.errors');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 🌍 Schema de validación localizado
  const resetSchema = z.object({
    email: z.string().email({ message: tErrors('invalidEmail') }),
  });

  type ResetFormValues = z.infer<typeof resetSchema>;

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ResetFormValues) {
    if (!captchaToken) {
      toast.error(tErrors('captchaRequired'), {
        description: tErrors('validationError'),
      });
      return;
    }

    setIsLoading(true);
    try {
      logger.auth("Attempting to reset password", { 
        email: data.email,
      });
      
      const { error } = await resetPassword(data.email, captchaToken, locale as 'es' | 'en');

      if (error) {
        logger.auth("Error resetting password", { error, email: data.email });
        throw error;
      }

      logger.auth("Password reset email sent", { email: data.email });
      setIsSubmitted(true);
      toast.success(t('success'), {
        description: t('successDescription'),
      });
    } catch (error: unknown) {
      logger.auth("Exception resetting password", { 
        error: error instanceof Error ? error : new Error('Unknown error'),
        email: data.email
      });
      
      toast.error(t('error') || 'Error', {
        description: getAuthErrorMessage(error, tErrors),
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

  // 🔄 Rutas localizadas
  const loginPath = locale === 'es' ? '/auth/login' : '/en/auth/login';

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('checkEmail')}</CardTitle>
          <CardDescription className="text-center">
            {t('checkEmailDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('spamNote')}
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline" className="w-full">
            <Link href={loginPath}>
              {t('backToLogin')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

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
              placeholder={t("emailPlaceholder")}
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
          <Link href={loginPath} className="text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 