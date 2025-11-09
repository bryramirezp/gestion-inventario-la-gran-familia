import React, { useState, useMemo } from 'react';

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  className?: string;
  /**
   * Generate srcset automatically based on breakpoints
   * If true, will generate srcset for common breakpoints (320w, 640w, 1024w, 1920w)
   * Requires the image to be available at different sizes or use a service like Imgix/Cloudinary
   */
  autoSrcSet?: boolean;
  /**
   * Default sizes attribute for responsive images
   * Used when sizes is not provided
   */
  defaultSizes?: string;
}

/**
 * ResponsiveImage component with built-in optimization features:
 * - Lazy loading by default
 * - Automatic srcset generation (optional)
 * - Error handling with fallback
 * - Proper width/height attributes to prevent layout shift
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  srcSet: providedSrcSet,
  sizes: providedSizes,
  loading = 'lazy',
  fallbackSrc,
  className = '',
  autoSrcSet = false,
  defaultSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  width,
  height,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Generate srcset automatically if autoSrcSet is true and no srcset provided
  const generatedSrcSet = useMemo(() => {
    if (providedSrcSet) return providedSrcSet;
    if (!autoSrcSet) return undefined;

    // Generate srcset for common breakpoints
    // Note: This assumes the image service supports size parameters
    // For static images, you'll need to provide srcset manually
    const breakpoints = [320, 640, 1024, 1920];
    return breakpoints.map(w => `${src}?w=${w} ${w}w`).join(', ');
  }, [src, providedSrcSet, autoSrcSet]);

  const finalSrcSet = providedSrcSet || generatedSrcSet;
  const finalSizes = providedSizes || defaultSizes;

  const handleError = () => {
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    } else {
      setImageError(true);
    }
  };

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted dark:bg-dark-muted text-muted-foreground ${className}`}
        style={{ width, height }}
        {...(props as any)}
      >
        <span className="text-xs">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      srcSet={finalSrcSet}
      sizes={finalSizes}
      loading={loading}
      onError={handleError}
      width={width}
      height={height}
      className={className}
      decoding="async"
      {...props}
    />
  );
};

