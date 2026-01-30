import type { Block } from 'payload';

export const CodeBlock: Block = {
    slug: 'code',
    imageURL: '/blocks/code.svg',
    interfaceName: 'CodeBlock',
    fields: [
        {
            name: 'code',
            type: 'code',
            required: true,
            localized: true,
            admin: {
                language: 'typescript',
            },
        },
        {
            name: 'language',
            type: 'select',
            defaultValue: 'typescript',
            options: [
                { label: 'TypeScript', value: 'typescript' },
                { label: 'JavaScript', value: 'javascript' },
                { label: 'Python', value: 'python' },
                { label: 'Java', value: 'java' },
                { label: 'CSS', value: 'css' },
                { label: 'HTML', value: 'html' },
                { label: 'JSON', value: 'json' },
                { label: 'SQL', value: 'sql' },
                { label: 'Bash/Shell', value: 'bash' },
                { label: 'Markdown', value: 'markdown' },
                { label: 'YAML', value: 'yaml' },
                { label: 'Rust', value: 'rust' },
                { label: 'Go', value: 'go' },
                { label: 'PHP', value: 'php' },
                { label: 'Ruby', value: 'ruby' },
            ],
        },
        {
            name: 'showLineNumbers',
            type: 'checkbox',
            defaultValue: true,
            label: 'Mostrar números de línea',
        },
        {
            name: 'filename',
            type: 'text',
            label: 'Nombre de archivo',
            admin: {
                description: 'Ejemplo: config.ts',
            },
        },
        {
            name: 'highlightLines',
            type: 'text',
            label: 'Resaltar líneas',
            admin: {
                description: 'Ejemplo: 1,3,5-7 (líneas 1, 3 y 5 a 7)',
            },
        },
    ],
};
