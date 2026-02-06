import type { CollectionAfterChangeHook } from 'payload';

// Track in-flight processing to prevent duplicates
const processingIds = new Set<string | number>();

export const translateMediaHook: CollectionAfterChangeHook = async ({
    doc,
    previousDoc,
    operation,
    req,
}) => {
    // Only process on create or update
    if (!['create', 'update'].includes(operation)) return doc;

    // Skip if no image URL
    if (!doc.url) return doc;

    // Skip if already processed
    if (doc.altTextProcessed === true) {
        return doc;
    }

    // Skip if currently processing (check both document flag and in-memory set)
    if (doc.altTextProcessing === true) {
        return doc;
    }

    // Check in-memory set to prevent race conditions
    if (processingIds.has(doc.id)) {
        return doc;
    }

        // On update, skip if only alt, altTextProcessed, or altTextProcessing changed (avoid loop from endpoint)
    if (operation === 'update' && previousDoc) {
        const altChanged = JSON.stringify(doc.alt) !== JSON.stringify(previousDoc.alt);
        const processedFlagChanged = doc.altTextProcessed !== previousDoc.altTextProcessed;
        const processingFlagChanged = doc.altTextProcessing !== previousDoc.altTextProcessing;
        
        if (altChanged || processedFlagChanged || processingFlagChanged) {
            return doc;
        }
    }

    // Add to in-flight set immediately
    processingIds.add(doc.id);

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002';

    // Fire and forget - run in background with delay to ensure doc and image are saved
    setTimeout(async () => {
        try {
            // Wait for document to be fully saved
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mark as processing
            try {
                await req.payload.update({
                    collection: 'blog_media',
                    id: doc.id,
                    data: {
                        altTextProcessing: true,
                    },
                });
            } catch {
                // Continue anyway to try generating alt
            }
            
            // Wait longer to ensure image upload to S3 is complete
            await new Promise(resolve => setTimeout(resolve, 3000));

            const response = await fetch(`${serverUrl}/api/blog_media/sync-alt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: doc.id,
                }),
            });

            if (!response.ok) {
                console.error('[Media Translation] API error:', response.statusText);
                return;
            }
        } catch (error) {
            console.error('[Media Translation] Background error:', error);
        } finally {
            // Clean up in-flight set
            processingIds.delete(doc.id);
        }
    }, 100);

    return doc;
};
