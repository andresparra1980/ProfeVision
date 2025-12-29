import Link from 'next/link';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const content = {
    es: {
      description:
        'Documentación completa para profesores usando ProfeVision.',
      getStarted: 'Comenzar',
    },
    en: {
      description:
        'Complete documentation for teachers using ProfeVision.',
      getStarted: 'Get Started',
    },
    fr: {
      description:
        'Documentation complète pour les enseignants utilisant ProfeVision.',
      getStarted: 'Commencer',
    },
    pt: {
      description:
        'Documentação completa para professores usando ProfeVision.',
      getStarted: 'Começar',
    },
  };

  const t = content[lang as keyof typeof content] || content.es;

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <h1 className="pt-16 mb-4 text-4xl font-bold md:text-5xl pv-logo">
        <span className="profe">Profe</span>
        <span className="vision">Vision</span>
        <span className="text-fd-foreground"> Docs</span>
      </h1>
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
