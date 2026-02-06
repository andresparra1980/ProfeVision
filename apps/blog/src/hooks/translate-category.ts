import type { CollectionAfterChangeHook } from 'payload';

export const translateCategoryHook: CollectionAfterChangeHook = async ({
    doc,
    previousDoc,
    operation,
    req,
}) => {
    // Only translate on create or update
    if (!['create', 'update'].includes(operation)) return doc;

    // Skip if no name (required field)
    if (!doc.name) return doc;

    // Skip if this was an auto-translation update
    if (doc.autoTranslationProcessed === true) {
        return doc;
    }

    // On update, check if only slug changed (don't retranslate)
    if (operation === 'update' && previousDoc) {
        const nameChanged = doc.name !== previousDoc.name;

        if (!nameChanged) {
            console.log('[Category Translation] Skipping - no name change detected');
            return doc;
        }
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002';

    // Fire and forget - run in background
    setImmediate(async () => {
        try {
            console.log(`[Category Translation] Starting background translation for category ${doc.id}`);

            const response = await fetch(`${serverUrl}/api/translate-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: doc.id,
                    name: doc.name,
                    description: doc.description || '',
                    currentSlug: doc.slug || '',
                    sourceLocale: req.locale || 'es',
                }),
            });

            if (!response.ok) {
                console.error('[Category Translation] API error:', response.statusText);
                return;
            }

            console.log(`[Category Translation] Completed for category ${doc.id}`);
        } catch (error) {
            console.error('[Category Translation] Background error:', error);
        }
    });

    return doc;
};
