import { NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { getPayloadClient } from '@/lib/payload';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { postId, title, excerpt, content, sourceLocale = 'es' } = await req.json();

        if (!postId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const targetLocales = ['en', 'fr', 'pt'].filter(l => l !== sourceLocale);
        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        const translations: Record<string, { title: string; excerpt: string }> = {};

        // Translate to each target locale
        for (const locale of targetLocales) {
            const localeName = {
                en: 'English',
                fr: 'French',
                pt: 'Portuguese',
            }[locale];

            const { text } = await generateText({
                model: openrouter(model),
                prompt: `You are a professional translator. Translate the following blog post metadata from Spanish to ${localeName}.

Return a valid JSON object with these fields:
- title: the translated title
- excerpt: the translated excerpt/summary

IMPORTANT: Return ONLY the JSON object, no other text.

---
Title: ${title}

Excerpt: ${excerpt || 'No excerpt provided'}
---`,
            });

            try {
                translations[locale] = JSON.parse(text);
            } catch {
                console.error(`[Translation] Failed to parse for ${locale}:`, text);
                translations[locale] = { title, excerpt: excerpt || '' };
            }
        }

        // Update post with translations in database
        const payload = await getPayloadClient();

        for (const [locale, translation] of Object.entries(translations)) {
            try {
                await payload.update({
                    collection: 'blog_posts',
                    id: postId,
                    locale: locale as 'en' | 'fr' | 'pt',
                    data: {
                        title: translation.title,
                        excerpt: translation.excerpt,
                    },
                });
                console.log(`[Translation] Updated post ${postId} for locale ${locale}`);
            } catch (updateError) {
                console.error(`[Translation] Failed to update ${locale}:`, updateError);
            }
        }

        return NextResponse.json({
            success: true,
            postId,
            translations,
        });
    } catch (error) {
        console.error('[Translation] Error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
