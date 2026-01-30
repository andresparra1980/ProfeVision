import type { Block } from 'payload';

export const SpacerBlock: Block = {
    slug: 'spacer',
    imageURL: '/blocks/spacer.svg',
    interfaceName: 'SpacerBlock',
    fields: [
        {
            name: 'height',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { label: 'Extra pequeño (16px)', value: 'xs' },
                { label: 'Pequeño (24px)', value: 'small' },
                { label: 'Medio (40px)', value: 'medium' },
                { label: 'Grande (64px)', value: 'large' },
                { label: 'Extra grande (96px)', value: 'xlarge' },
            ],
        },
    ],
};
