'use client';

import { useTranslations } from 'next-intl';

export default function CookiesPage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('navigation.cookies')}</h1>
        <p className="text-lg text-muted-foreground">
          Política de cookies y seguimiento
        </p>
      </div>
      
      <div className="prose max-w-none">
        <p>Contenido de la política de cookies...</p>
      </div>
    </div>
  );
} 