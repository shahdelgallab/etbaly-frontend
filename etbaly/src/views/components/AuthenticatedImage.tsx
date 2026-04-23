import { useState, useEffect } from 'react';
import { tokenStorage } from '../../services/api';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Image component that fetches images with authentication headers
 * Useful for loading images from protected proxy endpoints
 */
export function AuthenticatedImage({ src, alt, className, onError, onLoad }: AuthenticatedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // If it's a blob URL or data URL, use it directly
        if (src.startsWith('blob:') || src.startsWith('data:')) {
          setBlobUrl(src);
          setLoading(false);
          onLoad?.();
          return;
        }

        // Fetch with auth headers
        const token = tokenStorage.getAccess();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('🖼️ Fetching authenticated image:', src);
        const response = await fetch(src, { headers });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
        console.log('✅ Image loaded successfully');
        onLoad?.();
      } catch (err) {
        if (cancelled) return;
        
        console.error('❌ Failed to load authenticated image:', err);
        setError(true);
        setLoading(false);
        onError?.();
      }
    };

    fetchImage();

    // Cleanup: revoke object URL when component unmounts or src changes
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, onError, onLoad]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface/50 animate-pulse`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-text-muted font-exo">Loading image...</span>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface/50 border border-border rounded-xl p-4`}>
        <div className="text-center">
          <p className="text-sm text-text-muted font-exo mb-1">Failed to load image</p>
          <p className="text-xs text-text-muted/60 font-mono break-all">{src}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
    />
  );
}
