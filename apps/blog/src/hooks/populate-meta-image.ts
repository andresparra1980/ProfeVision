import type { CollectionAfterChangeHook } from 'payload';

export const populateMetaImageHook: CollectionAfterChangeHook = async ({
    doc,
    req,
    operation,
}) => {
    // Only run on create or update
    if (!['create', 'update'].includes(operation)) return doc;

    // Check if meta.image is empty
    const hasMetaImage = doc.meta?.image && 
        (typeof doc.meta.image === 'object' || typeof doc.meta.image === 'string');
    
    if (hasMetaImage) return doc;

    // Get the payload client
    const payload = req.payload;

    // Determine which image to use
    let imageId = null;
    let imageUrl = null;

    // Priority 1: featuredImage
    if (doc.featuredImage) {
        if (typeof doc.featuredImage === 'object' && doc.featuredImage.id) {
            imageId = doc.featuredImage.id;
        } else if (typeof doc.featuredImage === 'string') {
            imageId = doc.featuredImage;
        }
    }

    // If no featuredImage, use default logo URL
    if (!imageId) {
        imageUrl = 'https://assets.profevision.com/android-chrome-512x512.png';
    }

    try {
        // Update the document with meta.image
        const updateData: Record<string, unknown> = {
            meta: {
                ...(doc.meta || {}),
                image: imageId || imageUrl,
            },
        };

        await payload.update({
            collection: 'blog_posts',
            id: doc.id,
            locale: req.locale as 'es' | 'en' | 'fr' | 'pt',
            data: updateData,
            overrideAccess: true,
        });

        console.log(`[populateMetaImage] Updated post ${doc.id} with meta.image`);
    } catch (error) {
        console.error(`[populateMetaImage] Failed to update post ${doc.id}:`, error);
    }

    return doc;
};
