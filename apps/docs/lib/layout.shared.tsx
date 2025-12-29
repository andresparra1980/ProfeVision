import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n: true,
    nav: {
      title: 'ProfeVision Docs',
      url: `/${locale}`,
    },
    links: [
      {
        text: 'ProfeVision',
        url: 'https://profevision.com',
        external: true,
      },
    ],
  };
}
