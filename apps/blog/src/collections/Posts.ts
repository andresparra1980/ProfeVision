import { CollectionConfig } from 'payload';
import { translatePostHook } from '../hooks/translate-post';

export const Posts: CollectionConfig = {
    slug: 'blog_posts',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
    },
    access: {
        read: ({ req }) => {
            if (req.user) return true;
            return { status: { equals: 'published' } };
        },
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                position: 'sidebar',
                description: 'Slug en inglés para URLs. Usa el botón para generar con IA.',
                components: {
                    Field: '/components/admin/SlugField#SlugField',
                },
            },
        },
        {
            name: 'content',
            type: 'richText',
            localized: true,
        },
        {
            name: 'excerpt',
            type: 'textarea',
            localized: true,
            admin: {
                description: 'Breve resumen para SEO y tarjetas de vista previa',
            },
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'blog_media',
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'blog_categories',
        },
        {
            name: 'author',
            type: 'relationship',
            relationTo: 'blog_authors',
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Borrador', value: 'draft' },
                { label: 'Publicado', value: 'published' },
            ],
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'autoTranslate',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                position: 'sidebar',
                description: 'Traducir automáticamente al guardar contenido',
            },
        },
    ],
    hooks: {
        afterChange: [translatePostHook],
    },
};
