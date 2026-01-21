/**
 * OrdersTab Component
 * Displays list of tailoring and fabric orders
 */
import { useState } from 'react';

export default function OrdersTab({ orders, formatCurrency, navigate, loadingOrders }) {
    const [orderType, setOrderType] = useState("tailoring");
    const currentOrders = orders.filter(order =>
        orderType === "tailoring" ? !order.isFabricOrder : order.isFabricOrder
    );

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || "";
        if (statusLower.includes("hoàn thành") || statusLower.includes("completed")) {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
        if (statusLower.includes("đang may") || statusLower.includes("in_progress") || statusLower.includes("progress")) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }
        if (statusLower.includes("thử đồ") || statusLower.includes("fitting")) {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }
        if (statusLower.includes("chờ") || statusLower.includes("waiting") || statusLower.includes("confirmed")) {
            return "bg-slate-50 text-slate-700 border-slate-200";
        }
        if (statusLower.includes("hủy") || statusLower.includes("cancelled")) {
            return "bg-red-50 text-red-700 border-red-200";
        }
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
        } catch {
            return dateStr;
        }
    };

    const renderOrderCard = (order) => {
        const productImage = order.sampleImages?.[0] || null;
        const statusColor = getStatusColor(order.status);

        return (
            <article
                key={order.id}
                className="bg-white rounded-[26px] border border-[#E4D8C3] overflow-hidden shadow-[0_10px_26px_rgba(148,114,80,0.18)] hover:shadow-[0_16px_40px_rgba(148,114,80,0.26)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/customer/orders/${order.id}`)}
            >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-[#FFF7E6] via-[#FDF8F0] to-[#E8F2EA] border-b border-[#E4D8C3]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                <span className="text-[10px] uppercase tracking-[0.22em] text-[#8C6B3F] font-medium">
                                    Mã đơn
                                </span>
                                <p className="heading-font text-[16px] text-[#1B4332] font-semibold mt-0.5">
                                    {order.code || `#${order.id}`}
                                </p>
                            </div>
                            {order.receive && (
                                <div className="flex-shrink-0 ml-4 pl-4 border-l border-[#E4D8C3]">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] block">
                                        Ngày đặt
                                    </span>
                                    <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                                        {formatDate(order.receive)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${statusColor}`}>
                                {order.status}
                            </span>
                            {order.invoiceId && (
                                <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase border border-purple-200">
                                    HĐ
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex gap-4">
                    <div className="w-24 h-24 rounded-[16px] border border-[#E4D8C3] bg-gradient-to-br from-[#F8F4EC] to-[#FFF7E6] flex-shrink-0 overflow-hidden shadow-sm">
                        {productImage ? (
                            <img
                                src={productImage}
                                alt={order.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-[10px] uppercase tracking-wider" style={{ display: productImage ? 'none' : 'flex' }}>
                            {order.productType || "Sản phẩm"}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="heading-font text-[17px] text-[#1B4332] font-semibold leading-tight mb-2">
                            {order.productName || "Sản phẩm may đo"}
                        </h4>
                        {order.description && (
                            <p className="text-[12px] text-[#6B7280] line-clamp-2 mb-3">
                                {order.description}
                            </p>
                        )}
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF]">
                                Tổng tiền
                            </span>
                            <span className="text-[20px] font-bold text-[#1B4332]">
                                {formatCurrency(order.total)}
                            </span>
                        </div>
                        {order.depositAmount > 0 && (
                            <p className="text-[11px] text-[#6B7280] mt-1">
                                Đã cọc: {formatCurrency(order.depositAmount)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-[#E4D8C3] bg-gradient-to-b from-white to-[#F8F4EC] flex gap-3">
                    {order.invoiceId && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customer/invoices/${order.invoiceId}`);
                            }}
                            className="px-4 py-2.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[12px] font-semibold hover:bg-purple-100 hover:border-purple-300 transition-all flex items-center gap-1.5"
                        >
                            <span>🧾</span>
                            <span>Hóa đơn</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/orders/${order.id}`);
                        }}
                        className="flex-1 px-4 py-2.5 rounded-full bg-[#1B4332] text-white text-[12px] font-semibold hover:bg-[#133021] transition-all flex items-center justify-center gap-1.5"
                    >
                        <span>Xem chi tiết</span>
                        <span>→</span>
                    </button>
                </div>
            </article>
        );
    };

    return (
        <div className="space-y-6">
            {/* Filter tabs */}
            <div className="flex gap-3 border-b-2 border-[#E4D8C3] pb-4">
                <button
                    onClick={() => setOrderType("tailoring")}
                    className={`px-6 py-3 rounded-full text-[13px] font-semibold transition-all ${orderType === "tailoring"
                            ? "bg-[#1B4332] text-white shadow-md"
                            : "bg-[#F8F4EC] text-[#6B7280] hover:bg-[#FFF7E6] hover:text-[#1B4332]"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <span>✂️</span>
                        <span>Đơn đặt may</span>
                    </span>
                </button>
                <button
                    onClick={() => setOrderType("fabric")}
                    className={`px-6 py-3 rounded-full text-[13px] font-semibold transition-all ${orderType === "fabric"
                            ? "bg-[#1B4332] text-white shadow-md"
                            : "bg-[#F8F4EC] text-[#6B7280] hover:bg-[#FFF7E6] hover:text-[#1B4332]"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <span>🧵</span>
                        <span>Đơn mua vải</span>
                    </span>
                </button>
            </div>

            {/* Loading state */}
            {loadingOrders && (
                <div className="text-center py-16">
                    <div className="inline-flex items-center gap-3 text-[#6B7280]">
                        <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[14px]">Đang tải danh sách đơn hàng...</span>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loadingOrders && currentOrders.length === 0 && (
                <div className="text-center py-16">
                    <div className="inline-block p-6 rounded-[24px] bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] border border-[#E4D8C3]">
                        <p className="text-[48px] mb-3">📦</p>
                        <p className="text-[16px] font-semibold text-[#1B4332] mb-1">
                            Chưa có đơn hàng nào
                        </p>
                        <p className="text-[13px] text-[#6B7280] mb-4">
                            {orderType === "tailoring"
                                ? "Bạn chưa có đơn đặt may nào."
                                : "Bạn chưa có đơn mua vải nào."}
                        </p>
                        <button
                            onClick={() => navigate("/customer/order")}
                            className="px-5 py-2.5 rounded-full bg-[#1B4332] text-white text-[13px] font-semibold hover:bg-[#133021] transition-all"
                        >
                            + Đặt may mới
                        </button>
                    </div>
                </div>
            )}

            {/* Orders grid */}
            {!loadingOrders && currentOrders.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                    {currentOrders.map((order) => renderOrderCard(order))}
                </div>
            )}
        </div>
    );
}
