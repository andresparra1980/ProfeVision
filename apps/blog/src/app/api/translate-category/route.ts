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

// Helper to convert text to URL-friendly slug
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove consecutive hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export async function POST(req: Request) {
    try {
        const { categoryId, name, description, currentSlug, sourceLocale = 'es' } = await req.json();

        if (!categoryId || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const allLocales = ['es', 'en', 'fr', 'pt'];
        const targetLocales = allLocales.filter(l => l !== sourceLocale);
        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        const localeNames: Record<string, string> = { es: 'Spanish', en: 'English', fr: 'French', pt: 'Portuguese' };

        // Step 1: Generate English version for slug if needed
        let englishName = name;
        let finalSlug = currentSlug;

        if (sourceLocale !== 'en') {
            const englishPrompt = `Translate this category name from ${localeNames[sourceLocale]} to English. Return ONLY the English translation, nothing else.

Category name: "${name}"

English translation:`;

            const { text: englishText } = await generateText({
                model: openrouter(model),
                prompt: englishPrompt,
            });

            englishName = englishText.trim();
            finalSlug = toSlug(englishName);
        } else {
            // If source is already English, just convert to slug format
            finalSlug = currentSlug || toSlug(name);
        }

        // Step 2: Translate to all target locales
        interface TranslationData {
            name: string;
            description: string;
        }

        const translations: Record<string, TranslationData> = {};

        for (const locale of targetLocales) {
            const targetLocaleName = localeNames[locale];

            const translationPrompt = `Translate this blog category from ${localeNames[sourceLocale]} to ${targetLocaleName}.
Return valid JSON only, no markdown:

{
  "name": "translated category name",
  "description": "translated description (or empty string if no description provided)"
}

Source:
- Name: "${name}"
- Description: "${description || ''}"`;

            const { text: translationText } = await generateText({
                model: openrouter(model),
                prompt: translationPrompt,
            });

            try {
                const cleanedTranslation = cleanJsonResponse(translationText);
                const parsed = JSON.parse(cleanedTranslation);
                translations[locale] = {
                    name: parsed.name,
                    description: parsed.description || '',
                };
            } catch (parseError) {
                console.error(`[Category Translation] Failed to parse for ${locale}:`, parseError);
                // Fallback: use original name
                translations[locale] = { name, description: description || '' };
            }
        }

        // Step 3: Update database
        const payload = await getPayloadClient();

        // Update source locale with final slug and mark as auto-processed
        if (finalSlug && finalSlug !== currentSlug) {
            try {
                await payload.update({
                    collection: 'blog_categories',
                    id: categoryId,
                    locale: sourceLocale as 'es' | 'en' | 'fr' | 'pt',
                    data: {
                        slug: finalSlug,
                        autoTranslationProcessed: true,
                    },
                });
            } catch (updateError) {
                console.error('[Category Translation] Failed to update slug:', updateError);
            }
        }

        // Update translated locales with auto-translation flag
        for (const [locale, translation] of Object.entries(translations)) {
            try {
                const updateData: Record<string, unknown> = {
                    name: translation.name,
                    autoTranslationProcessed: true,
                };

                if (description) {
                    updateData.description = translation.description;
                }

                // Always set the same English slug for all locales
                updateData.slug = finalSlug;

                await payload.update({
                    collection: 'blog_categories',
                    id: categoryId,
                    locale: locale as 'es' | 'en' | 'fr' | 'pt',
                    data: updateData,
                });
            } catch (updateError) {
                console.error(`[Category Translation] Failed to update ${locale}:`, updateError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            categoryId,
            slug: finalSlug,
            translations: Object.keys(translations),
        });
    } catch (error) {
        console.error('[Category Translation] Error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
