'use client';

import { useState } from 'react';

interface PreviewBannerProps {
    locale: string;
}

export function PreviewBanner({ locale }: PreviewBannerProps) {
    const [isExiting, setIsExiting] = useState(false);

    const exitText = locale === 'es' ? 'Salir de vista previa' :
        locale === 'en' ? 'Exit preview' :
            locale === 'fr' ? 'Quitter l\'aperçu' :
                'Sair da pré-visualização';

    const handleExit = async () => {
        setIsExiting(true);
        try {
            const response = await fetch('/api/preview/exit', { method: 'POST' });
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to exit preview mode:', error);
        } finally {
            setIsExiting(false);
        }
    };

    return (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span className="font-medium">
                        {locale === 'es' ? 'Modo Vista Previa' :
                            locale === 'en' ? 'Preview Mode' :
                                locale === 'fr' ? 'Mode Aperçu' :
                                    'Modo Pré-visualização'}
                    </span>
                    <span className="text-sm opacity-75">
                        {locale === 'es' ? '- Este post puede no estar publicado' :
                            locale === 'en' ? '- This post may not be published' :
                                locale === 'fr' ? '- Ce post peut ne pas être publié' :
                                    '- Este post pode não estar publicado'}
                    </span>
                </div>
                <button
                    onClick={handleExit}
                    disabled={isExiting}
                    className="px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded transition-colors disabled:opacity-50"
                >
                    {isExiting ? '...' : exitText}
                </button>
            </div>
        </div>
    );
}
