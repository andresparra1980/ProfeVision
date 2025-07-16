"use client";

import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
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

interface PasswordUpdateError {
  code: number;
  error_code: string;
  msg: string;
}

// Client component that uses useSearchParams
function UpdatePasswordContent() {
  const t = useTranslations('auth.updatePassword');
  const tErrors = useTranslations('auth.errors');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // 🌍 Schema de validación localizado
  const updatePasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, { message: tErrors('passwordTooShort') }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tErrors('passwordMismatch'),
      path: ["confirmPassword"],
    });

  type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

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
        setError(t('invalidLink'));
      }
    };
    
    checkSession();
  }, [searchParams, t]);

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
            error = new Error(result.error || t('error'));
          }
        } catch (e) {
          error = new Error(e instanceof Error ? e.message : t('error'));
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
        title: t('success'),
        description: t('successDescription'),
      });
      
      // 🔄 Redirección localizada
      const loginPath = locale === 'es' ? '/auth/login' : '/en/auth/login';
      router.push(loginPath);
    } catch (error: unknown) {
      let errorMsg = tErrors('generalError');
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
        title: t('error'),
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 🔄 Rutas localizadas
  const resetPasswordPath = locale === 'es' ? '/auth/reset-password' : '/en/auth/reset-password';

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
                <a href={resetPasswordPath}>Solicitar nuevo enlace</a>
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
            <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
            <CardDescription className="text-center">
              {t('description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
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
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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
                {isLoading ? t('submitting') : t('submit')}
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
  const tCommon = useTranslations('common');
  
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <p>{tCommon('loading')}</p>
        </div>
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
} 