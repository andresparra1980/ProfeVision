import Link from 'next/link';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const content = {
    es: {
      title: 'ProfeVision Docs',
      description:
        'Documentación completa para profesores usando ProfeVision.',
      getStarted: 'Comenzar',
    },
    en: {
      title: 'ProfeVision Docs',
      description:
        'Complete documentation for teachers using ProfeVision.',
      getStarted: 'Get Started',
    },
  };

  const t = content[lang as keyof typeof content] || content.es;

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t.title}</h1>
      <p className="mb-8 text-fd-muted-foreground max-w-lg">{t.description}</p>
      <Link
        href={`/${lang}/docs`}
        className="inline-flex items-center justify-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
      >
        {t.getStarted}
      </Link>
    </main>
  );
}
