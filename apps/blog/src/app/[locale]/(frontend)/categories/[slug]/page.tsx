import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@profevision/ui/card';
import { Button } from '@profevision/ui/button';
import { getPayloadClient } from '@/lib/payload';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const payload = await getPayloadClient();

    const { docs } = await payload.find({
        collection: 'blog_categories',
        where: { slug: { equals: slug } },
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        limit: 1,
    });

    const category = docs[0];
    if (!category) return { title: 'Category not found' };

    return {
        title: category.name,
        description: category.description || undefined,
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    const payload = await getPayloadClient();

    // Get category
    const { docs: categories } = await payload.find({
        collection: 'blog_categories',
        where: { slug: { equals: slug } },
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        limit: 1,
    });

    const category = categories[0];
    if (!category) notFound();

    // Get posts in this category
    const { docs: posts } = await payload.find({
        collection: 'blog_posts',
        where: {
            category: { equals: category.id },
            status: { equals: 'published' },
        },
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        sort: '-publishedAt',
        limit: 20,
        depth: 1,
    });

    const backText = locale === 'es' ? '← Todas las categorías' :
        locale === 'en' ? '← All categories' :
            locale === 'fr' ? '← Toutes les catégories' :
                '← Todas as categorias';

    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
                {category.description && (
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {category.description}
                    </p>
                )}
            </header>

            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {locale === 'es' ? 'No hay artículos en esta categoría.' :
                            locale === 'en' ? 'No articles in this category.' :
                                locale === 'fr' ? 'Aucun article dans cette catégorie.' :
                                    'Nenhum artigo nesta categoria.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.slug}`}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="text-xl">{post.title}</CardTitle>
                                    <CardDescription>{post.excerpt}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {post.publishedAt && (
                                        <time className="text-sm text-muted-foreground">
                                            {new Date(post.publishedAt).toLocaleDateString(locale, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </time>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <div className="mt-12 text-center">
                <Button variant="outline" asChild>
                    <Link href="/categories">{backText}</Link>
                </Button>
            </div>
        </main>
    );
}
