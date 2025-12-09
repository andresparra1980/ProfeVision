"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsSection() {
  const t = useTranslations('dashboard.settings');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('notifications.title')}</CardTitle>
        <CardDescription>
          {t('notifications.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {t('notifications.comingSoon')}
        </p>
      </CardContent>
    </Card>
  );
}
