import type { CollectionAfterChangeHook } from 'payload';

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

    // Fire and forget - don't await, run in background
    // This prevents blocking the save operation and avoids lock conflicts
    setImmediate(async () => {
        try {
            console.log(`[Translation] Starting background translation for post ${doc.id}`);

            const response = await fetch(`${serverUrl}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: doc.id,
                    title: doc.title,
                    excerpt: doc.excerpt || '',
                    content: '', // Skip content translation for now
                    sourceLocale: 'es',
                }),
            });

            if (!response.ok) {
                console.error('[Translation] API error:', response.statusText);
                return;
            }

            console.log(`[Translation] Completed for post ${doc.id}`);
        } catch (error) {
            console.error('[Translation] Background error:', error);
        }
    });

    return doc;
};
