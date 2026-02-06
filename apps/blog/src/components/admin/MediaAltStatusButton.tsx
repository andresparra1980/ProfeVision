'use client';

import React, { useState, useEffect } from 'react';
import { useDocumentInfo, useFormFields } from '@payloadcms/ui';

export const MediaAltStatusButton: React.FC = () => {
    const { id } = useDocumentInfo();
    const [isSyncing, setIsSyncing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const [waitTime, setWaitTime] = useState(0);
    const [serverStatus, setServerStatus] = useState<{ processed?: boolean; processing?: boolean } | null>(null);

    // Get field values from form
    const altTextProcessed = useFormFields(([fields]) => fields?.altTextProcessed?.value as boolean);
    const altTextProcessing = useFormFields(([fields]) => fields?.altTextProcessing?.value as boolean);
    const alt = useFormFields(([fields]) => fields?.alt?.value as Record<string, string>);

    // Use server status if available, otherwise use form state
    const isProcessed = serverStatus?.processed ?? altTextProcessed;
    const isProcessing = serverStatus?.processing ?? altTextProcessing;

    // Detect if this is a newly created document (should auto-process)
    const isNewDocument = !isProcessed && !isProcessing && (!alt || Object.values(alt).every(v => !v));

    // Poll server for actual status
    useEffect(() => {
        if (!id) return;

        // Check server status every 3 seconds when waiting for auto-processing
        const checkServerStatus = async () => {
            try {
                const response = await fetch(`/api/blog_media/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setServerStatus({
                        processed: data.altTextProcessed,
                        processing: data.altTextProcessing,
                    });
                    
                    // If now processed, reload page to show updated state
                    if (data.altTextProcessed && !isProcessed) {
                        window.location.reload();
                    }
                }
            } catch (e) {
                console.error('Error checking server status:', e);
            }
        };

        if ((isProcessing && !isProcessed) || isNewDocument) {
            // Check immediately and then every 3 seconds
            checkServerStatus();
            const interval = setInterval(checkServerStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [id, isProcessing, isProcessed, isNewDocument]);

    // Count time for new document display
    useEffect(() => {
        if (isNewDocument) {
            const interval = setInterval(() => {
                setWaitTime(c => c + 1);
                setPollCount(c => c + 1);
                // Force reload after 60 seconds as fallback
                if (pollCount > 60) {
                    window.location.reload();
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isNewDocument, pollCount]);

    const runSync = async () => {
        if (!id) {
            setMessage('No se encontró el ID del documento');
            setIsError(true);
            return;
        }

        setIsSyncing(true);
        setMessage(null);
        setIsError(false);

        try {
            const response = await fetch('/api/blog_media/sync-alt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            setMessage(result.message);
            setIsError(false);
            
            // Reload page after 2 seconds to show updated state
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('[MediaAltStatusButton] Error:', error);
            setMessage('Error al sincronizar. Revisa la consola.');
            setIsError(true);
        } finally {
            setIsSyncing(false);
        }
    };

    // Don't show for new documents
    if (!id) {
        return null;
    }

    // If waiting for auto-processing to start (new document)
    if (isNewDocument && waitTime < 20) {
        return (
            <div style={{ 
                marginTop: '16px', 
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#dbeafe',
                border: '1px solid #60a5fa',
                borderRadius: '4px',
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#1e40af',
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
                        style={{ animation: 'spin 1s linear infinite' }}
                    >
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Preparando procesamiento automático...
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#1e3a8a', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    La imagen se está procesando automáticamente. Esto puede tomar 10-20 segundos.
                </p>
            </div>
        );
    }

    // If currently processing, show processing state
    if (isProcessing && !isProcessed) {
        return (
            <div style={{ 
                marginTop: '16px', 
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#dbeafe',
                border: '1px solid #60a5fa',
                borderRadius: '4px',
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#1e40af',
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
                        style={{ animation: 'spin 1s linear infinite' }}
                    >
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Generando alt text con IA...
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#1e3a8a', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    Esto puede tomar 10-20 segundos. La página se recargará automáticamente cuando termine.
                </p>
            </div>
        );
    }

    // If already processed, show status only
    if (isProcessed) {
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
                    Alt text sincronizado
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#15803d', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    El texto alternativo está disponible en todos los idiomas (inglés).
                </p>
            </div>
        );
    }

    // Check if alt exists in any locale
    const hasAltInAnyLocale = alt && Object.values(alt).some(value => value && value.trim() !== '');

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
                    {hasAltInAnyLocale ? 'Alt text pendiente de verificación' : 'Alt text pendiente'}
                </div>
                <p style={{ 
                    fontSize: '12px', 
                    color: '#a16207', 
                    marginTop: '4px',
                    marginLeft: '24px',
                }}>
                    {hasAltInAnyLocale 
                        ? 'El alt text necesita ser verificado y sincronizado en todos los idiomas.'
                        : 'Esta imagen necesita generar texto alternativo con IA.'}
                </p>
            </div>

            <button
                type="button"
                onClick={runSync}
                disabled={isSyncing}
                style={{
                    padding: '8px 16px',
                    backgroundColor: isSyncing ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSyncing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    width: '100%',
                    justifyContent: 'center',
                }}
            >
                {isSyncing ? (
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
                        Sincronizando...
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
                        {hasAltInAnyLocale ? 'Verificar y sincronizar alt' : 'Generar alt con IA'}
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
                Este proceso analiza la imagen con IA y genera un alt text optimizado para SEO en inglés para todos los idiomas.
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
