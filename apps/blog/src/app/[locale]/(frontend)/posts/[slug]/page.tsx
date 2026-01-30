import { getPayloadClient } from '@/lib/payload';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { draftMode } from 'next/headers';
import Link from 'next/link';
import { Button } from '@profevision/ui/button';
import { Card, CardContent } from '@profevision/ui/card';
import { LexicalRenderer } from '@/components/lexical-renderer';
import { PreviewBanner } from '@/components/preview-banner';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const payload = await getPayloadClient();
    
    // Check if we're in draft mode (preview)
    const draft = await draftMode();
    const isDraft = draft.isEnabled;

    // Query based on draft mode
    let docs;
    if (isDraft) {
        // In draft mode, find any post with this slug
        const result = await payload.find({
            collection: 'blog_posts',
            where: { slug: { equals: slug } },
            locale: locale as 'es' | 'en' | 'fr' | 'pt',
            limit: 1,
        });
        docs = result.docs;
    } else {
        // In production, only find published posts
        const result = await payload.find({
            collection: 'blog_posts',
            where: {
                and: [
                    { slug: { equals: slug } },
                    { status: { equals: 'published' } },
                ],
            },
            locale: locale as 'es' | 'en' | 'fr' | 'pt',
            limit: 1,
        });
        docs = result.docs;
    }

    const post = docs[0];
    if (!post) return { title: 'Post not found' };

    return {
        title: isDraft ? `[PREVIEW] ${post.title}` : post.title,
        description: post.excerpt || undefined,
        robots: isDraft ? { index: false, follow: false } : undefined,
    };
}

export default async function PostPage({ params }: PageProps) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    const payload = await getPayloadClient();
    
    // Check if we're in draft mode (preview)
    const draft = await draftMode();
    const isDraft = draft.isEnabled;

    // Query based on draft mode
    let docs;
    if (isDraft) {
        // In draft mode, find any post with this slug
        const result = await payload.find({
            collection: 'blog_posts',
            where: { slug: { equals: slug } },
            locale: locale as 'es' | 'en' | 'fr' | 'pt',
            depth: 2,
            limit: 1,
        });
        docs = result.docs;
    } else {
        // In production, only find published posts
        const result = await payload.find({
            collection: 'blog_posts',
            where: {
                and: [
                    { slug: { equals: slug } },
                    { status: { equals: 'published' } },
                ],
            },
            locale: locale as 'es' | 'en' | 'fr' | 'pt',
            depth: 2,
            limit: 1,
        });
        docs = result.docs;
    }

    const post = docs[0];

    if (!post) {
        notFound();
    }

    const backText = locale === 'es' ? '← Volver al blog' :
        locale === 'en' ? '← Back to blog' :
            locale === 'fr' ? '← Retour au blog' :
                '← Voltar ao blog';

    return (
        <main className="container mx-auto py-12 px-4 max-w-4xl">
            <article>
                {/* Preview Mode Banner */}
                {isDraft && <PreviewBanner locale={locale} />}
                
                {/* Header */}
                <header className="mb-8">
                    {post.category && typeof post.category === 'object' && (
                        <Link
                            href={`/categories/${post.category.slug}`}
                            className="text-sm text-primary hover:underline mb-2 block"
                        >
                            {post.category.name}
                        </Link>
                    )}
                    <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
                    {post.excerpt && (
                        <p className="text-xl text-muted-foreground mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.author && typeof post.author === 'object' && (
                            <span>Por {post.author.name}</span>
                        )}
                        {post.publishedAt && (
                            <time>
                                {new Date(post.publishedAt).toLocaleDateString(locale, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                        )}
                    </div>
                </header>

                {/* Featured Image */}
                {post.featuredImage && typeof post.featuredImage === 'object' && post.featuredImage.url && (
                    <div className="mb-8 rounded-lg overflow-hidden">
                        <img
                            src={post.featuredImage.url}
                            alt={post.featuredImage.alt || post.title}
                            className="w-full h-auto object-cover max-h-[500px]"
                        />
                    </div>
                )}

                {/* Content */}
                <Card>
                    <CardContent className="py-8">
                        <LexicalRenderer content={post.content} />
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="mt-8">
                    <Button variant="outline" asChild>
                        <Link href="/">{backText}</Link>
                    </Button>
                </div>
            </article>
        </main>
    );
}
