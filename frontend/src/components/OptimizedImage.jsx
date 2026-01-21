import { useState, useRef, useEffect } from "react";

/**
 * Optimized Image Component with lazy loading and placeholder
 */
const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3C/svg%3E",
  loading = "lazy",
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Create image observer for lazy loading
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload image with high quality settings
            const img = new Image();
            // Removed crossOrigin setting to avoid CORS issues with S3
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
            img.onerror = () => {
              setHasError(true);
              if (onError) onError();
            };
            imageObserver.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      imageObserver.observe(imgRef.current);
    }

    return () => {
      imageObserver.disconnect();
    };
  }, [src, onError]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={loading === "eager" ? "high" : "auto"}
        className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-50"
          } ${hasError ? "opacity-30" : ""} ${className.includes('w-auto') ? '' : 'w-full h-full'}`}
        style={{
          WebkitImageRendering: '-webkit-optimize-contrast',
          imageRendering: props.style?.imageRendering || 'auto',
          objectFit: props.style?.objectFit || 'cover',
          objectPosition: props.style?.objectPosition || 'center',
          minHeight: props.style?.width === 'auto' ? 'auto' : '100%',
          width: props.style?.width || '100%',
          height: props.style?.height || '100%',
          maxWidth: props.style?.maxWidth || '100%',
          maxHeight: props.style?.maxHeight || '100%',
          display: 'block',
          margin: props.style?.margin || '0',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          willChange: 'opacity',
          filter: 'none',
          // Ensure crisp rendering
          imageRendering: '-webkit-optimize-contrast',
          msInterpolationMode: 'bicubic',
          ...props.style,
        }}
        onError={() => {
          setHasError(true);
          if (onError) onError();
        }}
        {...props}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-2">
          <svg
            className="w-8 h-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-400 text-xs text-center">Không tải được ảnh</span>
          {src && (
            <span className="text-gray-300 text-[10px] mt-1 truncate max-w-full" title={src}>
              {src.length > 30 ? src.substring(0, 30) + '...' : src}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

