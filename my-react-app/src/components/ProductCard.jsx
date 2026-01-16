/**
 * ProductCard - Enhanced product card với hover effects đẹp mắt
 * Bao gồm: image zoom, info slide up, button animations, favorite toggle
 */

import { useState } from "react";

// Fallback image
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect fill='%23f3f4f6' width='400' height='500'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({
    product,
    onCardClick,
    onFavoriteToggle,
    onAddToCart,
    onQuickView,
    isFavorite = false,
    showQuickView = true,
    className = "",
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        onFavoriteToggle?.(e, product);
    };

    const handleQuickViewClick = (e) => {
        e.stopPropagation();
        onQuickView?.(product);
    };

    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        onAddToCart?.(product);
    };

    return (
        <div
            className={`
        group relative bg-white rounded-xl overflow-hidden
        shadow-sm hover:shadow-xl
        transition-all duration-500 ease-out
        cursor-pointer
        border border-gray-100 hover:border-transparent
        ${className}
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onCardClick?.(product)}
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                {/* Image with zoom effect */}
                <img
                    src={product.image || FALLBACK_IMAGE}
                    alt={product.name}
                    className={`
            w-full h-full object-cover
            transition-transform duration-700 ease-out
            ${isHovered ? "scale-110" : "scale-100"}
            ${imageLoaded ? "opacity-100" : "opacity-0"}
          `}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; setImageLoaded(true); }}
                />

                {/* Loading skeleton */}
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}

                {/* Overlay gradient on hover */}
                <div
                    className={`
            absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent
            transition-opacity duration-500
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
                />

                {/* Tags */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isNew && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide bg-[#F2A500] text-white rounded-full shadow-lg">
                            New
                        </span>
                    )}
                    {product.discount && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide bg-red-500 text-white rounded-full shadow-lg">
                            -{product.discount}%
                        </span>
                    )}
                    {product.badge && (
                        <span className="px-2.5 py-1 text-[10px] font-medium bg-white/90 backdrop-blur text-gray-700 rounded-full shadow-sm">
                            {product.badge}
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={handleFavoriteClick}
                    className={`
            absolute top-3 right-3 w-9 h-9 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isFavorite
                            ? "bg-red-500 text-white shadow-lg scale-110"
                            : "bg-white/90 backdrop-blur text-gray-600 hover:bg-white hover:text-red-500 shadow-sm"
                        }
            ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 md:opacity-100 md:translate-y-0"}
          `}
                    aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
                >
                    {isFavorite ? "❤️" : "🤍"}
                </button>

                {/* Quick Actions - slide up on hover */}
                <div
                    className={`
            absolute bottom-0 left-0 right-0 p-4
            flex gap-2 justify-center
            transition-all duration-500
            ${isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
          `}
                >
                    {showQuickView && (
                        <button
                            onClick={handleQuickViewClick}
                            className="
                flex-1 py-2.5 px-4
                bg-white/95 backdrop-blur text-gray-800
                rounded-lg font-medium text-sm
                hover:bg-white
                transition-all duration-300
                shadow-lg
                transform hover:scale-[1.02]
              "
                        >
                            👁️ Xem nhanh
                        </button>
                    )}
                    <button
                        onClick={handleAddToCartClick}
                        className="
              flex-1 py-2.5 px-4
              bg-[#111827] text-white
              rounded-lg font-medium text-sm
              hover:bg-[#0f172a]
              transition-all duration-300
              shadow-lg
              transform hover:scale-[1.02]
            "
                    >
                        🛒 Thêm giỏ
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Category tag */}
                {product.tag && (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#F2A500] bg-[#FEF3C7] rounded mb-2">
                        {product.tag}
                    </span>
                )}

                {/* Product name */}
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-[#111827] transition-colors">
                    {product.name}
                </h3>

                {/* Description */}
                {product.desc && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {product.desc}
                    </p>
                )}

                {/* Price section */}
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#111827]">
                            {product.price || "Liên hệ"}
                        </span>
                        {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                                {product.originalPrice}
                            </span>
                        )}
                    </div>

                    {/* Colors preview */}
                    {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
                        <div className="flex gap-1">
                            {product.colors.slice(0, 3).map((color, idx) => (
                                <span
                                    key={idx}
                                    className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            {product.colors.length > 3 && (
                                <span className="text-xs text-gray-400">+{product.colors.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Rating */}
                {product.rating && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <span className="text-yellow-500">⭐</span>
                        <span>{product.rating}</span>
                        {product.reviewCount && (
                            <span className="text-gray-400">({product.reviewCount})</span>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom border animation */}
            <div
                className={`
          absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F2A500] to-[#F59E0B]
          transition-transform duration-500 origin-left
          ${isHovered ? "scale-x-100" : "scale-x-0"}
        `}
            />
        </div>
    );
}

/**
 * ProductCardSimple - Version đơn giản hơn không có nhiều effects
 */
export function ProductCardSimple({ product, onClick, className = "" }) {
    return (
        <div
            className={`
        bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md
        cursor-pointer transition-shadow duration-300
        ${className}
      `}
            onClick={() => onClick?.(product)}
        >
            <img
                src={product.image || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full aspect-square object-cover"
            />
            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                    {product.name}
                </h3>
                <p className="text-sm font-semibold text-[#111827] mt-1">
                    {product.price || "Liên hệ"}
                </p>
            </div>
        </div>
    );
}
