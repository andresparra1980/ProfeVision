'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('navigation.pricing')}</h1>
        <p className="text-lg text-muted-foreground">
          Planes diseñados para instituciones educativas de todos los tamaños
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Plan Básico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-4">$29/mes</p>
            <p className="text-muted-foreground">Perfecto para empezar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Plan Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-4">$79/mes</p>
            <p className="text-muted-foreground">Para instituciones medianas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Plan Institucional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-4">$199/mes</p>
            <p className="text-muted-foreground">Para grandes instituciones</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 