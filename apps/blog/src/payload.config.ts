import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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

    editor: lexicalEditor(),

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
            // Public URL will be constructed as: R2_PUBLIC_URL + /blog/filename
            acl: 'public-read',
        }),

        // SEO plugin
        seoPlugin({
            collections: ['blog_posts'],
            generateTitle: ({ doc }) => `${doc.title} | ProfeVision Blog`,
            generateDescription: ({ doc }) => doc.excerpt,
        }),
    ],

    secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',
});
