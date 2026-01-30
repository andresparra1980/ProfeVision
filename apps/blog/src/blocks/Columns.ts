import type { Block } from 'payload';
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical';

export const ColumnsBlock: Block = {
    slug: 'columns',
    imageURL: '/blocks/columns.svg',
    interfaceName: 'ColumnsBlock',
    fields: [
        {
            name: 'columns',
            type: 'array',
            minRows: 2,
            maxRows: 4,
            labels: {
                singular: 'Columna',
                plural: 'Columnas',
            },
            fields: [
                {
                    name: 'width',
                    type: 'select',
                    defaultValue: 'equal',
                    options: [
                        { label: 'Igual', value: 'equal' },
                        { label: '1/3 - 2/3', value: 'oneThird' },
                        { label: '2/3 - 1/3', value: 'twoThirds' },
                        { label: '1/4 - 3/4', value: 'oneQuarter' },
                        { label: '3/4 - 1/4', value: 'threeQuarters' },
                    ],
                    admin: {
                        description: 'Ancho de esta columna (solo visible en desktop)',
                    },
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
            ],
        },
        {
            name: 'gap',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { label: 'Sin espacio', value: 'none' },
                { label: 'Pequeño', value: 'small' },
                { label: 'Medio', value: 'medium' },
                { label: 'Grande', value: 'large' },
            ],
        },
        {
            name: 'verticalAlign',
            type: 'select',
            defaultValue: 'top',
            options: [
                { label: 'Arriba', value: 'top' },
                { label: 'Centro', value: 'center' },
                { label: 'Abajo', value: 'bottom' },
            ],
        },
    ],
};
