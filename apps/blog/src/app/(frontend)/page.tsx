import Link from 'next/link';
import { Button } from '@profevision/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@profevision/ui/card';

// TODO: Replace with actual Payload data fetching
const mockPosts = [
    {
        id: '1',
        title: 'Cómo la IA está transformando la educación',
        excerpt: 'Descubre las últimas tendencias en tecnología educativa y cómo la inteligencia artificial está cambiando la forma en que enseñamos.',
        slug: 'ia-transformando-educacion',
        publishedAt: '2024-01-15',
        category: { name: 'Tecnología Educativa' },
    },
    {
        id: '2',
        title: 'Mejores prácticas para evaluar con exámenes',
        excerpt: 'Guía completa sobre cómo diseñar exámenes efectivos que realmente midan el aprendizaje de tus estudiantes.',
        slug: 'mejores-practicas-examenes',
        publishedAt: '2024-01-10',
        category: { name: 'Evaluación' },
    },
];

export default function BlogHomePage() {
    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">ProfeVision Blog</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Artículos y recursos sobre educación, tecnología y evaluación con IA
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockPosts.map((post) => (
                    <Link key={post.id} href={`/${post.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="text-sm text-primary mb-2">{post.category.name}</div>
                                <CardTitle className="text-xl">{post.title}</CardTitle>
                                <CardDescription>{post.excerpt}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <time className="text-sm text-muted-foreground">
                                    {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </time>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Button variant="outline" asChild>
                    <Link href="https://profevision.com">← Volver a ProfeVision</Link>
                </Button>
            </div>
        </main>
    );
}
