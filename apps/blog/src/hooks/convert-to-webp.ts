import type { CollectionBeforeChangeHook } from 'payload';
import sharp from 'sharp';

const shouldConvertToWebP = (mimeType: string): boolean => {
    const convertibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif'];
    return convertibleTypes.includes(mimeType);
};

export const convertToWebPHook: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    // Only process on create or update
    if (!['create', 'update'].includes(operation)) return data;

    // Check if there's a file being uploaded
    if (!req.file || !req.file.mimetype) {
        return data;
    }

    const mimeType = req.file.mimetype;

    // Skip if not an image or already WebP
    if (!mimeType.startsWith('image/') || mimeType === 'image/webp') {
        return data;
    }

    // Skip if not convertible
    if (!shouldConvertToWebP(mimeType)) {
        console.log(`[WebP Conversion] Skipping - mime type ${mimeType} not convertible`);
        return data;
    }

    console.log(`[WebP Conversion] Converting ${req.file.name} to WebP`);

    try {
        // Convert to WebP with Next.js optimized settings
        const webpBuffer = await sharp(req.file.data)
            .webp({
                quality: 80, // Good balance between quality and size
                effort: 4,   // Compression effort (0-6, higher = smaller file but slower)
                smartSubsample: true, // Better chroma subsampling
            })
            .toBuffer();

        // Generate new filename with .webp extension
        const originalName = req.file.name;
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        const webpFilename = `${baseName}.webp`;

        // Replace the file with WebP version
        req.file = {
            ...req.file,
            name: webpFilename,
            data: webpBuffer,
            mimetype: 'image/webp',
            size: webpBuffer.length,
        };

        // Update data fields
        data.filename = webpFilename;
        data.mimeType = 'image/webp';
        data.filesize = webpBuffer.length;

        console.log(`[WebP Conversion] Completed: ${originalName} -> ${webpFilename}`);
        console.log(`[WebP Conversion] Size: ${req.file.size} bytes`);

    } catch (error) {
        console.error(`[WebP Conversion] Error converting to WebP:`, error);
        // Don't fail the upload if conversion fails
    }

    return data;
};
