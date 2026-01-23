import { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
    slug: 'blog_media',
    upload: {
        mimeTypes: ['image/*'],
        // Storage handled by s3Storage plugin (Cloudflare R2)
    },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            localized: true,
            admin: {
                description: 'Texto alternativo para accesibilidad y SEO',
            },
        },
    ],
};
