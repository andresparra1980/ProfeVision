'use client';

import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('navigation.contact')}</h1>
        <p className="text-lg text-muted-foreground">
          Ponte en contacto con nuestro equipo
        </p>
      </div>
      
      <div className="prose max-w-none">
        <p>Contenido de la página de contacto...</p>
      </div>
    </div>
  );
} 