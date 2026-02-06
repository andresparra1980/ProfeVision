'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { useCallback, useState } from 'react';

export const PreviewButton: React.FC = () => {
    const { id } = useDocumentInfo();
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Get slug field value from form
    const slug = useFormFields(([fields]) => fields?.slug?.value as string);

    const openPreview = useCallback(() => {
        if (!slug) {
            alert('El post necesita un slug para previsualizar');
            return;
        }

        const previewUrl = `/api/preview?slug=${encodeURIComponent(slug)}`;
        
        // Open preview in new tab
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }, [slug]);

    const handlePreview = useCallback(async () => {
        setIsPreviewing(true);
        try {
            await openPreview();
        } finally {
            setIsPreviewing(false);
        }
    }, [openPreview]);

    // Only show preview button for existing documents
    if (!id) {
        return null;
    }

    return (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#0b890f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isPreviewing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                }}
            >
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
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                {isPreviewing ? 'Abriendo...' : 'Vista Previa'}
            </button>
            <p style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '4px',
                fontStyle: 'italic'
            }}>
                Ver el post antes de publicarlo
            </p>
        </div>
    );
};
