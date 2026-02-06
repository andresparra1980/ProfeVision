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
        console.log(`[Media Translation] Skipping media ${doc.id} - already processing (flag)`);
        return doc;
    }

    // Check in-memory set to prevent race conditions
    if (processingIds.has(doc.id)) {
        console.log(`[Media Translation] Skipping media ${doc.id} - already in in-memory set`);
        return doc;
    }

    // On update, skip if only alt, altTextProcessed, or altTextProcessing changed (avoid loop from endpoint)
    if (operation === 'update' && previousDoc) {
        const altChanged = JSON.stringify(doc.alt) !== JSON.stringify(previousDoc.alt);
        const processedFlagChanged = doc.altTextProcessed !== previousDoc.altTextProcessed;
        const processingFlagChanged = doc.altTextProcessing !== previousDoc.altTextProcessing;
        
        if (altChanged || processedFlagChanged || processingFlagChanged) {
            console.log('[Media Translation] Skipping - change was from endpoint sync');
            return doc;
        }
    }

    // Add to in-flight set immediately
    processingIds.add(doc.id);
    console.log(`[Media Translation] Added media ${doc.id} to processing set`);

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
                console.log(`[Media Translation] Marked media ${doc.id} as processing`);
            } catch (e) {
                console.error('[Media Translation] Failed to mark as processing:', e);
                // Continue anyway to try generating alt
            }
            
            // Wait longer to ensure image upload to S3 is complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log(`[Media Translation] Starting background alt generation for media ${doc.id}`);

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

            const result = await response.json();
            console.log(`[Media Translation] Completed for media ${doc.id}:`, result.message);
        } catch (error) {
            console.error('[Media Translation] Background error:', error);
        } finally {
            // Clean up in-flight set
            processingIds.delete(doc.id);
            console.log(`[Media Translation] Removed media ${doc.id} from processing set`);
        }
    }, 100);

    return doc;
};
