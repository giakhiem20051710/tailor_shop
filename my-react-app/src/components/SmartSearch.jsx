/**
 * SmartSearch - Thanh tìm kiếm thông minh với autocomplete
 * Features:
 * - Tìm kiếm sản phẩm, vải, danh mục realtime
 * - Gợi ý tìm kiếm phổ biến
 * - Lưu lịch sử tìm kiếm vào localStorage
 * - Debounce để tối ưu performance
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productService, fabricService, imageAssetService } from "../services/index.js";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// Storage keys
const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 5;

// Popular/trending searches (có thể lấy từ API sau)
const POPULAR_SEARCHES = [
    { text: "Áo dài", icon: "👗", category: "popular" },
    { text: "Vest nam", icon: "🤵", category: "popular" },
    { text: "Váy cưới", icon: "💒", category: "popular" },
    { text: "Vải lụa", icon: "🧵", category: "fabric" },
    { text: "Vải cotton", icon: "🧵", category: "fabric" },
    { text: "Đầm dạ hội", icon: "✨", category: "popular" },
];

// Quick categories
const QUICK_CATEGORIES = [
    { name: "Áo dài", path: "/products?category=ao-dai", icon: "👗" },
    { name: "Vest", path: "/products?category=vest", icon: "🤵" },
    { name: "Váy đầm", path: "/products?category=vay-dam", icon: "👘" },
    { name: "Vải cao cấp", path: "/fabrics", icon: "🧵" },
    { name: "Flash Sale", path: "/flash-sale", icon: "⚡" },
];

export default function SmartSearch({ className = "", placeholder = "Tìm váy, đầm, vải, sản phẩm..." }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debouncedQuery = useDebounce(query, 300);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing recent searches:", e);
            }
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions when query changes
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const results = [];

                // Search products
                try {
                    const productResponse = await productService.search({
                        keyword: debouncedQuery,
                        page: 0,
                        size: 3
                    });
                    const products = productResponse?.content || productResponse?.data?.content || [];
                    products.forEach((p) => {
                        results.push({
                            id: p.id,
                            type: "product",
                            text: p.name || p.title,
                            subtext: p.description?.slice(0, 50) || "",
                            price: p.price,
                            image: p.imageUrl || p.thumbnailUrl,
                            icon: "🛍️",
                            path: `/product/${p.id}`,
                        });
                    });
                } catch (e) {
                    console.log("Product search not available");
                }

                // Search fabrics
                try {
                    const fabricResponse = await fabricService.search({
                        keyword: debouncedQuery,
                        page: 0,
                        size: 3
                    });
                    const fabrics = fabricResponse?.content || fabricResponse?.data?.content || [];
                    fabrics.forEach((f) => {
                        results.push({
                            id: f.id,
                            type: "fabric",
                            text: f.name || f.title,
                            subtext: f.material || f.description?.slice(0, 30) || "",
                            price: f.price,
                            image: f.imageUrl || f.thumbnailUrl,
                            icon: "🧵",
                            path: `/fabrics/${f.id}`,
                        });
                    });
                } catch (e) {
                    console.log("Fabric search not available");
                }

                // Search image assets (template products)
                try {
                    const imageResponse = await imageAssetService.filter({
                        search: debouncedQuery,
                        page: 0,
                        size: 3,
                    });
                    const images = imageResponse?.content || imageResponse?.data?.content || [];
                    images.forEach((img) => {
                        results.push({
                            id: img.id,
                            type: "template",
                            text: img.type?.replace(/_/g, " ") || "Sản phẩm mẫu",
                            subtext: img.category || "",
                            image: img.thumbnailUrl || img.url,
                            icon: "📷",
                            path: `/product/${img.id}?type=IMAGE_ASSET`,
                        });
                    });
                } catch (e) {
                    console.log("Image asset search not available");
                }

                // Add category suggestions based on query
                const lowerQuery = debouncedQuery.toLowerCase();
                POPULAR_SEARCHES.forEach((ps) => {
                    if (ps.text.toLowerCase().includes(lowerQuery)) {
                        if (!results.find((r) => r.text === ps.text)) {
                            results.push({
                                type: "suggestion",
                                text: ps.text,
                                icon: ps.icon,
                                path: `/products?search=${encodeURIComponent(ps.text)}`,
                            });
                        }
                    }
                });

                setSuggestions(results);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    // Save search to recent
    const saveToRecent = useCallback((searchText) => {
        const updated = [
            searchText,
            ...recentSearches.filter((s) => s !== searchText),
        ].slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    // Handle search submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            saveToRecent(query.trim());
            navigate(`/products?search=${encodeURIComponent(query.trim())}`);
            setQuery("");
            setIsOpen(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        if (suggestion.text) {
            saveToRecent(suggestion.text);
        }
        if (suggestion.path) {
            navigate(suggestion.path);
        }
        setQuery("");
        setIsOpen(false);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        const totalItems = suggestions.length + (query.length < 2 ? recentSearches.length + QUICK_CATEGORIES.length : 0);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            // Handle selection based on index
            if (selectedIndex < suggestions.length) {
                handleSuggestionClick(suggestions[selectedIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const showDropdown = isOpen && (query.length > 0 || recentSearches.length > 0 || true);

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <form
                onSubmit={handleSubmit}
                className="flex rounded-full border border-[#E5E7EB] overflow-hidden bg-white focus-within:border-[#F2A500] focus-within:ring-2 focus-within:ring-[#F2A500]/20 transition-all"
            >
                <div className="flex-1 flex items-center">
                    <span className="pl-4 text-gray-400">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-3 py-2.5 text-[13px] outline-none bg-transparent"
                        placeholder={placeholder}
                        aria-label="Tìm kiếm sản phẩm"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="px-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="px-6 text-[12px] font-semibold bg-[#111827] text-white hover:bg-[#0f172a] transition-colors"
                >
                    TÌM KIẾM
                </button>
            </form>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                >
                    {/* Loading state */}
                    {isLoading && (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Đang tìm kiếm...
                        </div>
                    )}

                    {/* No query - Show recent + quick categories */}
                    {query.length < 2 && !isLoading && (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="border-b border-gray-100">
                                    <div className="px-4 py-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Tìm kiếm gần đây
                                        </span>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                    {recentSearches.map((search, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setQuery(search);
                                                navigate(`/products?search=${encodeURIComponent(search)}`);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selectedIndex === idx ? "bg-gray-50" : ""
                                                }`}
                                        >
                                            <span className="text-gray-400">🕐</span>
                                            <span className="text-sm text-gray-700">{search}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quick Categories */}
                            <div className="border-b border-gray-100">
                                <div className="px-4 py-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Danh mục nổi bật
                                    </span>
                                </div>
                                <div className="px-3 pb-3 flex flex-wrap gap-2">
                                    {QUICK_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.name}
                                            onClick={() => {
                                                navigate(cat.path);
                                                setIsOpen(false);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-[#F2A500] hover:text-white rounded-full transition-all flex items-center gap-1"
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Popular Searches */}
                            <div>
                                <div className="px-4 py-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Tìm kiếm phổ biến
                                    </span>
                                </div>
                                {POPULAR_SEARCHES.slice(0, 4).map((ps, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setQuery(ps.text);
                                            saveToRecent(ps.text);
                                            navigate(`/products?search=${encodeURIComponent(ps.text)}`);
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span>{ps.icon}</span>
                                        <span className="text-sm text-gray-700">{ps.text}</span>
                                        <span className="ml-auto text-xs text-[#F2A500]">🔥 Hot</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Search Results */}
                    {query.length >= 2 && !isLoading && suggestions.length > 0 && (
                        <div>
                            <div className="px-4 py-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Kết quả ({suggestions.length})
                                </span>
                            </div>
                            {suggestions.map((item, idx) => (
                                <button
                                    key={`${item.type}-${item.id || idx}`}
                                    onClick={() => handleSuggestionClick(item)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selectedIndex === idx ? "bg-gray-50" : ""
                                        }`}
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.text}
                                            className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    ) : (
                                        <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-xl">
                                            {item.icon}
                                        </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-800 truncate">
                                            {item.text}
                                        </div>
                                        {item.subtext && (
                                            <div className="text-xs text-gray-500 truncate">
                                                {item.subtext}
                                            </div>
                                        )}
                                        {item.price && (
                                            <div className="text-xs text-[#F2A500] font-semibold">
                                                {typeof item.price === "number"
                                                    ? `${item.price.toLocaleString("vi-VN")} ₫`
                                                    : item.price}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 capitalize">
                                        {item.type === "product" ? "Sản phẩm" :
                                            item.type === "fabric" ? "Vải" :
                                                item.type === "template" ? "Mẫu" : ""}
                                    </span>
                                </button>
                            ))}

                            {/* View all results */}
                            <button
                                onClick={handleSubmit}
                                className="w-full px-4 py-3 text-sm text-center text-[#111827] hover:bg-[#F2A500] hover:text-white transition-colors font-medium border-t border-gray-100"
                            >
                                Xem tất cả kết quả cho "{query}" →
                            </button>
                        </div>
                    )}

                    {/* No results */}
                    {query.length >= 2 && !isLoading && suggestions.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <span className="text-4xl mb-2 block">🔍</span>
                            <p className="text-sm text-gray-500">
                                Không tìm thấy kết quả cho "{query}"
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Thử tìm với từ khóa khác hoặc xem các danh mục gợi ý
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
