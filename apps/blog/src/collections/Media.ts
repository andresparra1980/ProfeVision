import { CollectionConfig } from 'payload';
import { BlogMedia as MediaType } from '../payload-types';
import { translateMediaHook } from '../hooks/translate-media';
import { convertToWebPHook } from '../hooks/convert-to-webp';
import crypto from 'crypto';

// Valid image extensions
const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico'];

// Generate a consistent 16-character hash filename
function generateHashFilename(originalFilename: string): string {
    // Check if it looks like a URL (contains :// or starts with http)
    const isUrl = originalFilename.includes('://') || originalFilename.startsWith('http');
    
    let ext: string;
    let hashInput: string;
    
    if (isUrl) {
        // For URLs, extract extension from the path part only (before ?)
        const urlParts = originalFilename.split('?');
        const urlWithoutParams = urlParts[0];
        
        // Try to find a valid extension at the end of the path
        const pathMatch = urlWithoutParams.match(/\.([a-zA-Z0-9]{2,5})$/);
        const potentialExt = pathMatch ? pathMatch[1].toLowerCase() : null;
        
        // Check if it's a valid image extension
        if (potentialExt && VALID_EXTENSIONS.includes(potentialExt)) {
            ext = potentialExt;
        } else {
            ext = 'jpg'; // Default for URLs without valid extension
        }
        
        // Use only the base URL (before ?) for hash consistency
        hashInput = urlWithoutParams;
    } else {
        // For regular files
        const parts = originalFilename.split('.');
        const potentialExt = parts.length > 1 ? parts.pop()?.toLowerCase() : null;
        ext = potentialExt && VALID_EXTENSIONS.includes(potentialExt) ? potentialExt : 'jpg';
        
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        hashInput = `${timestamp}-${random}-${originalFilename}`;
    }
    
    // Create 16-character hash
    const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 16);
    
    return `${hash}.${ext}`;
}

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// LLM Model - using a vision-capable model
const VISION_MODEL = 'google/gemini-2.0-flash-001';

async function verifyImageAccessible(imageUrl: string, maxRetries = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Add cache-busting parameter
            const urlWithCache = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
            const response = await fetch(urlWithCache, { method: 'HEAD' });
            if (response.ok) {
                return true;
            }
        } catch {
            console.log(`[Image Verification] Attempt ${i + 1} failed, retrying...`);
        }
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}

