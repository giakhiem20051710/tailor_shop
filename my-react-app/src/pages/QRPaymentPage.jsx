import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";

export default function QRPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || { 
    items: [], 
    total: 0, 
    discount: 0, 
    subtotal: 0,
    formData: {},
    paymentMethod: "bank_qr"
  };

  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút = 900 giây
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [transferContent, setTransferContent] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const subtotal = orderData.subtotal || 0;
  const discount = orderData.discount || 0;
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const rewardPoints = Math.floor(finalTotal / 4000);

  // Countdown timer
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

  // Tạo QR code và nội dung chuyển khoản
  useEffect(() => {
    // Tạo mã giao dịch ngẫu nhiên
    const transactionId = `303762133117646198${Date.now()}`;
    setTransferContent(transactionId);

    // Tạo QR code sử dụng VietQR API
    const bankAccount = "970422";
    const accountName = "CN Công Ty Cổ Phần Bán Lẻ Kỹ Thuật Số FPT Tại Hà Nội";
    const amount = finalTotal;
    const description = transactionId;

    // Sử dụng VietQR.io API
    const qrUrl = `https://img.vietqr.io/image/MB-970422-${amount}-compact2.png?accountName=${encodeURIComponent(accountName)}&addInfo=${encodeURIComponent(description)}`;
    setQrCodeUrl(qrUrl);
  }, [finalTotal]);

  const handleCopyTransferContent = () => {
    navigator.clipboard.writeText(transferContent);
    alert("Đã sao chép nội dung chuyển khoản!");
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = "qr-code-payment.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCancelTransaction = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy giao dịch này?")) {
      navigate("/checkout", { state: orderData });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />
      
      {/* Banner cảnh báo */}
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
            {/* Cột trái - Hướng dẫn thanh toán */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                Quét hoặc tải mã QR để thanh toán bằng ứng dụng ngân hàng
              </h2>

              {/* Logo VIETQR và napas */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[#DC2626] font-semibold text-[16px]">VIETQR™</span>
                  <svg className="w-5 h-5 text-[#DC2626]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-[#2563EB] font-semibold text-[16px]">napas 247</div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="border-2 border-dashed border-[#FCA5A5] p-4 rounded-lg bg-white">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-[280px] h-[280px]"
                    />
                  ) : (
                    <div className="w-[280px] h-[280px] bg-[#F3F4F6] flex items-center justify-center">
                      <p className="text-[#6B7280] text-[14px]">Đang tạo QR code...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Link tải xuống QR */}
              <div className="text-center mb-6">
                <button
                  onClick={handleDownloadQR}
                  className="text-[#DC2626] text-[14px] hover:underline flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống mã QR
                </button>
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1">
                    Ngân hàng
                  </label>
                  <p className="text-[14px] text-[#111827]">
                    Ngân hàng Thương mại Cổ phần Quân đội
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1">
                    Chủ tài khoản
                  </label>
                  <p className="text-[14px] text-[#111827]">
                    CN Công Ty Cổ Phần Bán Lẻ Kỹ Thuật Số FPT Tại Hà Nội
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1">
                    Nội dung chuyển khoản
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] text-[#111827] flex-1 break-all">
                      {transferContent}
                    </p>
                    <button
                      onClick={handleCopyTransferContent}
                      className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-[13px] rounded-lg transition-colors whitespace-nowrap"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1">
                    Số tiền thanh toán
                  </label>
                  <p className="text-[18px] font-semibold text-[#DC2626]">
                    {formatPrice(finalTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột phải - Thông tin đơn hàng và timer */}
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

              {/* Thông tin đơn hàng */}
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
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-[#6B7280]">Số tiền cần đặt cọc</span>
                    <span className="text-[14px] text-[#111827] font-medium">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-[#6B7280]">Thanh toán khi nhận hàng</span>
                    <span className="text-[14px] text-[#111827] font-medium">0₫</span>
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

                {/* Nút hủy giao dịch */}
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

