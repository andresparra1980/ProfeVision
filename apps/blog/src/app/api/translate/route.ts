import { NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { getPayloadClient } from '@/lib/payload';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper to clean LLM response (remove markdown code blocks)
function cleanJsonResponse(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
}

export async function POST(req: Request) {
    try {
        const { postId, title, excerpt, content, sourceLocale = 'es' } = await req.json();

        console.log('[Translation] Received request for post:', postId);

        if (!postId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const targetLocales = ['en', 'fr', 'pt'].filter(l => l !== sourceLocale);
        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        const translations: Record<string, { title: string; excerpt: string; content?: unknown }> = {};

        // Translate to each target locale
        for (const locale of targetLocales) {
            const localeName = {
                en: 'English',
                fr: 'French',
                pt: 'Portuguese',
            }[locale];

            // Prompt for title and excerpt
            const metaPrompt = `Translate from Spanish to ${localeName}. Return ONLY valid JSON, no markdown.

{"title": "${title}", "excerpt": "${excerpt || ''}"}`;

            console.log(`[Translation] Translating metadata to ${locale}...`);

            const { text: metaText } = await generateText({
                model: openrouter(model),
                prompt: metaPrompt,
            });

            try {
                const cleanedMeta = cleanJsonResponse(metaText);
                translations[locale] = JSON.parse(cleanedMeta);
            } catch {
                console.error(`[Translation] Failed to parse metadata for ${locale}`);
                translations[locale] = { title, excerpt: excerpt || '' };
            }

            // Translate content if provided
            if (content && typeof content === 'object') {
                console.log(`[Translation] Translating content to ${locale}...`);

                const contentPrompt = `You are a JSON translator. Translate this Lexical editor JSON from Spanish to ${localeName}.

RULES:
1. Only translate the "text" field values
2. Keep ALL other fields exactly the same (type, format, mode, style, version, etc.)
3. Return valid JSON only, no markdown code blocks
4. Preserve the exact structure

JSON to translate:
${JSON.stringify(content)}`;

                const { text: contentText } = await generateText({
                    model: openrouter(model),
                    prompt: contentPrompt,
                });

                try {
                    const cleanedContent = cleanJsonResponse(contentText);
                    translations[locale].content = JSON.parse(cleanedContent);
                    console.log(`[Translation] Content translated for ${locale}`);
                } catch (e) {
                    console.error(`[Translation] Failed to parse content for ${locale}:`, e);
                    // Keep original content if translation fails
                    translations[locale].content = content;
                }
            }
        }

        // Update post with translations in database
        const payload = await getPayloadClient();

        for (const [locale, translation] of Object.entries(translations)) {
            try {
                const updateData: Record<string, unknown> = {
                    title: translation.title,
                    excerpt: translation.excerpt,
                };

                if (translation.content) {
                    updateData.content = translation.content;
                }

                console.log(`[Translation] Updating post ${postId} locale ${locale}...`);

                await payload.update({
                    collection: 'blog_posts',
                    id: postId,
                    locale: locale as 'en' | 'fr' | 'pt',
                    data: updateData,
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
