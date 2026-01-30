import { CollectionConfig } from 'payload';
import { translateCategoryHook } from '../hooks/translate-category';

export const Categories: CollectionConfig = {
    slug: 'blog_categories',
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    hooks: {
        afterChange: [translateCategoryHook],
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            localized: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'description',
            type: 'textarea',
            localized: true,
        },
        {
            name: 'autoTranslationProcessed',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                hidden: true,
            },
        },
        {
            name: 'autoTranslateAction',
            type: 'ui',
            admin: {
                components: {
                    Field: '@/components/admin/AutoTranslateButton#AutoTranslateButton',
                },
            },
        },
    ],
};
