import type { Config } from 'tailwindcss';
import sharedPreset from '@profevision/styles/tailwind-preset';

const config: Config = {
    presets: [sharedPreset as Config],
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    ],
};

export default config;
