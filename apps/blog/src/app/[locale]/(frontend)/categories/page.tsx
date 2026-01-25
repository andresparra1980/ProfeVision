import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@profevision/ui/card';
import { getPayloadClient } from '@/lib/payload';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function CategoriesPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('common');

    const payload = await getPayloadClient();
    const { docs: categories } = await payload.find({
        collection: 'blog_categories',
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        limit: 50,
    });

    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">{t('categories')}</h1>
                <p className="text-xl text-muted-foreground">
                    {locale === 'es' ? 'Explora artículos por tema' :
                        locale === 'en' ? 'Explore articles by topic' :
                            locale === 'fr' ? 'Explorez les articles par sujet' :
                                'Explore artigos por tema'}
                </p>
            </header>

            {categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {locale === 'es' ? 'No hay categorías aún.' :
                            locale === 'en' ? 'No categories yet.' :
                                locale === 'fr' ? 'Pas encore de catégories.' :
                                    'Ainda não há categorias.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Link key={category.id} href={`/categories/${category.slug}`}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle>{category.name}</CardTitle>
                                    {category.description && (
                                        <CardDescription>{category.description}</CardDescription>
                                    )}
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
