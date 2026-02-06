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
        const { postId, title, excerpt, content, keywords, metaTitle, metaDescription, sourceLocale = 'es' } = await req.json();

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
            metaTitle?: string;
            metaDescription?: string;
            keywords?: string;
        }

        const translations: Record<string, TranslationData> = {};

        const localeNames: Record<string, string> = { es: 'Spanish', en: 'English', fr: 'French', pt: 'Portuguese' };

        // Translate to each target locale
        for (const locale of targetLocales) {
            const targetLocaleName = localeNames[locale];
            const currentMetaTitle = metaTitle || '';
            const currentMetaDescription = metaDescription || '';

            // Combined prompt for translation + SEO
            const combinedPrompt = `Translate this blog post metadata from Spanish to ${targetLocaleName} AND generate SEO-optimized versions.

Return valid JSON only, no markdown:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "metaTitle": "SEO-optimized title EXACTLY 50-60 chars, compelling, NO suffix or brand name",
  "metaDescription": "SEO-optimized description EXACTLY 150-160 chars, persuasive",
  "keywords": "5-8 relevant keywords, comma-separated"
}

Original:
- Title: ${title}
- Excerpt: ${excerpt || 'No excerpt'}
- Keywords: ${keywords || 'No keywords provided'}
${currentMetaTitle ? `- Current metaTitle: ${currentMetaTitle}` : ''}
${currentMetaDescription ? `- Current metaDescription: ${currentMetaDescription}` : ''}`;

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
                    metaTitle: parsed.metaTitle,
                    metaDescription: parsed.metaDescription,
                    keywords: parsed.keywords && parsed.keywords.trim() ? parsed.keywords.trim() : undefined,
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

                // Get existing document to merge meta fields
                const existingDoc = await payload.findByID({
                    collection: 'blog_posts',
                    id: postId,
                    locale: locale as 'en' | 'fr' | 'pt',
                    depth: 0,
                });

                // Build merged meta object
                const existingMeta = existingDoc.meta || {};
                const metaFields: Record<string, unknown> = { ...existingMeta };

                if (translation.metaTitle) {
                    metaFields.title = translation.metaTitle;
                }
                if (translation.metaDescription) {
                    metaFields.description = translation.metaDescription;
                }
                if (translation.keywords !== undefined) {
                    metaFields.keywords = translation.keywords;
                }

                updateData.meta = metaFields;

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
