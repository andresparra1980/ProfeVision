'use client';

import React, { useState } from 'react';
import { Button } from '@payloadcms/ui/elements/Button';
import { useDocumentInfo } from '@payloadcms/ui';
import { RefreshCw, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

export function SyncAltButton() {
    const { id } = useDocumentInfo();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        generated?: boolean;
    } | null>(null);

    const handleSync = async () => {
        if (!id) {
            setResult({
                success: false,
                message: 'No se encontró el ID del documento',
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/blog_media/sync-alt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    generated: data.generated,
                });
                
                // Refresh the page after successful sync
                if (data.generated) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Error desconocido',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Error de conexión',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                marginTop: '16px',
                padding: '16px',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--theme-bg)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                }}
            >
                <ImageIcon size={18} />
                <h4
                    style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 600,
                    }}
                >
                    Sincronización de Alt Text
                </h4>
            </div>

            <p
                style={{
                    fontSize: '13px',
                    color: 'var(--theme-text-gray)',
                    marginBottom: '12px',
                    lineHeight: '1.5',
                }}
            >
                Genera automáticamente texto alternativo en inglés para todos los idiomas usando IA.
                Se analizará la imagen y se creará un alt optimizado para SEO.
            </p>

            <Button
                buttonStyle="secondary"
                size="small"
                onClick={handleSync}
                disabled={isLoading}
                icon={isLoading ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
            >
                {isLoading ? 'Generando...' : 'Sincronizar Alt con IA'}
            </Button>

            {result && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '4px',
                        backgroundColor: result.success
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${result.success ? '#22c55e' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                    }}
                >
                    {result.success ? (
                        <Check size={18} color="#22c55e" />
                    ) : (
                        <AlertCircle size={18} color="#ef4444" />
                    )}
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '13px',
                                color: result.success ? '#15803d' : '#dc2626',
                                fontWeight: 500,
                            }}
                        >
                            {result.success ? 'Éxito' : 'Error'}
                        </p>
                        <p
                            style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: result.success ? '#166534' : '#b91c1c',
                            }}
                        >
                            {result.message}
                        </p>
                        {result.generated && (
                            <p
                                style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '11px',
                                    color: '#166534',
                                    fontStyle: 'italic',
                                }}
                            >
                                Recargando página...
                            </p>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
