import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta.jsx";

export default function SandboxPaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const orderData = location.state || {
        items: [],
        total: 0,
        discount: 0,
        subtotal: 0,
        formData: {},
        paymentMethod: "sandbox"
    };

    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState(null);

    // Check if we're returning from sandbox gateway
    const status = searchParams.get("status");
    const ref = searchParams.get("ref");
    const invoiceId = searchParams.get("invoiceId");

    usePageMeta({
        title: "Thanh toán Sandbox | My Hiền Tailor",
        description: "Thanh toán đơn hàng qua cổng thanh toán Sandbox (Test). Môi trường thử nghiệm.",
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    };

    const subtotal = orderData.subtotal || 0;
    const discount = orderData.discount || 0;
    const shippingFee = 0;
    const finalTotal = Math.max(0, subtotal - discount + shippingFee);
    const rewardPoints = Math.floor(finalTotal / 4000);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            // In real scenario, call backend to create payment and get URL
            // For now, redirect to backend sandbox gateway directly (when integrated with invoice)
            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else {
                // Demo: construct URL manually for testing
                const backendUrl = "http://localhost:8083";
                const ref = "SANDBOX-" + Date.now();
                const amount = finalTotal;
                const returnUrl = encodeURIComponent(window.location.origin + "/payment/sandbox?fromGateway=true");

                const redirectUrl = `${backendUrl}/api/v1/sandbox/payment/pay?ref=${ref}&amount=${amount}&returnUrl=${returnUrl}`;
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.error("Payment error:", error);
            setIsProcessing(false);
        }
    };

    const handleCancelTransaction = () => {
        if (window.confirm("Bạn có chắc chắn muốn hủy giao dịch này?")) {
            navigate("/checkout", { state: orderData });
        }
    };

    // If returning from gateway with status
    if (status) {
        return (
            <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
                <Header />
                <main className="pt-[170px] md:pt-[190px] pb-16">
                    <div className="max-w-2xl mx-auto px-5 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            {status === "success" ? (
                                <>
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold text-[#111827] mb-2">Thanh toán thành công!</h1>
                                    <p className="text-[#6B7280] mb-6">
                                        Mã giao dịch: <span className="font-mono text-[#111827]">{ref}</span>
                                    </p>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                        <p className="text-green-800 text-sm">
                                            ✓ Đơn hàng đã được xác nhận và thanh toán thành công.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold text-[#111827] mb-2">Thanh toán thất bại</h1>
                                    <p className="text-[#6B7280] mb-6">
                                        Giao dịch đã bị huỷ hoặc không thành công.
                                    </p>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                        <p className="text-red-800 text-sm">
                                            Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => navigate("/customer/orders")}
                                    className="px-6 py-3 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#14532d] transition-colors"
                                >
                                    Xem đơn hàng
                                </button>
                                <button
                                    onClick={() => navigate("/")}
                                    className="px-6 py-3 border border-[#D1D5DB] text-[#374151] rounded-lg font-medium hover:border-[#111827] transition-colors"
                                >
                                    Về trang chủ
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
            <Header />

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b py-3">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <p className="text-center text-[13px] text-white font-medium">
                        🧪 Môi trường Sandbox - Không có giao dịch thật được thực hiện
                    </p>
                </div>
            </div>

            <main className="pt-[170px] md:pt-[190px] pb-16">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Payment Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                                Thanh toán qua Sandbox Gateway
                            </h2>

                            {/* Sandbox Logo */}
                            <div className="flex items-center justify-center mb-6">
                                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-6">
                                    <div className="text-[48px] mb-2 text-center">🧪</div>
                                    <div className="text-[18px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                        SANDBOX
                                    </div>
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="space-y-4 mb-6">
                                <div className="bg-[#F9FAFB] rounded-lg p-4">
                                    <h3 className="text-[14px] font-semibold text-[#111827] mb-2">
                                        Hướng dẫn thanh toán:
                                    </h3>
                                    <ul className="text-[13px] text-[#6B7280] space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600">1.</span>
                                            <span>Nhấn nút "Thanh toán" để chuyển đến trang Sandbox Gateway</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600">2.</span>
                                            <span>Chọn "Thanh toán thành công" hoặc "Huỷ" để mô phỏng kết quả</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-600">3.</span>
                                            <span>Bạn sẽ được chuyển về trang này với kết quả tương ứng</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-purple-600">ℹ️</span>
                                        <span className="text-[14px] font-medium text-purple-800">Lưu ý</span>
                                    </div>
                                    <p className="text-[13px] text-purple-700">
                                        Đây là môi trường test. Không có tiền thật được giao dịch.
                                        Sử dụng để kiểm tra luồng thanh toán trước khi tích hợp cổng thanh toán thật.
                                    </p>
                                </div>

                                <div className="border border-[#E5E7EB] rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[14px] text-[#6B7280]">Số tiền thanh toán</span>
                                        <span className="text-[20px] font-bold text-purple-600">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Button */}
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || timeLeft <= 0}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "Đang xử lý..." : "🧪 Thanh toán qua Sandbox"}
                            </button>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="space-y-6">
                            {/* Timer */}
                            <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
                                <p className="text-[13px] text-[#111827] mb-2">
                                    Giao dịch kết thúc trong
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="text-center">
                                        <div className="text-[32px] font-bold text-[#111827]">
                                            {String(minutes).padStart(2, "0")}
                                        </div>
                                        <div className="text-[12px] text-[#6B7280]">Phút</div>
                                    </div>
                                    <div className="text-[32px] font-bold text-[#111827]">:</div>
                                    <div className="text-center">
                                        <div className="text-[32px] font-bold text-[#111827]">
                                            {String(seconds).padStart(2, "0")}
                                        </div>
                                        <div className="text-[12px] text-[#6B7280]">Giây</div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-[16px] font-semibold text-[#111827] mb-4">
                                    Thông tin đơn hàng
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[14px] text-[#6B7280]">Tổng tiền</span>
                                        <span className="text-[14px] text-[#111827] font-medium">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[14px] text-[#6B7280]">Tổng khuyến mãi</span>
                                        <span className="text-[14px] text-[#DC2626] font-medium">
                                            -{formatPrice(discount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[14px] text-[#6B7280]">Cần thanh toán</span>
                                        <span className="text-[18px] font-semibold text-purple-600">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                                        <span className="text-[14px] text-[#6B7280]">Điểm thưởng</span>
                                        <span className="text-[14px] text-[#111827] font-medium flex items-center gap-1">
                                            +{rewardPoints}
                                            <svg className="w-4 h-4 text-[#FCD34D]" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCancelTransaction}
                                    className="w-full mt-6 py-2.5 text-[14px] text-[#6B7280] hover:text-[#DC2626] transition-colors"
                                >
                                    Huỷ giao dịch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
