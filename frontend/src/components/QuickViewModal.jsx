import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, authService } from "../services";
import { showSuccess, showError } from "./NotificationToast";

const QuickViewModal = ({ product, onClose, type = "PRODUCT" }) => {
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        console.log("QuickViewModal received product:", product);
        if (product) {
            setQuantity(1);
            setActiveImage(product.image);
        }
    }, [product]);

    if (!product) return null;

    const handleFullDetail = () => {
        if (type === "FABRIC") {
            navigate(`/fabrics/${product.key}`);
        } else {
            sessionStorage.setItem("scrollPosition_products", window.scrollY.toString());
            navigate(`/product/${product.key}`, { state: { product } });
        }
        onClose();
    };

    const handleAddToCart = async () => {
        try {
            if (!authService.isAuthenticated()) {
                showError("Vui lòng đăng nhập để thêm vào giỏ hàng");
                return;
            }
            setLoading(true);
            await cartService.addToCart({
                itemType: "FABRIC",
                itemId: product.id,
                quantity: quantity,
            });
            showSuccess(`Đã thêm ${quantity}m ${fabricSpecs.length > 0 ? product.name : product.name} vào giỏ hàng`);
            onClose();
        } catch (error) {
            console.error("Error adding to cart:", error);
            showError("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to safely get data or default
    const getVal = (val, defaultVal = "Đang cập nhật") => val || defaultVal;

    // Helper to safely convert string/array to array
    const toArray = (val, defaultVal = []) => {
        if (!val) return defaultVal;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.split(',').map(s => s.trim());
        return defaultVal;
    };

    // Fabric Specs
    const fabricSpecs = type === "FABRIC" ? [
        { label: 'Chất liệu', value: getVal(product.specs?.composition || product.material, 'Vải cao cấp'), icon: '🧵' },
        { label: 'Khổ vải', value: getVal(product.specs?.width || product.width, '1.5m'), icon: '📏' },
        { label: 'Trọng lượng', value: getVal(product.specs?.weight || product.weight, 'Vừa phải'), icon: '⚖️' },
        { label: 'Độ co giãn', value: getVal(product.stretch, 'Không'), icon: '↔️' },
        { label: 'Xuất xứ', value: getVal(product.origin, 'Nhập khẩu'), icon: '🌍' },
        { label: 'Màu sắc', value: getVal(product.color, 'Đa dạng'), icon: '🎨' },
    ] : [];

    // Product Features
    const productFeatures = [
        { label: 'Form dáng', value: getVal(product.silhouette, 'Form chuẩn may đo'), icon: '👕' },
        { label: 'Độ dài', value: getVal(product.lengthInfo, 'Theo yêu cầu'), icon: '📏' },
        { label: 'Chất liệu', value: getVal(product.materials, 'Vải cao cấp'), icon: '🧵' },
        { label: 'Tay áo', value: 'Thiết kế riêng', icon: '✂️' },
        { label: 'Màu sắc', value: getVal(product.colors, 'Đa dạng'), icon: '🎨' },
        { label: 'Phụ kiện', value: getVal(product.accessories, 'Không bao gồm'), icon: '👜' },
    ];

    const displayFeatures = type === "FABRIC" ? fabricSpecs : productFeatures;
    const isFabric = type === "FABRIC";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl w-full max-w-6xl h-[90vh] shadow-2xl animate-scale-up flex flex-col overflow-hidden">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#1B4332]">
                            {isFabric ? "🧵" : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-[#1F2933]">
                                {isFabric ? "Chi tiết vải & Đặt mua" : "Chi tiết ảnh sản phẩm"}
                            </h3>
                            <span className="text-[10px] text-gray-500">Thông tin chi tiết và phân loại</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col lg:flex-row min-h-full">

                        {/* LEFT: IMAGE SECTION */}
                        <div className="w-full lg:w-5/12 p-4 bg-gray-50 border-r border-gray-100 flex flex-col">
                            <div className="sticky top-4">
                                {/* Preview Label */}
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Preview</div>

                                {/* Main Image */}
                                <div className="aspect-[3/4] overflow-hidden rounded-xl relative group bg-white shadow-sm">
                                    <img
                                        src={activeImage || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {product.category === 'template' && (
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-[#1B4332] shadow-sm">
                                            Lavi Exclusive
                                        </span>
                                    )}
                                    {isFabric && product.tag && (
                                        <span className="absolute top-3 left-3 bg-[#1B4332]/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-white shadow-sm">
                                            {product.tag}
                                        </span>
                                    )}
                                </div>

                                {/* Thumbnails for Fabric */}
                                {isFabric && product.gallery && product.gallery.length > 1 && (
                                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                        {product.gallery.slice(0, 4).map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`w-16 h-16 rounded-md border-2 flex-shrink-0 overflow-hidden ${activeImage === img ? 'border-[#1B4332]' : 'border-transparent'}`}
                                            >
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: DETAILS SECTION */}
                        <div className="w-full lg:w-7/12 p-6 space-y-8">

                            {/* Header Info (Name & Price) */}
                            <div>
                                <h2 className="text-2xl font-bold text-[#1F2933] mb-2">{product.name}</h2>
                                {isFabric && (
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xl font-bold text-[#B91C1C]">{product.price}</span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                                        )}
                                        {product.availableQuantity !== undefined && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${product.availableQuantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {product.availableQuantity > 0 ? "Còn hàng" : "Hết hàng"}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 1. MÔ TẢ SẢN PHẨM */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-[#1B4332] uppercase tracking-wide">
                                    <span className="w-6 h-6 rounded-full bg-[#E8F5E9] flex items-center justify-center text-xs">📝</span>
                                    Mô tả sản phẩm
                                </h4>
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                                        {product.desc || product.description || "Sản phẩm chất lượng cao từ My Hiền Tailor."}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {product.tags && Array.isArray(product.tags) && product.tags.map((tag, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-1 bg-white border border-blue-200 text-blue-600 rounded">#{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Info Cards (Only for PRODUCT type) */}
                                {!isFabric && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <InfoCard
                                            icon="⏱️" label="Thời gian may"
                                            value={getVal(product.tailoringTime, '7-10 ngày')}
                                            sub="Ưu tiên nhanh: 3-5 ngày"
                                            color="blue"
                                        />
                                        <InfoCard
                                            icon="👗" label="Số lần thử đồ"
                                            value={getVal(product.fittingCount, '1-2 lần')}
                                            sub="Tại nhà hoặc Store"
                                            color="purple"
                                        />
                                        <InfoCard
                                            icon="🛡️" label="Bảo hành"
                                            value={getVal(product.warranty, 'Trọn đời')}
                                            sub="Chỉnh sửa miễn phí"
                                            color="green"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 2. CHI TIẾT KỸ THUẬT */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-[#D4AF37] uppercase tracking-wide">
                                    <span className="w-6 h-6 rounded-full bg-[#FEF9C3] flex items-center justify-center text-xs">
                                        {isFabric ? "📏" : "✂️"}
                                    </span>
                                    {isFabric ? "Thông số vải" : "Chi tiết may đo"}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {displayFeatures.map((f, i) => (
                                        <div key={i} className="p-3 border border-[#F4E4BC] bg-[#FFFCF5] rounded-lg">
                                            <div className="text-[10px] text-[#D4AF37] uppercase font-semibold mb-1">{f.label}</div>
                                            <div className="text-sm text-gray-800 font-medium line-clamp-2 md:line-clamp-1" title={f.value}>{f.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fabric Specific: Add to Cart */}
                            {isFabric && (
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700">Số lượng (m):</label>
                                            <div className="flex items-center border border-[#E5E7EB] rounded-lg h-10">
                                                <button
                                                    onClick={() => setQuantity(Math.max(0.1, quantity - 0.1))}
                                                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-[#1B4332]"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                                                    className="w-16 h-full text-center border-none focus:ring-0 text-gray-800 font-medium text-sm"
                                                />
                                                <button
                                                    onClick={() => setQuantity(quantity + 0.1)}
                                                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-[#1B4332]"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddToCart}
                                            disabled={loading} // Add availability check if needed
                                            className="w-full py-3 bg-[#1B4332] text-white font-bold rounded-lg shadow-lg hover:bg-[#153427] transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? "Đang xử lý..." : `Thêm vào giỏ - ${(typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) * quantity : 0).toLocaleString()}đ (Ước tính)`}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 3. PHÙ HỢP & BẢO QUẢN GROUPS (Only for PRODUCT type) */}
                            {!isFabric && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Phù hợp với */}
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-600 uppercase tracking-wide">
                                            <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-xs">❤️</span>
                                            Mẫu này phù hợp với
                                        </h4>
                                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 h-full">
                                            <div className="mb-3">
                                                <span className="text-xs font-semibold text-rose-500 block mb-1">Dịp sử dụng:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(product.occasions || product.aiOccasion, ["Daily", "Work"]).map((occ, idx) => (
                                                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-rose-200 text-gray-600 rounded lowercase">
                                                            • {typeof occ === 'string' ? occ.trim() : occ}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-rose-500 block mb-1">Phong cách khách hàng:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(product.customerStyles, ["Elegant", "Modern"]).map((style, idx) => (
                                                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-rose-200 text-gray-600 rounded lowercase">
                                                            • {typeof style === 'string' ? style.trim() : style}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gợi ý bảo quản */}
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-teal-600 uppercase tracking-wide">
                                            <span className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-xs">🍃</span>
                                            Gợi ý bảo quản
                                        </h4>
                                        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 h-full">
                                            <ul className="space-y-2">
                                                {toArray(product.careInstructions, ["Ưu tiên giặt tay hoặc giặt khô", "Không vắt xoắn mạnh", "Ủi ở nhiệt độ thấp"]).slice(0, 3).map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-600">
                                                        <span className="mt-1 w-1 h-1 rounded-full bg-teal-400 shrink-0" />
                                                        {typeof item === 'string' ? item.trim() : item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-4 shrink-0">
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs text-gray-500">Cần tư vấn thêm?</span>
                        <span className="text-sm font-bold text-[#1B4332]">Hotline: 0905 123 456</span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleFullDetail}
                            className={`flex-1 md:flex-none px-8 py-3 ${isFabric ? "bg-white border border-[#1B4332] text-[#1B4332]" : "bg-[#1B4332] text-white"} font-bold rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2`}
                        >
                            Xem chi tiết đầy đủ
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoCard = ({ icon, label, value, sub, color }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    }
    const theme = colors[color] || colors.blue;

    return (
        <div className={`p-3 rounded-lg border ${theme} flex flex-col justify-between`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-bold uppercase opacity-80">{label}</span>
            </div>
            <div>
                <div className="text-sm font-bold">{value}</div>
                {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
            </div>
        </div>
    )
}

export default QuickViewModal;
