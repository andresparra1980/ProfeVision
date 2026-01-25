import Link from 'next/link';
import { Button } from '@profevision/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@profevision/ui/card';
import { getPayloadClient } from '@/lib/payload';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function BlogHomePage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('common');

    // Fetch published posts from Payload
    const payload = await getPayloadClient();
    const { docs: posts } = await payload.find({
        collection: 'blog_posts',
        where: {
            status: { equals: 'published' },
        },
        sort: '-publishedAt',
        limit: 12,
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
        depth: 1, // Include related docs (categories, authors)
    });

    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">ProfeVision Blog</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {t('footerDescription')}
                </p>
            </header>

            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                        {locale === 'es' ? 'No hay artículos publicados aún.' :
                            locale === 'en' ? 'No published articles yet.' :
                                locale === 'fr' ? 'Aucun article publié pour le moment.' :
                                    'Nenhum artigo publicado ainda.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.slug}`}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    {post.category && typeof post.category === 'object' && (
                                        <div className="text-sm text-primary mb-2">
                                            {post.category.name}
                                        </div>
                                    )}
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
                    <a href={`https://profevision.com/${locale}`}>← {t('mainSite')}</a>
                </Button>
            </div>
        </main>
    );
}
