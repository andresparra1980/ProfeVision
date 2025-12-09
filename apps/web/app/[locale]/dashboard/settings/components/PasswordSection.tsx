"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PasswordSection() {
  const t = useTranslations('dashboard.settings');

  // TODO: Implement password change functionality
  const handleChangePassword = () => {
    // Placeholder for future implementation
    console.log("Change password clicked");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('password.title')}</CardTitle>
        <CardDescription>
          {t('password.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleChangePassword}>
          {t('password.button')}
        </Button>
      </CardContent>
    </Card>
  );
}