async function generateAltText(imageUrl: string, filename: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Verify image is accessible before sending to LLM
    const isAccessible = await verifyImageAccessible(imageUrl);
    if (!isAccessible) {
        throw new Error(`Image not accessible at URL: ${imageUrl}`);
    }

    // Add cache-busting to prevent stale images
    const imageUrlWithCache = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

    const prompt = `You are an expert SEO specialist and accessibility consultant. Analyze this image and create an optimized alt text.

CONTEXT:
- Filename: ${filename}
- Purpose: Educational/professional blog content
- Target audience: Spanish and Latin American educators and professionals

REQUIREMENTS FOR ALT TEXT:
1. Language: MUST be in English only
2. Length: 10-125 characters (optimal SEO range)
3. Content: Describe the image accurately and concisely
4. SEO optimization: Include relevant keywords naturally if applicable
5. Accessibility: Make it meaningful for screen readers
6. Tone: Professional and educational

WHAT TO INCLUDE:
- Main subject or action in the image
- Key visual elements (if relevant to context)
- Text content visible in the image (if any)
- Purpose/function of what's shown

WHAT TO AVOID:
- Starting with "Image of..." or "Picture of..."
- Redundant phrases like "A photo showing..."
- Excessive detail or flowery language
- Language other than English
- Generic descriptions like "educational image"

OUTPUT: Provide ONLY the alt text, nothing else. No quotes, no explanations.`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002',
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrlWithCache,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 150,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const altText = data.choices?.[0]?.message?.content?.trim();

    if (!altText) {
        throw new Error('No alt text generated');
    }

    // Clean up the response - remove quotes if present
    return altText.replace(/^["']|["']$/g, '').trim();
}

function isEnglish(text: string): boolean {
    // Simple heuristic: check if text contains mostly English characters
    // and common English words
    const englishPattern = /^[a-zA-Z0-9\s.,!?'"-]+$/;
    const commonEnglishWords = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'is', 'are', 'was', 'were'];
    
    if (!englishPattern.test(text)) {
        return false;
    }
    
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => commonEnglishWords.includes(word)).length;
    
    // If it has at least one common English word or is very short
    return englishWordCount > 0 || text.length < 20;
}

export const Media: CollectionConfig = {
    slug: 'blog_media',
    upload: {
        mimeTypes: ['image/*'],
    },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    admin: {
        useAsTitle: 'filename',
        defaultColumns: ['filename', 'alt', 'altTextProcessed', 'updatedAt'],
    },
    hooks: {
        beforeOperation: [
            async ({ args, operation }) => {
                try {
                    // Only process on create
                    if (operation !== 'create') return;
                    
                    const { data, req } = args;
                    
                    // Case 1: File upload (local file or URL being treated as file)
                    if (req?.file && req.file.name) {
                        const originalName = req.file.name;
                        const newFilename = generateHashFilename(originalName);
                        console.log(`[Media Upload] Renaming ${originalName.substring(0, 50)}... -> ${newFilename}`);
                        req.file.name = newFilename;
                        if (data) data.filename = newFilename;
                        return;
                    }
                    
                    // Case 2: URL upload (external image) - backup check
                    if (data?.url && typeof data.url === 'string' && !data.filename) {
                        const url = data.url;
                        const newFilename = generateHashFilename(url);
                        console.log(`[Media Upload] Setting hash filename for URL: ${newFilename}`);
                        data.filename = newFilename;
                    }
                } catch (error) {
                    console.error('[Media Upload] Error in beforeOperation hook:', error);
                }
            }
        ],
        beforeChange: [convertToWebPHook],
        afterChange: [translateMediaHook],
    },
    endpoints: [
        {
            path: '/sync-alt',
            method: 'post',
            handler: async (req) => {
                // Parse body manually for Payload v3
                let body: { id?: string } = {};
                try {
                    try {
                        // Try to parse JSON body
                        const clonedReq = req.clone ? req.clone() : req;
                        body = await clonedReq.json?.() || {};
                    } catch {
                        // Fallback to req.body if available and is an object
                        if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
                            body = req.body as { id?: string };
                        }
                    }
                    
                    console.log('[sync-alt endpoint] Received body:', body);
                    
                    const { id } = body;

                    if (!id) {
                        return Response.json(
                            { error: 'Media ID is required', received: body },
                            { status: 400 }
                        );
                    }

                    // Fetch the media document
                    const media = await req.payload.findByID({
                        collection: 'blog_media',
                        id,
                    }) as MediaType;

                    if (!media) {
                        return Response.json(
                            { error: 'Media not found' },
                            { status: 404 }
                        );
                    }

                    // Get the image URL
                    const imageUrl = media.url || '';
                    if (!imageUrl) {
                        return Response.json(
                            { error: 'Media has no URL' },
                            { status: 400 }
                        );
                    }

                    // Check alt text in all locales
                    const locales = ['es', 'en', 'fr', 'pt'];
                    const currentAlt = (media.alt || {}) as Record<string, string>;
                    let needsGeneration = false;

                    // Check if any locale is missing alt or has non-English alt
                    for (const locale of locales) {
                        const altValue = currentAlt[locale];
                        if (!altValue || !isEnglish(altValue)) {
                            needsGeneration = true;
                            break;
                        }
                    }

                    if (!needsGeneration) {
                        return Response.json({
                            success: true,
                            message: 'Alt text is already synchronized in all locales',
                            generated: false,
                        });
                    }

                    // Generate new alt text using LLM
                    const generatedAlt = await generateAltText(imageUrl, media.filename || '');

                    // Update alt text in all locales - need to update each locale separately
                    for (const locale of locales) {
                        await req.payload.update({
                            collection: 'blog_media',
                            id,
                            locale: locale as 'es' | 'en' | 'fr' | 'pt',
                            data: {
                                alt: generatedAlt,
                            },
                        });
                    }

                    // Update the processed flag and clear processing flag
                    await req.payload.update({
                        collection: 'blog_media',
                        id,
                        data: {
                            altTextProcessed: true,
                            altTextProcessing: false,
                        },
                    });

                    return Response.json({
                        success: true,
                        message: 'Alt text synchronized successfully',
                        generated: true,
                        alt: generatedAlt,
                    });
                } catch (error) {
                    console.error('Error syncing alt text:', error);
                    
                    // Clear processing flag even on error
                    if (body.id) {
                        try {
                            await req.payload.update({
                                collection: 'blog_media',
                                id: body.id,
                                data: {
                                    altTextProcessing: false,
                                },
                            });
                        } catch (cleanupError) {
                            console.error('Failed to clear processing flag:', cleanupError);
                        }
                    }
                    
                    return Response.json(
                        { error: error instanceof Error ? error.message : 'Unknown error' },
                        { status: 500 }
                    );
                }
            },
        },
    ],
    fields: [
        {
            name: 'alt',
            type: 'text',
            localized: true,
            admin: {
                description: 'Texto alternativo para accesibilidad y SEO',
                components: {
                    Field: '@/components/admin/AltFieldWithRegenerate#AltFieldWithRegenerate',
                },
            },
        },
        {
            name: 'altTextProcessed',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                hidden: true,
            },
        },
        {
            name: 'altTextProcessing',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                hidden: true,
            },
        },
        {
            name: 'altTextStatus',
            type: 'ui',
            admin: {
                components: {
                    Field: '@/components/admin/MediaAltStatusButton#MediaAltStatusButton',
                },
            },
        },
    ],
};
