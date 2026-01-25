import { NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { title, excerpt } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        const { text } = await generateText({
            model: openrouter(model),
            prompt: `Generate a URL slug in ENGLISH for this blog post. The slug should be:
- All lowercase
- Words separated by hyphens
- No special characters
- 3-6 words maximum
- SEO friendly

Title (Spanish): ${title}
${excerpt ? `Excerpt: ${excerpt}` : ''}

Return ONLY the slug, nothing else. Example: how-to-create-effective-exams`,
        });

        // Clean the response
        const slug = text
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        console.log('[Slug Suggestion] Generated:', slug);

        return NextResponse.json({ slug });
    } catch (error) {
        console.error('[Slug Suggestion] Error:', error);
        return NextResponse.json({ error: 'Failed to generate slug' }, { status: 500 });
    }
}
