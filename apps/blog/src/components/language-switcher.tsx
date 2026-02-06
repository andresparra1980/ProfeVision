'use client';

import { Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@profevision/ui/dropdown-menu';
import { Button } from '@profevision/ui/button';

interface LanguageSwitcherProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

function LanguageSwitcherInner({
    variant = 'outline',
    size = 'sm',
}: LanguageSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('common');

    const handleLocaleChange = (newLocale: string) => {
        // Set cookie for locale persistence
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        // Get current path without locale prefix
        let currentPath = pathname;
        for (const loc of locales) {
            if (pathname === `/${loc}`) {
                currentPath = '/';
                break;
            } else if (pathname.startsWith(`/${loc}/`)) {
                currentPath = pathname.replace(new RegExp(`^/${loc}`), '');
                break;
            }
        }

        // Build new path with new locale prefix
        const finalPath = currentPath === '/' ? `/${newLocale}` : `/${newLocale}${currentPath}`;
        router.push(finalPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className="gap-2"
                    aria-label={t('language')}
                >
                    <Languages className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[3000]">
                {locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className="cursor-pointer"
                    >
                        {localeNames[loc]}
                        {loc === locale && <span className="ml-2 text-xs">✓</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
    return (
        <Suspense fallback={
            <Button
                variant={props.variant || 'outline'}
                size={props.size || 'sm'}
                className="gap-2"
                aria-label="Language"
            >
                <Languages className="h-4 w-4" />
            </Button>
        }>
            <LanguageSwitcherInner {...props} />
        </Suspense>
    );
}
