import { useTranslations } from 'next-intl';

export default function LocaleHomePage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        ProfeVision - {t('messages.loading')}
      </h1>
      <p className="text-center text-muted-foreground">
        {t('messages.success')}
      </p>
    </div>
  );
} 