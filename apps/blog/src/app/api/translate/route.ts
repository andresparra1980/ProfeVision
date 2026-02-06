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

        if (!postId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const allLocales = ['es', 'en', 'fr', 'pt'];
        const targetLocales = allLocales.filter(l => l !== sourceLocale);
        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        interface TranslationData {
            title: string;
            excerpt: string;
            content?: unknown;
            seoTitle?: string;
            seoDescription?: string;
        }

        const translations: Record<string, TranslationData> = {};

        // Generate SEO for source locale first
        const localeNames: Record<string, string> = { es: 'Spanish', en: 'English', fr: 'French', pt: 'Portuguese' };
        // Translate to each target locale
        for (const locale of targetLocales) {
            const targetLocaleName = localeNames[locale];

            // Combined prompt for translation + SEO
            const combinedPrompt = `Translate this blog post metadata from Spanish to ${targetLocaleName} AND generate SEO-optimized versions.

Return valid JSON only, no markdown:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "metaTitle": "SEO title 50-60 chars, compelling",
  "metaDescription": "SEO description 100-150 chars"
}

Original:
- Title: ${title}
- Excerpt: ${excerpt || 'No excerpt'}`;

            const { text: metaText } = await generateText({
                model: openrouter(model),
                prompt: combinedPrompt,
            });

            try {
                const cleanedMeta = cleanJsonResponse(metaText);
                const parsed = JSON.parse(cleanedMeta);
                translations[locale] = {
                    title: parsed.title,
                    excerpt: parsed.excerpt,
                    seoTitle: parsed.metaTitle,
                    seoDescription: parsed.metaDescription,
                };
            } catch {
                console.error(`[Translation] Failed to parse for ${locale}`);
                translations[locale] = { title, excerpt: excerpt || '' };
            }

            // Translate content if provided
            if (content && typeof content === 'object') {
                const contentPrompt = `Translate this Lexical editor JSON from Spanish to ${targetLocaleName}.
Only translate "text" field values. Keep ALL other fields exactly the same.
Return valid JSON only, no markdown.

${JSON.stringify(content)}`;

                const { text: contentText } = await generateText({
                    model: openrouter(model),
                    prompt: contentPrompt,
                });

                try {
                    translations[locale].content = JSON.parse(cleanJsonResponse(contentText));
                } catch {
                    translations[locale].content = content;
                }
            }
        }

        // Update database
        const payload = await getPayloadClient();

        // Update translated locales
        for (const [locale, translation] of Object.entries(translations)) {
            try {
                const updateData: Record<string, unknown> = {
                    title: translation.title,
                    excerpt: translation.excerpt,
                };

                if (translation.content) {
                    updateData.content = translation.content;
                }

                // Note: meta.title and meta.description are managed by the SEO plugin automatically
                // based on the title and excerpt fields

                await payload.update({
                    collection: 'blog_posts',
                    id: postId,
                    locale: locale as 'en' | 'fr' | 'pt',
                    data: updateData,
                });
            } catch (updateError) {
                console.error(`[Translation] Failed to update ${locale}:`, updateError);
            }
        }

        return NextResponse.json({ success: true, postId });
    } catch (error) {
        console.error('[Translation] Error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
