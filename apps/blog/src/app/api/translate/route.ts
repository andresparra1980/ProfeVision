import { NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

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

        const translations: Record<string, { title: string; excerpt: string; content: string }> = {};

        for (const locale of targetLocales) {
            const localeName = {
                en: 'English',
                fr: 'French',
                pt: 'Portuguese',
            }[locale];

            const { text } = await generateText({
                model: openrouter(model),
                prompt: `You are a professional translator. Translate the following blog post from Spanish to ${localeName}.
        
Return a valid JSON object with these fields:
- title: the translated title
- excerpt: the translated excerpt/summary
- content: the translated content (preserve any markdown/HTML formatting)

IMPORTANT: Return ONLY the JSON object, no other text.

---
Title: ${title}

Excerpt: ${excerpt || 'No excerpt provided'}

Content:
${content || 'No content provided'}
---`,
            });

            try {
                translations[locale] = JSON.parse(text);
            } catch {
                console.error(`Failed to parse translation for ${locale}:`, text);
                translations[locale] = { title, excerpt: excerpt || '', content: content || '' };
            }
        }

        return NextResponse.json({
            success: true,
            postId,
            translations,
        });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
