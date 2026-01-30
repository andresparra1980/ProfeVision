import type { Block } from 'payload';
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical';

export const ContainerBlock: Block = {
    slug: 'container',
    imageURL: '/blocks/container.svg',
    interfaceName: 'ContainerBlock',
    fields: [
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
            name: 'backgroundColor',
            type: 'select',
            defaultValue: 'white',
            options: [
                { label: 'Blanco', value: 'white' },
                { label: 'Gris claro', value: 'gray100' },
                { label: 'Gris medio', value: 'gray200' },
                { label: 'Primario', value: 'primary' },
                { label: 'Secundario', value: 'secondary' },
                { label: 'Acento', value: 'accent' },
                { label: 'Oscuro', value: 'dark' },
            ],
        },
        {
            name: 'padding',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { label: 'Sin padding', value: 'none' },
                { label: 'Pequeño', value: 'small' },
                { label: 'Medio', value: 'medium' },
                { label: 'Grande', value: 'large' },
                { label: 'Extra grande', value: 'xlarge' },
            ],
        },
        {
            name: 'borderRadius',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { label: 'Sin borde redondeado', value: 'none' },
                { label: 'Pequeño', value: 'small' },
                { label: 'Medio', value: 'medium' },
                { label: 'Grande', value: 'large' },
            ],
        },
        {
            name: 'border',
            type: 'checkbox',
            defaultValue: false,
            label: 'Mostrar borde',
        },
        {
            name: 'maxWidth',
            type: 'select',
            defaultValue: 'default',
            options: [
                { label: 'Default (ancho completo)', value: 'default' },
                { label: 'Narrow (800px)', value: 'narrow' },
                { label: 'Medium (1000px)', value: 'medium' },
            ],
        },
    ],
};
