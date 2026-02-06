import type { CollectionBeforeChangeHook } from 'payload';

export const populateMetaImageHook: CollectionBeforeChangeHook = async ({
    data,
}) => {
    // Check if meta.image is already populated
    const hasMetaImage = data.meta?.image && 
        (typeof data.meta.image === 'object' || typeof data.meta.image === 'string');
    
    if (hasMetaImage) return data;

    // Determine which image to use
    let imageId = null;
    let imageUrl = null;

    // Priority 1: featuredImage
    if (data.featuredImage) {
        if (typeof data.featuredImage === 'object' && data.featuredImage.id) {
            imageId = data.featuredImage.id;
        } else if (typeof data.featuredImage === 'string') {
            imageId = data.featuredImage;
        }
    }

    // If no featuredImage, use default logo URL
    if (!imageId) {
        imageUrl = 'https://assets.profevision.com/android-chrome-512x512.png';
    }

    // Update the data object with meta.image
    // This modifies the data before it's saved, so no additional DB call needed
    data.meta = {
        ...(data.meta || {}),
        image: imageId || imageUrl,
    };

    console.log(`[populateMetaImage] Will set meta.image for post`);

    return data;
};
