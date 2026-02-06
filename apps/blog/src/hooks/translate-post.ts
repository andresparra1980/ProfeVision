import type { CollectionAfterChangeHook } from 'payload';

export const translatePostHook: CollectionAfterChangeHook = async ({
    doc,
    previousDoc,
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

    // On update, check if content or SEO fields changed
    if (operation === 'update' && previousDoc) {
        const titleChanged = doc.title !== previousDoc.title;
        const excerptChanged = doc.excerpt !== previousDoc.excerpt;
        const contentChanged = JSON.stringify(doc.content) !== JSON.stringify(previousDoc.content);
        const keywordsChanged = doc.meta?.keywords !== previousDoc.meta?.keywords;
        const metaTitleChanged = doc.meta?.title !== previousDoc.meta?.title;
        const metaDescriptionChanged = doc.meta?.description !== previousDoc.meta?.description;

        // If only slug or other non-content fields changed, skip translation
        if (!titleChanged && !excerptChanged && !contentChanged && !keywordsChanged && !metaTitleChanged && !metaDescriptionChanged) {
            return doc;
        }
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002';

    // Fire and forget - run in background
    setImmediate(async () => {
        try {
            const response = await fetch(`${serverUrl}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: doc.id,
                    title: doc.title,
                    excerpt: doc.excerpt || '',
                    content: doc.content || null,
                    keywords: doc.meta?.keywords || '',
                    metaTitle: doc.meta?.title || '',
                    metaDescription: doc.meta?.description || '',
                    sourceLocale: 'es',
                }),
            });

            if (!response.ok) {
                console.error('[Translation] API error:', response.statusText);
                return;
            }
        } catch (error) {
            console.error('[Translation] Background error:', error);
        }
    });

    return doc;
};
