import { NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { title, excerpt, content, field, locale = 'en' } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const model = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

        const localeNames: Record<string, string> = {
            es: 'Spanish',
            en: 'English',
            fr: 'French',
            pt: 'Portuguese',
        };
        const localeName = localeNames[locale as string] || 'English';

        let prompt = '';

        if (field === 'title') {
            prompt = `Generate an SEO-optimized meta title in ${localeName} for this blog post.

RULES:
- Must be between 50-60 characters (STRICT LIMIT)
- Make it compelling and click-worthy
- Include key topic words
- Do NOT include the site name suffix

Original title: ${title}
${excerpt ? `Summary: ${excerpt}` : ''}

Return ONLY the optimized title, nothing else.`;
        } else if (field === 'description') {
            prompt = `Generate an SEO-optimized meta description in ${localeName} for this blog post.

RULES:
- Must be between 100-150 characters (STRICT LIMIT)
- Make it compelling with a clear value proposition
- Include a call to action when appropriate
- Summarize the main benefit to readers

Title: ${title}
${excerpt ? `Excerpt: ${excerpt}` : ''}
${content ? `Content preview: ${content.slice(0, 500)}` : ''}

Return ONLY the optimized description, nothing else.`;
        } else {
            return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
        }

        const { text } = await generateText({
            model: openrouter(model),
            prompt,
        });

        const result = text.trim();

        return NextResponse.json({
            result,
            length: result.length,
            field,
        });
    } catch (error) {
        console.error('[SEO] Error:', error);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}
