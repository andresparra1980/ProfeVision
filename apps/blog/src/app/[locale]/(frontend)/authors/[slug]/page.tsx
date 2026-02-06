import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@profevision/ui/card';
import { Button } from '@profevision/ui/button';
import { getPayloadClient } from '@/lib/payload';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

// Valid locales supported by the app
const VALID_LOCALES = ['es', 'en', 'fr', 'pt'] as const;
type ValidLocale = typeof VALID_LOCALES[number];

function isValidLocale(locale: string): locale is ValidLocale {
    return VALID_LOCALES.includes(locale as ValidLocale);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const payload = await getPayloadClient();

    const author = await payload.findByID({
        collection: 'blog_authors',
        id: slug,
        locale: locale as 'es' | 'en' | 'fr' | 'pt',
    }).catch(() => null);

    if (!author) return { title: 'Author not found' };

    return {
        title: author.name,
        description: author.bio || undefined,
    };
}

export default async function AuthorPage({ params }: PageProps) {
    const { locale, slug } = await params;
    // Validate locale and fallback to 'es' if invalid
    const validLocale = isValidLocale(locale) ? locale : 'es';
    setRequestLocale(validLocale);

    const payload = await getPayloadClient();

    // Get author by ID
    const author = await payload.findByID({
        collection: 'blog_authors',
        id: slug,
        locale: validLocale as 'es' | 'en' | 'fr' | 'pt',
        depth: 1,
    }).catch(() => null);

    if (!author) notFound();

    // Get posts by this author
    const { docs: posts } = await payload.find({
        collection: 'blog_posts',
        where: {
            author: { equals: author.id },
            status: { equals: 'published' },
        },
        locale: validLocale as 'es' | 'en' | 'fr' | 'pt',
        sort: '-publishedAt',
        limit: 20,
        depth: 1,
    });

    const backText = locale === 'es' ? '← Todos los autores' :
        locale === 'en' ? '← All authors' :
            locale === 'fr' ? '← Tous les auteurs' :
                '← Todos os autores';

    const postsLabel = locale === 'es' ? 'Artículos publicados' :
        locale === 'en' ? 'Published articles' :
            locale === 'fr' ? 'Articles publiés' :
                'Artigos publicados';

    return (
        <main className="container mx-auto py-12 px-4 max-w-4xl">
            {/* Author Header */}
            <header className="mb-12 text-center">
                {author.avatar && typeof author.avatar === 'object' && author.avatar.url && (
                    <Image
                        src={author.avatar.url}
                        alt={author.name}
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                    />
                )}
                <h1 className="text-4xl font-bold mb-4">{author.name}</h1>
                {author.bio && (
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {author.bio}
                    </p>
                )}
            </header>

            {/* Posts by Author */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">{postsLabel}</h2>

                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            {locale === 'es' ? 'Este autor no tiene artículos publicados.' :
                                locale === 'en' ? 'This author has no published articles.' :
                                    locale === 'fr' ? 'Cet auteur n\'a pas d\'articles publiés.' :
                                        'Este autor não tem artigos publicados.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/posts/${post.slug}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardHeader>
                                        {post.category && typeof post.category === 'object' && (
                                            <span className="text-sm text-primary mb-1">
                                                {post.category.name}
                                            </span>
                                        )}
                                        <CardTitle className="text-xl">{post.title}</CardTitle>
                                        <CardDescription>{post.excerpt}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {post.publishedAt && (
                                            <time className="text-sm text-muted-foreground">
                                                {new Date(post.publishedAt).toLocaleDateString(validLocale, {
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
            </section>

            <div className="mt-12 text-center">
                <Button variant="outline" asChild>
                    <Link href="/authors">{backText}</Link>
                </Button>
            </div>
        </main>
    );
}
