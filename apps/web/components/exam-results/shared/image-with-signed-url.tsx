import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ImageWithSignedUrlProps {
  path: string;
  alt: string;
}

export function ImageWithSignedUrl({ path, alt }: ImageWithSignedUrlProps) {
  const [imageSrc, setImageSrc] = useState<string>(''); // Blob URL state
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const blobUrlRef = useRef<string>('');

  const getStorageUrl = async (filePath: string | null | undefined) => {
    if (!filePath) return '';

    try {
      const { data, error: _error } = await supabase
        .storage
        .from('examenes-escaneados')
        .createSignedUrl(filePath, 3600);

      if (_error) return '';
      return data.signedUrl;
    } catch (_error) {
      return '';
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchImage() {
      try {
        setLoading(true);
        setError(false);

        const url = await getStorageUrl(path);
        if (!url) {
          if (isMounted) setError(true);
          return;
        }

        // Fetch la imagen sin cookies para evitar problemas de Cloudflare
        const response = await fetch(url, {
          credentials: 'omit',  // No enviar cookies
          mode: 'cors',
          signal: controller.signal,
          headers: {
            'Accept': 'image/*',
          }
        });

        if (!response.ok) {
          if (isMounted) setError(true);
          return;
        }

        const blob = await response.blob();

        // Verificar que sea una imagen válida
        if (!blob.type.startsWith('image/')) {
          if (isMounted) setError(true);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        if (isMounted) {
          setImageSrc(blobUrl);
          setLoading(false);
        } else {
          // Si el componente se desmontó, limpiar el blob URL inmediatamente
          URL.revokeObjectURL(blobUrl);
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request fue cancelado, no mostrar error
          return;
        }
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchImage();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [path]);

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error al cargar la imagen
      </div>
    );
  }

  if (loading || !imageSrc) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc} // Usar blob URL en lugar de signed URL
      alt={alt}
      className="w-full h-full object-contain"
      width={800}
      height={600}
      onError={() => setError(true)}
      unoptimized // Necesario para blob URLs
    />
  );
}
