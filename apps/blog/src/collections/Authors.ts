import { CollectionConfig } from 'payload';

export const Authors: CollectionConfig = {
    slug: 'blog_authors',
    auth: true, // Enable auth for Payload admin
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'supabaseUserId',
            type: 'text',
            unique: true,
            admin: {
                description: 'ID del usuario en Supabase (profesores.id)',
                position: 'sidebar',
            },
        },
        {
            name: 'bio',
            type: 'textarea',
            localized: true,
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'blog_media',
        },
        {
            name: 'role',
            type: 'select',
            defaultValue: 'editor',
            options: [
                { label: 'Editor', value: 'editor' },
                { label: 'Admin', value: 'admin' },
            ],
            admin: {
                position: 'sidebar',
            },
        },
    ],
};
