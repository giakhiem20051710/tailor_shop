import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";

export default function InternationalPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || { 
    items: [], 
    total: 0, 
    discount: 0, 
    subtotal: 0,
    formData: {},
    paymentMethod: "international"
  };

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const subtotal = orderData.subtotal || 0;
  const discount = orderData.discount || 0;
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const rewardPoints = Math.floor(finalTotal / 4000);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

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

  const handlePayment = (e) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      alert("Vui lòng điền đầy đủ thông tin thẻ");
      return;
    }
    setIsProcessing(true);
    // Giả lập xử lý thanh toán
    setTimeout(() => {
      alert("Thanh toán thành công!");
      navigate("/customer/dashboard");
    }, 2000);
  };

  const handleCancelTransaction = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy giao dịch này?")) {
      navigate("/checkout", { state: orderData });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />
      
      <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] py-3">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-center text-[13px] text-[#111827]">
            Vui lòng không tắt trình duyệt cho đến khi giao dịch được xác nhận!
          </p>
        </div>
      </div>

      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Payment Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                Thanh toán bằng thẻ quốc tế
              </h2>

              {/* Payment Icons */}
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#1A1F71] text-white px-4 py-2 rounded text-[12px] font-semibold">VISA</div>
                <div className="bg-[#EB001B] text-white px-4 py-2 rounded text-[12px] font-semibold">Mastercard</div>
                <div className="bg-[#1A1F71] text-white px-4 py-2 rounded text-[12px] font-semibold">JCB</div>
                <div className="bg-[#006FCF] text-white px-4 py-2 rounded text-[12px] font-semibold">AMEX</div>
              </div>

              {/* Payment Methods */}
              <div className="flex items-center gap-4 mb-6 text-[14px] text-[#6B7280]">
                <span>Hỗ trợ:</span>
                <span>Apple Pay</span>
                <span>•</span>
                <span>Google Pay</span>
                <span>•</span>
                <span>Samsung Pay</span>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-2">
                    Số thẻ
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent text-[14px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-2">
                    Tên chủ thẻ
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent text-[14px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-2">
                      Ngày hết hạn
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setExpiryDate(value);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent text-[14px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent text-[14px]"
                      required
                    />
                  </div>
                </div>

                <div className="bg-[#F9FAFB] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-[#6B7280]">Số tiền thanh toán</span>
                    <span className="text-[20px] font-bold text-[#DC2626]">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || timeLeft <= 0}
                  className="w-full py-3 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Đang xử lý..." : "Thanh toán"}
                </button>
              </form>

              <div className="mt-4 text-[12px] text-[#6B7280] text-center">
                🔒 Thanh toán được bảo mật bởi SSL
              </div>
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
                    <span className="text-[18px] font-semibold text-[#DC2626]">
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







