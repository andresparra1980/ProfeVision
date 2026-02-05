'use client';

import React, { useState } from 'react';
import { useField, TextInput } from '@payloadcms/ui';
import { Wand2 } from 'lucide-react';

export const AltFieldWithRegenerate: React.FC = () => {
    const { value, setValue, path } = useField<string>({ path: 'alt' });
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleRegenerate = async () => {
        // Get document ID from URL
        const pathMatch = window.location.pathname.match(/\/blog_media\/(\d+)/);
        const id = pathMatch?.[1];

        if (!id) {
            setMessage('No se encontró el ID del documento');
            return;
        }

        setIsRegenerating(true);
        setMessage(null);

        try {
            const response = await fetch('/api/blog_media/sync-alt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const result = await response.json();
            setMessage('Alt regenerado exitosamente');
            
            // Reload page after 1.5 seconds to show new alt
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('[AltField] Error:', error);
            setMessage('Error al regenerar');
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                    <TextInput
                        path={path}
                        value={value || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isRegenerating ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRegenerating ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        height: '40px',
                    }}
                >
                    <Wand2 size={16} />
                    {isRegenerating ? 'Generando...' : 'Regenerar'}
                </button>
            </div>
            {message && (
                <p style={{
                    fontSize: '12px',
                    color: message.includes('Error') ? '#dc2626' : '#16a34a',
                    margin: 0,
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};
