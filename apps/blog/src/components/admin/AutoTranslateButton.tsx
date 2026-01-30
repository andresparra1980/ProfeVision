'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { useCallback, useState } from 'react';

export const AutoTranslateButton: React.FC = () => {
    const { id } = useDocumentInfo();
    const [isTranslating, setIsTranslating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    // Get field values from form
    const name = useFormFields(([fields]) => fields?.name?.value as string);
    const description = useFormFields(([fields]) => fields?.description?.value as string);
    const currentSlug = useFormFields(([fields]) => fields?.slug?.value as string);
    const autoTranslationProcessed = useFormFields(([fields]) => fields?.autoTranslationProcessed?.value as boolean);

    const runTranslation = useCallback(async () => {
        if (!id || !name) {
            setMessage('La categoría necesita un nombre para traducir');
            setIsError(true);
            return;
        }

        setIsTranslating(true);
        setMessage(null);
        setIsError(false);

        try {
            const response = await fetch('/api/translate-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: id,
                    name,
                    description: description || '',
                    currentSlug: currentSlug || '',
                    sourceLocale: 'es',
                }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            setMessage(`Traducción completada. Slug: "${result.slug}"`);
            setIsError(false);
            
            // Reload page after 2 seconds to show updated state
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('[AutoTranslateButton] Error:', error);
            setMessage('Error al traducir. Revisa la consola.');
            setIsError(true);
        } finally {
            setIsTranslating(false);
        }
    }, [id, name, description, currentSlug]);

    // Don't show for new documents
    if (!id) {
        return null;
    }

    // If already translated, show status only
    if (autoTranslationProcessed) {
        return (
            <div style={{ 
                marginTop: '16px', 
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '4px',
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#166534',
                    fontSize: '14px',
                    fontWeight: 500,
                }}>
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Traducción automática completada
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#15803d', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    Esta categoría ha sido traducida a todos los idiomas y tiene slug en inglés.
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '4px',
                marginBottom: '12px',
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#92400e',
                    fontSize: '14px',
                    fontWeight: 500,
                }}>
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Traducción pendiente
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#a16207', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    Esta categoría necesita ser traducida a todos los idiomas y generar slug en inglés.
                </p>
            </div>

            <button
                type="button"
                onClick={runTranslation}
                disabled={isTranslating}
                style={{
                    padding: '8px 16px',
                    backgroundColor: isTranslating ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isTranslating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    width: '100%',
                    justifyContent: 'center',
                }}
            >
                {isTranslating ? (
                    <>
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{ animation: 'spin 1s linear infinite' }}
                        >
                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                        Traduciendo...
                    </>
                ) : (
                    <>
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                        Traducir categoría ahora
                    </>
                )}
            </button>

            {message && (
                <p style={{ 
                    fontSize: '13px', 
                    color: isError ? '#dc2626' : '#16a34a', 
                    marginTop: '8px',
                    fontWeight: 500,
                }}>
                    {message}
                </p>
            )}

            <p style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '8px',
                fontStyle: 'italic'
            }}>
                Este proceso traducirá el nombre y descripción a: Español, Inglés, Francés y Portugués. El slug siempre será en inglés.
            </p>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
