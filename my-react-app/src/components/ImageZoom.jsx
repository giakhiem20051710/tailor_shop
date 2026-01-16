import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

/**
 * Image Zoom Component với Lightbox
 * - Hiển thị thumbnail/medium mặc định
 * - Swap sang large version khi zoom/lightbox mở
 * - Blur-up effect khi loading
 */
const ImageZoom = ({
  src,
  thumbnailSrc,
  largeSrc,
  alt = '',
  className = '',
  enableZoom = true,
  enableLightbox = true,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoadingLarge, setIsLoadingLarge] = useState(false);
  const [largeImageLoaded, setLargeImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Determine which image to show
  const currentSrc = isZoomed || isLightboxOpen 
    ? (largeImageLoaded ? largeSrc || src : src) 
    : (thumbnailSrc || src);

  // Preload large image when zoom/lightbox opens
  useEffect(() => {
    if ((isZoomed || isLightboxOpen) && largeSrc && !largeImageLoaded) {
      setIsLoadingLarge(true);
      const img = new Image();
      img.onload = () => {
        setLargeImageLoaded(true);
        setIsLoadingLarge(false);
      };
      img.onerror = () => {
        setIsLoadingLarge(false);
      };
      img.src = largeSrc;
    }
  }, [isZoomed, isLightboxOpen, largeSrc, largeImageLoaded]);

  // Handle zoom with mouse wheel
  const handleWheel = (e) => {
    if (!isZoomed) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(1, Math.min(5, prev + delta)));
  };

  // Handle mouse move for panning when zoomed
  const handleMouseMove = (e) => {
    if (!isZoomed || zoomLevel <= 1) return;
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      imageRef.current.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    }
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
  };

  // Open lightbox
  const handleOpenLightbox = () => {
    if (enableLightbox) {
      setIsLightboxOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  // Close lightbox
  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setIsZoomed(false);
    setZoomLevel(1);
    document.body.style.overflow = '';
  };

  // Handle keyboard (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        handleCloseLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      {/* Main Image Container */}
      <div
        ref={containerRef}
        className={`relative ${className}`}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleResetZoom}
      >
        <div className="relative w-full h-full overflow-hidden">
          <div
            ref={imageRef}
            className={`w-full h-full transition-all duration-300 ${
              isLoadingLarge ? 'blur-sm opacity-70' : ''
            }`}
            style={{
              transform: isZoomed ? `scale(${zoomLevel})` : 'scale(1)',
              cursor: enableZoom ? (isZoomed ? 'zoom-out' : 'zoom-in') : 'default',
            }}
          >
            <OptimizedImage
              src={currentSrc}
              alt={alt}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          
          {/* Loading overlay */}
          {isLoadingLarge && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}

          {/* Zoom controls */}
          {enableZoom && !isLightboxOpen && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  if (!isZoomed) {
                    setIsZoomed(true);
                    setZoomLevel(1.5);
                  } else {
                    setZoomLevel(prev => Math.min(5, prev + 0.5));
                  }
                }}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              {isZoomed && (
                <>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
                    className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition"
                    title="Zoom out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition"
                    title="Reset zoom"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Lightbox button */}
          {enableLightbox && !isLightboxOpen && (
            <button
              onClick={handleOpenLightbox}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition"
              title="Xem toàn màn hình"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={handleCloseLightbox}
        >
          <div
            className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <OptimizedImage
                src={largeImageLoaded ? largeSrc || src : src}
                alt={alt}
                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                  isLoadingLarge ? 'opacity-50 blur-sm' : 'opacity-100'
                }`}
                loading="eager"
              />
              
              {/* Loading overlay */}
              {isLoadingLarge && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageZoom;

