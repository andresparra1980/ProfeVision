import type { Block } from 'payload';
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical';

export const CardBlock: Block = {
    slug: 'card',
    interfaceName: 'CardBlock',
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
        },
        {
            name: 'content',
            type: 'richText',
            editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                ],
            }),
            localized: true,
        },
        {
            name: 'media',
            type: 'upload',
            relationTo: 'blog_media',
            admin: {
                description: 'Imagen opcional para el card',
            },
        },
        {
            name: 'variant',
            type: 'select',
            defaultValue: 'default',
            options: [
                { label: 'Default', value: 'default' },
                { label: 'Outline', value: 'outline' },
                { label: 'Filled', value: 'filled' },
                { label: 'Elevated', value: 'elevated' },
            ],
        },
    ],
};
