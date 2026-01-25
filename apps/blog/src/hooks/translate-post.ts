import type { CollectionAfterChangeHook } from 'payload';

// Helper to extract text from Lexical content
function extractTextFromLexical(node: Record<string, unknown>): string {
    if (!node) return '';

    let text = '';

    // Handle text nodes
    if (node.type === 'text' && typeof node.text === 'string') {
        text += node.text;
    }

    // Handle paragraph/heading breaks
    if (['paragraph', 'heading'].includes(node.type as string)) {
        text += '\n';
    }

    // Recursively process children
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            text += extractTextFromLexical(child as Record<string, unknown>);
        }
    }

    // Handle root node
    if (node.root && typeof node.root === 'object') {
        text += extractTextFromLexical(node.root as Record<string, unknown>);
    }

    return text;
}

// Helper to replace text in Lexical nodes
function replaceTextInLexical(
    node: Record<string, unknown>,
    originalTexts: string[],
    translatedTexts: string[],
    index: { current: number }
): Record<string, unknown> {
    if (!node) return node;

    const newNode = { ...node };

    // Replace text in text nodes
    if (newNode.type === 'text' && typeof newNode.text === 'string') {
        if (index.current < translatedTexts.length) {
            newNode.text = translatedTexts[index.current];
            index.current++;
        }
    }

    // Recursively process children
    if (Array.isArray(newNode.children)) {
        newNode.children = newNode.children.map((child) =>
            replaceTextInLexical(child as Record<string, unknown>, originalTexts, translatedTexts, index)
        );
    }

    // Handle root node
    if (newNode.root && typeof newNode.root === 'object') {
        newNode.root = replaceTextInLexical(
            newNode.root as Record<string, unknown>,
            originalTexts,
            translatedTexts,
            index
        );
    }

    return newNode;
}

// Collect all text nodes from Lexical content
function collectTextNodes(node: Record<string, unknown>, texts: string[]): void {
    if (!node) return;

    if (node.type === 'text' && typeof node.text === 'string') {
        texts.push(node.text);
    }

    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            collectTextNodes(child as Record<string, unknown>, texts);
        }
    }

    if (node.root && typeof node.root === 'object') {
        collectTextNodes(node.root as Record<string, unknown>, texts);
    }
}

export const translatePostHook: CollectionAfterChangeHook = async ({
    doc,
    operation,
    req,
}) => {
    // Only translate on create or update when editing in Spanish
    if (!['create', 'update'].includes(operation)) return doc;
    if (req.locale !== 'es') return doc;

    // Check if autoTranslate is enabled
    if (doc.autoTranslate === false) return doc;

    // Skip if no title (required field)
    if (!doc.title) return doc;

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002';

    try {
        // Extract text content from Lexical for translation
        const contentText = doc.content ? extractTextFromLexical(doc.content as Record<string, unknown>) : '';

        // Call translation API
        const response = await fetch(`${serverUrl}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                postId: doc.id,
                title: doc.title,
                excerpt: doc.excerpt || '',
                content: contentText,
                sourceLocale: 'es',
            }),
        });

        if (!response.ok) {
            console.error('Translation API error:', response.statusText);
            return doc;
        }

        const { translations } = await response.json();

        // Update post with translations
        const payload = req.payload;

        for (const [locale, translation] of Object.entries(translations)) {
            const { title, excerpt } = translation as { title: string; excerpt: string; content: string };

            // For now, we'll update title and excerpt
            // Lexical content translation would need more complex handling
            await payload.update({
                collection: 'blog_posts',
                id: doc.id,
                locale: locale as 'en' | 'fr' | 'pt',
                data: {
                    title,
                    excerpt,
                    // Note: Content translation is complex due to Lexical structure
                    // We preserve the original structure for now
                },
            });

            console.log(`Post ${doc.id} translated to ${locale}`);
        }
    } catch (error) {
        console.error('Translation hook error:', error);
    }

    return doc;
};
