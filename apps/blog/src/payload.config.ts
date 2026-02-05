import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor, FixedToolbarFeature, BlocksFeature, EXPERIMENTAL_TableFeature, UploadFeature, LinkFeature, RelationshipFeature } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { fileURLToPath } from 'url';

import { Posts } from './collections/Posts';
import { Categories } from './collections/Categories';
import { Authors } from './collections/Authors';
import { Media } from './collections/Media';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002',

    db: postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URL || '' },
    }),

    editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures,
            // Fixed toolbar for better UX
            FixedToolbarFeature(),
            // Upload feature for media
            UploadFeature({
                collections: {
                    blog_media: {
                        fields: [
                            {
                                name: 'alt',
                                type: 'text',
                                label: 'Alt Text',
                            },
                            {
                                name: 'caption',
                                type: 'text',
                                label: 'Caption',
                            },
                        ],
                    },
                },
            }),
            // Enhanced link feature
            LinkFeature({
                enabledCollections: ['blog_posts', 'blog_categories', 'blog_authors'],
                maxDepth: 2,
            }),
            // Relationship feature
            RelationshipFeature({
                enabledCollections: ['blog_posts', 'blog_categories', 'blog_authors'],
                maxDepth: 2,
            }),
            // Table feature (experimental)
            EXPERIMENTAL_TableFeature(),
        ],
    }),

    collections: [Posts, Categories, Authors, Media],

    localization: {
        locales: [
            { code: 'es', label: 'Español' },
            { code: 'en', label: 'English' },
            { code: 'fr', label: 'Français' },
            { code: 'pt', label: 'Português' },
        ],
        defaultLocale: 'es',
        fallback: true,
    },

    admin: {
        user: 'blog_authors',
        suppressHydrationWarning: true,
        components: {
            actions: ['@/components/admin/ModeToggle#ModeToggle'],
        },
    },

    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },

    plugins: [
        // Cloudflare R2 Storage (S3 compatible)
        s3Storage({
            collections: {
                blog_media: {
                    prefix: 'blog/',
                    generateFileURL: ({ filename, prefix }) => {
                        return `${process.env.R2_PUBLIC_URL}/${prefix}${filename}`;
                    },
                },
            },
            bucket: process.env.R2_BUCKET_NAME || '',
            config: {
                endpoint: process.env.R2_ENDPOINT,
                region: 'auto',
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
                },
            },
            acl: 'public-read',
        }),

        // SEO plugin
        seoPlugin({
            collections: ['blog_posts'],
            generateTitle: ({ doc }) => `${doc.title} | ProfeVision Blog`,
            generateDescription: ({ doc }) => doc.excerpt,
            generateURL: ({ doc, collectionSlug }) => {
                const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://profevision.com';
                return `${baseUrl}/${collectionSlug}/${doc.slug}`;
            },
            generateImage: ({ doc }) => {
                // Use featuredImage if available, otherwise use default ProfeVision logo
                const featuredImage = doc.featuredImage;
                if (featuredImage && typeof featuredImage === 'object' && featuredImage.url) {
                    return featuredImage.url;
                }
                return 'https://assets.profevision.com/android-chrome-512x512.png';
            },
        }),
    ],

    secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',
});
