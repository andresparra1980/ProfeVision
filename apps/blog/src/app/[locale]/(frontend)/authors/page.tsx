import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@profevision/ui/card';
import { getPayloadClient } from '@/lib/payload';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AuthorsPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('common');

    const payload = await getPayloadClient();
    const { docs: authors } = await payload.find({
        collection: 'blog_authors',
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        limit: 50,
    });

    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">{t('authors')}</h1>
                <p className="text-xl text-muted-foreground">
                    {locale === 'es' ? 'Conoce a nuestros autores' :
                        locale === 'en' ? 'Meet our authors' :
                            locale === 'fr' ? 'Rencontrez nos auteurs' :
                                'Conheça nossos autores'}
                </p>
            </header>

            {authors.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {locale === 'es' ? 'No hay autores aún.' :
                            locale === 'en' ? 'No authors yet.' :
                                locale === 'fr' ? 'Pas encore d\'auteurs.' :
                                    'Ainda não há autores.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {authors.map((author) => (
                        <Link key={author.id} href={`/authors/${author.id}`}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row gap-4 items-center">
                                    {author.avatar && typeof author.avatar === 'object' && author.avatar.url && (
                                        <img
                                            src={author.avatar.url}
                                            alt={author.name}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <CardTitle>{author.name}</CardTitle>
                                        {author.bio && (
                                            <CardDescription className="line-clamp-2">
                                                {author.bio}
                                            </CardDescription>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
