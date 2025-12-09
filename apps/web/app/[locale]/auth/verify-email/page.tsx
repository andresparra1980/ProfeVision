import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const locale = useLocale();
  
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