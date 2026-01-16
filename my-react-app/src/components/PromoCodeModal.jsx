import { useState, useEffect } from "react";
import { promotionService } from "../services";
import { showError } from "./NotificationToast.jsx";

/**
 * PromoCodeModal - Modal cho phép người dùng chọn hoặc nhập mã khuyến mãi
 * Tương tự Shopee/FPT Shop
 */
export default function PromoCodeModal({
    isOpen,
    onClose,
    onApply,
    cartTotal = 0,
    cartItemIds = [],
}) {
    const [promoCode, setPromoCode] = useState("");
    const [availablePromos, setAvailablePromos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState("");
    const [selectedPromo, setSelectedPromo] = useState(null);

    // Load available promotions when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAvailablePromos();
        }
    }, [isOpen]);

    const loadAvailablePromos = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await promotionService.listActivePublic({ size: 20 });
            const data = response?.data ?? response?.responseData ?? response;
            const promos = data?.content || data || [];
            setAvailablePromos(Array.isArray(promos) ? promos : []);
        } catch (err) {
            console.error("Error loading promotions:", err);
            // Don't show error - just show empty list
            setAvailablePromos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCode = async () => {
        const codeToApply = promoCode.trim() || selectedPromo?.code;
        if (!codeToApply) {
            setError("Vui lòng nhập hoặc chọn mã khuyến mãi");
            return;
        }

        try {
            setApplying(true);
            setError("");

            const response = await promotionService.applyPromoCode({
                code: codeToApply,
                orderTotal: cartTotal,
                cartItemIds: cartItemIds,
            });

            const result = response?.data ?? response?.responseData ?? response;

            if (result?.valid || result?.discountAmount > 0) {
                onApply({
                    code: codeToApply,
                    discountAmount: result.discountAmount || 0,
                    promotionId: result.promotionId || result.id,
                    promotionName: result.promotionName || result.name || codeToApply,
                    message: result.message,
                });
                onClose();
            } else {
                setError(result?.message || "Mã khuyến mãi không hợp lệ hoặc đã hết hạn");
            }
        } catch (err) {
            console.error("Error applying promo code:", err);
            const errorMsg = err?.response?.data?.message || err?.message || "Không thể áp dụng mã khuyến mãi";
            setError(errorMsg);
        } finally {
            setApplying(false);
        }
    };

    const handleSelectPromo = (promo) => {
        setSelectedPromo(promo);
        setPromoCode(promo.code);
        setError("");
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                    <h2 className="text-[18px] font-semibold text-[#111827]">
                        Chọn Mã Khuyến Mãi
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Input promo code */}
                    <div>
                        <label className="block text-[13px] font-medium text-[#111827] mb-2">
                            Nhập mã khuyến mãi
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => {
                                    setPromoCode(e.target.value.toUpperCase());
                                    setError("");
                                    setSelectedPromo(null);
                                }}
                                placeholder="Nhập mã khuyến mãi"
                                className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] outline-none focus:border-[#F97316] transition-colors"
                            />
                            <button
                                onClick={handleApplyCode}
                                disabled={applying || !promoCode.trim()}
                                className={`px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${applying || !promoCode.trim()
                                        ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                                        : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                                    }`}
                            >
                                {applying ? "..." : "Áp dụng"}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-[12px] text-red-500">{error}</p>
                        )}
                    </div>

                    {/* Available Promotions */}
                    <div>
                        <h3 className="text-[13px] font-medium text-[#111827] mb-3">
                            Mã khuyến mãi có sẵn
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
                                <p className="text-[13px] text-[#6B7280] mt-2">Đang tải...</p>
                            </div>
                        ) : availablePromos.length === 0 ? (
                            <div className="text-center py-8 text-[#6B7280]">
                                <svg className="w-12 h-12 mx-auto mb-2 text-[#D1D5DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <p className="text-[13px]">Chưa có mã khuyến mãi nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availablePromos.map((promo) => {
                                    const isSelected = selectedPromo?.id === promo.id;
                                    const canApply = !promo.minOrderAmount || cartTotal >= promo.minOrderAmount;

                                    return (
                                        <div
                                            key={promo.id}
                                            onClick={() => canApply && handleSelectPromo(promo)}
                                            className={`p-4 border rounded-xl transition-all cursor-pointer ${isSelected
                                                    ? "border-[#F97316] bg-[#FFF7ED]"
                                                    : canApply
                                                        ? "border-[#E5E7EB] hover:border-[#F97316] hover:bg-[#FFFBEB]"
                                                        : "border-[#E5E7EB] bg-[#F9FAFB] opacity-60 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#F97316]" : "bg-[#FEF3C7]"
                                                    }`}>
                                                    <svg className={`w-6 h-6 ${isSelected ? "text-white" : "text-[#F59E0B]"}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[14px] font-semibold text-[#111827]">
                                                            {promo.name}
                                                        </span>
                                                        {isSelected && (
                                                            <svg className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    <p className="text-[12px] text-[#6B7280] mb-2 line-clamp-2">
                                                        {promo.description || `Giảm ${promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}`}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                        <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-full font-medium">
                                                            {promo.code}
                                                        </span>
                                                        {promo.minOrderAmount > 0 && (
                                                            <span className={`${cartTotal >= promo.minOrderAmount ? "text-[#6B7280]" : "text-red-500"}`}>
                                                                Đơn tối thiểu {formatPrice(promo.minOrderAmount)}
                                                            </span>
                                                        )}
                                                        {promo.endDate && (
                                                            <span className="text-[#6B7280]">
                                                                HSD: {formatDate(promo.endDate)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
                    <button
                        onClick={handleApplyCode}
                        disabled={applying || (!promoCode.trim() && !selectedPromo)}
                        className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-colors ${applying || (!promoCode.trim() && !selectedPromo)
                                ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                                : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                            }`}
                    >
                        {applying ? "Đang áp dụng..." : selectedPromo ? `Áp dụng mã ${selectedPromo.code}` : "Áp dụng mã khuyến mãi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
