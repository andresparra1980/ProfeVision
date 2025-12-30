"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useTranslations, useLocale } from 'next-intl';
import { useLocalizedRoute } from '@/lib/utils/i18n-routes';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailConfirmedPage() {
  const t = useTranslations('auth.emailConfirmed');
  const locale = useLocale();
  const routes = useLocalizedRoute(locale);
  
  // 🔄 Rutas localizadas
  const loginPath = routes.auth.login();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {t('successMessage')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg">
            <Link href={loginPath}>
              {t('goToLogin')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 