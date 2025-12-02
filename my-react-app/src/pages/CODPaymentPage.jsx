import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const subtotal = orderData.subtotal || 0;
  const discount = orderData.discount || 0;
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const rewardPoints = Math.floor(finalTotal / 4000);

  const handleConfirmOrder = () => {
    // Xử lý xác nhận đơn hàng COD
    alert("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
    navigate("/customer/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />
      
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







