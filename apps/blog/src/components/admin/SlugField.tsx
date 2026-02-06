'use client';

import { useField, useFormFields } from '@payloadcms/ui';
import { Wand2 } from 'lucide-react';
import { useCallback, useState } from 'react';

export const SlugField: React.FC<{
    path: string;
    label?: string;
}> = ({ path }) => {
    const { value, setValue } = useField<string>({ path });
    const [loading, setLoading] = useState(false);

    // Get title field value
    const title = useFormFields(([fields]) => fields?.title?.value as string);

    const suggestSlug = useCallback(async () => {
        if (!title) {
            alert('Primero ingresa un título');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/suggest-slug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            if (response.ok) {
                const { slug } = await response.json();
                setValue(slug);
            } else {
                alert('Error al generar slug');
            }
        } catch (error) {
            console.error('Slug suggestion error:', error);
            alert('Error al generar slug');
        } finally {
            setLoading(false);
        }
    }, [title, setValue]);

    return (
        <div className="field-type text">
            <label className="field-label" htmlFor={path}>
                Slug
                <span className="required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    id={path}
                    type="text"
                    value={value || ''}
                    onChange={(e) => setValue(e.target.value)}
                    style={{ flex: 1 }}
                    className="field-input"
                />
                <button
                    type="button"
                    onClick={suggestSlug}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: loading ? '#666' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {loading ? '...' : <><Wand2 size={16} style={{ marginRight: '4px' }} /> Sugerir</>}
                </button>
            </div>
            <div className="field-description" style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                Slug en inglés para URLs. Click en &quot;Sugerir&quot; para generar automáticamente.
            </div>
        </div>
    );
};
