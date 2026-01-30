import type { Block } from 'payload';
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical';

export const HeroBlock: Block = {
    slug: 'hero',
    interfaceName: 'HeroBlock',
    fields: [
        {
            name: 'media',
            type: 'upload',
            relationTo: 'blog_media',
            required: true,
            admin: {
                description: 'Imagen de fondo del hero',
            },
        },
        {
            name: 'heading',
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
            name: 'alignment',
            type: 'select',
            defaultValue: 'center',
            options: [
                { label: 'Izquierda', value: 'left' },
                { label: 'Centro', value: 'center' },
                { label: 'Derecha', value: 'right' },
            ],
        },
        {
            name: 'overlayOpacity',
            type: 'select',
            defaultValue: '50',
            options: [
                { label: 'Sin overlay', value: '0' },
                { label: '20%', value: '20' },
                { label: '40%', value: '40' },
                { label: '50%', value: '50' },
                { label: '60%', value: '60' },
                { label: '80%', value: '80' },
            ],
            admin: {
                description: 'Opacidad del overlay oscuro sobre la imagen',
            },
        },
        {
            name: 'height',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { label: 'Pequeño (300px)', value: 'small' },
                { label: 'Medio (500px)', value: 'medium' },
                { label: 'Grande (700px)', value: 'large' },
                { label: 'Pantalla completa', value: 'fullscreen' },
            ],
        },
    ],
};
