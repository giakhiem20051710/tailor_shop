import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta.jsx";

export default function CODPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || { 
    items: [], 
    total: 0, 
    discount: 0, 
    subtotal: 0,
    formData: {},
    paymentMethod: "cod"
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // SEO Meta Tags
  usePageMeta({
    title: "Thanh toán khi nhận hàng (COD) | My Hiền Tailor",
    description: "Thanh toán đơn hàng vải may đo khi nhận hàng (COD). Thanh toán tiền mặt khi nhận được sản phẩm tại nhà.",
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const subtotal = orderData.subtotal || 0;
  const discount = orderData.discount || 0;
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const rewardPoints = Math.floor(finalTotal / 4000);

  // Auto show success modal when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmOrder = () => {
    setShowSuccessModal(true);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate("/customer/dashboard");
  };

  const handleViewOrder = () => {
    setShowSuccessModal(false);
    navigate("/customer/dashboard", { state: { activeTab: "orders" } });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />
      
      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all"
            style={{
              animation: 'slideUp 0.4s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon Header */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg transform transition-all hover:scale-110"
                style={{
                  animation: 'scaleIn 0.5s ease-out 0.2s both'
                }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đặt hàng thành công!
              </h2>
              <p className="text-sm text-gray-600">
                Đơn hàng của bạn đã được tiếp nhận và đang được xử lý
              </p>
            </div>

            {/* Order Summary */}
            <div className="px-6 py-4 bg-gray-50 border-y border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Mã đơn hàng</span>
                  <span className="font-semibold text-gray-900">#{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tổng tiền</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-semibold text-red-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-base font-semibold text-gray-900">Cần thanh toán</span>
                  <span className="text-xl font-bold text-red-600">{formatPrice(finalTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-gray-600">Điểm thưởng</span>
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    +{rewardPoints}
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="px-6 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💰</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Thanh toán khi nhận hàng (COD)
                    </h3>
                    <p className="text-xs text-gray-700 mb-2">
                      Bạn sẽ thanh toán <span className="font-bold text-red-600">{formatPrice(finalTotal)}</span> khi nhận hàng
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Đơn hàng sẽ được giao trong 2-5 ngày làm việc</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Vui lòng chuẩn bị đúng số tiền khi nhận hàng</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Bạn có thể kiểm tra hàng trước khi thanh toán</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleViewOrder}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-sm hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Xem đơn hàng của tôi
                </button>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full py-2.5 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                >
                  Về trang chủ
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="px-6 pb-4">
              <button
                onClick={handleCloseModal}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-4xl mx-auto px-5 lg:px-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#10B981] rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-[#111827] mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-[16px] text-[#6B7280]">
              Đơn hàng của bạn đã được tiếp nhận và đang được xử lý
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
              Thông tin đơn hàng
            </h2>
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
                <span className="text-[14px] text-[#6B7280]">Phí vận chuyển</span>
                <span className="text-[14px] text-[#111827] font-medium">
                  {formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                <span className="text-[16px] font-semibold text-[#111827]">Cần thanh toán</span>
                <span className="text-[20px] font-bold text-[#DC2626]">
                  {formatPrice(finalTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[#6B7280]">Điểm thưởng</span>
                <span className="text-[14px] text-[#111827] font-medium flex items-center gap-1">
                  +{rewardPoints}
                  <svg className="w-4 h-4 text-[#FCD34D]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💰</div>
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
                  Thanh toán khi nhận hàng (COD)
                </h3>
                <p className="text-[14px] text-[#6B7280] mb-3">
                  Bạn sẽ thanh toán số tiền <span className="font-semibold text-[#DC2626]">{formatPrice(finalTotal)}</span> khi nhận hàng.
                </p>
                <ul className="text-[13px] text-[#6B7280] space-y-1">
                  <li>• Đơn hàng sẽ được giao trong 2-5 ngày làm việc</li>
                  <li>• Vui lòng chuẩn bị đúng số tiền khi nhận hàng</li>
                  <li>• Bạn có thể kiểm tra hàng trước khi thanh toán</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          {orderData.formData && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                Thông tin giao hàng
              </h2>
              <div className="space-y-2 text-[14px]">
                <p><span className="text-[#6B7280]">Người nhận:</span> <span className="text-[#111827] font-medium">{orderData.formData.fullName}</span></p>
                <p><span className="text-[#6B7280]">Số điện thoại:</span> <span className="text-[#111827] font-medium">{orderData.formData.phone}</span></p>
                {orderData.formData.email && (
                  <p><span className="text-[#6B7280]">Email:</span> <span className="text-[#111827] font-medium">{orderData.formData.email}</span></p>
                )}
                {orderData.formData.address && (
                  <p><span className="text-[#6B7280]">Địa chỉ:</span> <span className="text-[#111827] font-medium">{orderData.formData.address}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="flex-1 py-3 px-6 border border-[#E5E7EB] rounded-lg text-[#111827] font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              Về trang chủ
            </button>
            <button
              onClick={handleConfirmOrder}
              className="flex-1 py-3 px-6 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors"
            >
              Xác nhận đơn hàng
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}








