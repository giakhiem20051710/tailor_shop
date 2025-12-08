import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta.jsx";
import { vietnamWardsData } from "../data/vietnamWardsData.js";
import { addOrder } from "../utils/orderStorage";
import { getCurrentUser } from "../utils/authStorage";

export default function FabricCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || { items: [], total: 0, discount: 0, subtotal: 0 };

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    deliveryMethod: "home", // "home" or "store"
    province: "",
    ward: "",
    address: "",
    note: "",
    askOtherReceive: false,
    requestTechSupport: false,
    issueInvoice: false,
    paymentMethod: "cod", // cod, bank_qr, vnpay, etc.
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressTab, setAddressTab] = useState("after"); // "after" or "before"
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [addressStep, setAddressStep] = useState("province"); // "province" or "ward" or "address"
  const [wardSearch, setWardSearch] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [suggestedWards, setSuggestedWards] = useState([]);
  const [selectedSuggestedWard, setSelectedSuggestedWard] = useState("");

  // SEO Meta Tags
  usePageMeta({
    title: "Thanh toán | My Hiền Tailor",
    description: "Hoàn tất đơn hàng vải may đo của bạn tại My Hiền Tailor. Nhập thông tin giao hàng, chọn phương thức thanh toán và xác nhận đơn hàng.",
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const getPriceValue = (priceStr) => {
    const match = priceStr?.match(/[\d.]+/);
    if (match) {
      return parseInt(match[0].replace(/\./g, ""), 10);
    }
    return 0;
  };

  // Danh sách tỉnh/thành phố Việt Nam - Sau sáp nhập (rút gọn)
  const provincesAfter = [
    "Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Thành Phố Huế",
    "Tỉnh An Giang",
    "Tỉnh Bắc Ninh",
    "Tỉnh Cà Mau",
    "Tỉnh Cao Bằng",
    "Tỉnh Đắk Lắk",
    "Tỉnh Điện Biên",
    "Tỉnh Đồng Nai",
    "Tỉnh Đồng Tháp",
    "Tỉnh Gia Lai",
    "Tỉnh Hà Tĩnh",
    "Tỉnh Hưng Yên",
    "Tỉnh Khánh Hòa",
    "Tỉnh Lai Châu",
    "Tỉnh Lâm Đồng",
    "Tỉnh Lạng Sơn",
    "Tỉnh Lào Cai",
    "Tỉnh Nghệ An",
    "Tỉnh Ninh Bình",
    "Tỉnh Phú Thọ",
    "Tỉnh Quảng Ngãi",
    "Tỉnh Quảng Ninh",
    "Tỉnh Quảng Trị",
    "Tỉnh Sơn La",
    "Tỉnh Tây Ninh",
    "Tỉnh Thái Nguyên",
    "Tỉnh Thanh Hóa",
    "Tỉnh Tuyên Quang",
    "Tỉnh Vĩnh Long",
  ];

  // Danh sách đầy đủ 63 tỉnh/thành phố Việt Nam - Trước sáp nhập
  const provincesBefore = [
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bạc Liêu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Cần Thơ",
    "Đà Nẵng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Nội",
    "Hà Tĩnh",
    "Hải Dương",
    "Hải Phòng",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "TP. Hồ Chí Minh",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
  ];

  const subtotal = orderData.subtotal || 0;
  const discount = orderData.discount || 0;
  const shippingFee = 0; // Miễn phí
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const rewardPoints = Math.floor(finalTotal / 4000);

  // Sử dụng dữ liệu phường/xã đầy đủ từ file import
  const wardsData = vietnamWardsData;

  // Chọn danh sách theo tab
  const currentProvinces = addressTab === "after" ? provincesAfter : provincesBefore;

  // Lọc tỉnh/thành phố theo từ khóa tìm kiếm
  const filteredProvinces = currentProvinces.filter((province) =>
    province.toLowerCase().includes(addressSearch.toLowerCase())
  );

  // Lấy danh sách phường/xã cho tỉnh đã chọn
  const getWardsForProvince = (province) => {
    if (!province) return [];
    
    // Normalize tên tỉnh (bỏ "Tỉnh ", "Thành Phố ", "TP. ")
    const normalizeProvince = (name) => {
      return name
        .replace(/^Tỉnh\s+/i, "")
        .replace(/^Thành Phố\s+/i, "")
        .replace(/^TP\.\s*/i, "")
        .trim();
    };
    
    const normalizedProvince = normalizeProvince(province);
    
    // Tìm key trong wardsData
    const key = Object.keys(wardsData).find((k) => {
      const normalizedKey = normalizeProvince(k);
      return (
        normalizedKey === normalizedProvince ||
        normalizedKey.toLowerCase() === normalizedProvince.toLowerCase() ||
        normalizedProvince.toLowerCase().includes(normalizedKey.toLowerCase()) ||
        normalizedKey.toLowerCase().includes(normalizedProvince.toLowerCase())
      );
    });
    
    return key ? wardsData[key] : [];
  };

  const currentWards = getWardsForProvince(selectedProvince);
  const filteredWards = currentWards.filter((ward) =>
    ward.toLowerCase().includes(wardSearch.toLowerCase())
  );

  // Tạo danh sách phường/xã gợi ý dựa trên địa chỉ cụ thể
  const generateSuggestedWards = (address, province, wards) => {
    if (!address || !address.trim() || !province || wards.length === 0) {
      return [];
    }
    
    const addressTrimmed = address.trim();
    // Tạo danh sách gợi ý với format: "[địa chỉ], [Phường/Xã], [Tỉnh/Thành phố]"
    return wards.map((ward) => ({
      fullAddress: `${addressTrimmed}, ${ward}, ${province}`,
      ward: ward,
      address: addressTrimmed,
      province: province,
    }));
  };

  // Cập nhật danh sách gợi ý khi địa chỉ cụ thể thay đổi
  useEffect(() => {
    if (addressStep === "address" && detailedAddress && selectedProvince && selectedWard) {
      const wards = getWardsForProvince(selectedProvince);
      const suggestions = generateSuggestedWards(detailedAddress, selectedProvince, wards);
      setSuggestedWards(suggestions);
    } else {
      setSuggestedWards([]);
    }
  }, [detailedAddress, selectedProvince, selectedWard, addressStep]);

  // Chia danh sách thành 2 cột
  const leftColumn = addressStep === "province"
    ? filteredProvinces.filter((_, index) => index % 2 === 0)
    : filteredWards.filter((_, index) => index % 2 === 0);
  const rightColumn = addressStep === "province"
    ? filteredProvinces.filter((_, index) => index % 2 === 1)
    : filteredWards.filter((_, index) => index % 2 === 1);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = () => {
    if (!formData.fullName || !formData.phone) {
      alert("Vui lòng điền đầy đủ thông tin người đặt hàng");
      return;
    }
    if (formData.deliveryMethod === "home" && !formData.address) {
      alert("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    // Tạo đơn hàng vải trong hệ thống chung để hiển thị ở Customer Dashboard
    const currentUser = getCurrentUser();
    const shippingAddress =
      formData.deliveryMethod === "home"
        ? `${formData.address || ""}${
            formData.province ? `, ${formData.province}` : ""
          }`.trim()
        : "Nhận tại cửa hàng";

    const fabricDescription = (orderData.items || [])
      .map((item) => `${item.name} x${item.quantity || 1}`)
      .join("; ");

    addOrder({
      name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      address: shippingAddress,
      productName:
        orderData.items && orderData.items.length > 0
          ? `Đơn mua vải (${orderData.items.length} sản phẩm)`
          : "Đơn mua vải",
      productType: "fabric",
      description: fabricDescription,
      budget: finalTotal.toString(),
      dueDate: "",
      notes: formData.note,
      measurements: null,
      appointmentType: formData.deliveryMethod === "store" ? "pickup" : "delivery",
      appointmentTime: null,
      appointmentDate: "",
      promoCode: null,
      receive: new Date().toISOString().split("T")[0],
      due: "",
      total: finalTotal,
      status: "Mới",
      sampleImages: null,
      customerId: currentUser?.username,
      isFabricOrder: true,
      items: orderData.items || [], // Lưu items để có thể lấy hình ảnh
    });

    // Điều hướng đến trang thanh toán tương ứng với phương thức đã chọn
    const paymentRoutes = {
      cod: "/payment/cod",
      bank_qr: "/payment/qr",
      vnpay: "/payment/vnpay",
      international: "/payment/international",
      mbbank: "/payment/mbbank",
      zalopay: "/payment/zalopay",
      momo: "/payment/momo",
    };

    const paymentRoute = paymentRoutes[formData.paymentMethod];
    
    if (paymentRoute) {
      navigate(paymentRoute, {
        state: {
          ...orderData,
          formData: formData,
          paymentMethod: formData.paymentMethod
        }
      });
      return;
    }
    
    // Fallback cho các phương thức khác
    alert("Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.");
    navigate("/customer/dashboard");
  };

  if (!orderData.items || orderData.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header />
        <main className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center py-12">
            <p className="text-[#6B7280] mb-4">Không có sản phẩm nào trong đơn hàng</p>
            <button
              onClick={() => navigate("/cart")}
              className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#133021] transition-colors"
            >
              Quay lại giỏ hàng
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {/* Back to cart */}
          <button
            onClick={() => navigate("/cart")}
            className="text-[13px] text-[#6B7280] hover:text-[#111827] mb-6 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Quay lại giỏ hàng
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products in Order */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">
                  Sản phẩm trong đơn ({orderData.items.length})
                </h2>
                <div className="space-y-4">
                  {orderData.items.map((item) => {
                    const priceValue = getPriceValue(item.price);
                    const originalPrice = Math.round(priceValue * 1.5);
                    return (
                      <div key={item.key} className="flex gap-4 pb-4 border-b border-[#E5E7EB] last:border-b-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-medium text-[#111827] mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[12px] text-[#6B7280] mb-2">Màu: Mặc định</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[14px] font-semibold text-[#F97316]">
                                {formatPrice(priceValue)}
                              </span>
                              <span className="text-[12px] text-[#9CA3AF] line-through ml-2">
                                {formatPrice(originalPrice)}
                              </span>
                            </div>
                            <span className="text-[13px] text-[#6B7280]">x{item.quantity || 1}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">
                  Người đặt hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-1">
                      Họ và tên <span className="text-[#F97316]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316]"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-1">
                      Số điện thoại <span className="text-[#F97316]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316]"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-1">
                      Email (Không bắt buộc)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316]"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">
                  Hình thức nhận hàng
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="home"
                        checked={formData.deliveryMethod === "home"}
                        onChange={(e) => handleInputChange("deliveryMethod", e.target.value)}
                        className="w-4 h-4 text-[#F97316] focus:ring-[#F97316]"
                      />
                      <span className="text-[13px] text-[#111827]">Giao hàng tận nơi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="store"
                        checked={formData.deliveryMethod === "store"}
                        onChange={(e) => handleInputChange("deliveryMethod", e.target.value)}
                        className="w-4 h-4 text-[#F97316] focus:ring-[#F97316]"
                      />
                      <span className="text-[13px] text-[#111827]">Nhận tại cửa hàng</span>
                    </label>
                  </div>

                  {formData.deliveryMethod === "home" && (
                    <div>
                      <label className="block text-[13px] font-medium text-[#111827] mb-1">
                        Tỉnh/Thành Phố, Phường Xã <span className="text-[#F97316]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.province}
                          readOnly
                          onClick={() => {
                            setShowAddressModal(true);
                            setAddressStep("province");
                            setSelectedProvince("");
                            setSelectedWard("");
                            setAddressSearch("");
                            setWardSearch("");
                            setDetailedAddress("");
                            setSuggestedWards([]);
                            setSelectedSuggestedWard("");
                          }}
                          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316] pr-10 cursor-pointer"
                          placeholder="Chọn tỉnh/thành phố, phường/xã"
                        />
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {formData.deliveryMethod === "home" && (
                    <div>
                      <label className="block text-[13px] font-medium text-[#111827] mb-1">
                        Địa chỉ chi tiết
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316]"
                        placeholder="Số nhà, tên đường"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-medium text-[#111827] mb-1">
                      Ghi chú (Ví dụ: Hãy gọi tôi khi chuẩn bị hàng xong)
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.note}
                        onChange={(e) => {
                          handleInputChange("note", e.target.value);
                        }}
                        maxLength={128}
                        rows={3}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316] resize-none"
                        placeholder="Nhập ghi chú..."
                      />
                      <span className="absolute bottom-2 right-2 text-[11px] text-[#9CA3AF]">
                        {formData.note.length}/128
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.askOtherReceive}
                        onChange={(e) => handleInputChange("askOtherReceive", e.target.checked)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316]"
                      />
                      <span className="text-[13px] text-[#111827]">
                        Nhờ người khác nhận hàng
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requestTechSupport}
                        onChange={(e) => handleInputChange("requestTechSupport", e.target.checked)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316]"
                      />
                      <span className="text-[13px] text-[#111827]">
                        Yêu cầu hỗ trợ kỹ thuật
                      </span>
                      <svg
                        className="w-4 h-4 text-[#6B7280]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </label>
                  </div>
                </div>
              </div>

              {/* Electronic Invoice */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827]">
                    Xuất hóa đơn điện tử
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.issueInvoice}
                      onChange={(e) => handleInputChange("issueInvoice", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#F97316] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
                  </label>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  {[
                    { value: "cod", label: "Thanh toán khi nhận hàng", icon: "💰" },
                    { value: "bank_qr", label: "Chuyển khoản ngân hàng (QR Code)", icon: "📱" },
                    { value: "vnpay", label: "Thẻ ATM nội địa (qua VNPAY)", icon: "💳" },
                    { value: "international", label: "Thẻ Quốc tế Visa, Master, JCB, AMEX, Apple Pay, Google pay, Samsung Pay", icon: "🌐", offers: 2 },
                    { value: "mbbank", label: "Ngân hàng thương mại cổ phần Quân đội", icon: "🏦", offers: 1 },
                    { value: "zalopay", label: "Ví ZaloPay", icon: "💙" },
                    { value: "momo", label: "Ví điện tử MoMo", icon: "💖" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#F97316] transition-colors"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                        className="w-4 h-4 text-[#F97316] focus:ring-[#F97316]"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <span className="text-[13px] text-[#111827]">{method.label}</span>
                        {method.offers && (
                          <span className="ml-2 text-[11px] text-[#F59E0B] font-medium">
                            {method.offers} ưu đãi
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 sticky top-[190px]">
                {/* Promo Code */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB] cursor-pointer hover:text-[#F97316] transition-colors">
                  <svg
                    className="w-5 h-5 text-[#6B7280]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span className="text-[13px] text-[#111827] flex-1">
                    Chọn hoặc nhập ưu đãi
                  </span>
                  <svg
                    className="w-4 h-4 text-[#6B7280]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Reward Points */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
                  <svg
                    className="w-5 h-5 text-[#F59E0B]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[13px] text-[#111827]">
                    Đăng nhập để sử dụng điểm thưởng
                  </span>
                </div>

                {/* Order Information */}
                <div className="mb-4">
                  <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                    Thông tin đơn hàng
                  </h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Tổng tiền:</span>
                      <span className="font-medium text-[#111827]">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Tổng khuyến mãi:</span>
                      <span className="font-medium text-[#F97316]">
                        -{formatPrice(discount)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="pl-4 space-y-1 text-[12px] text-[#6B7280]">
                        <div className="flex justify-between">
                          <span>Giảm giá sản phẩm:</span>
                          <span>{formatPrice(discount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Voucher:</span>
                          <span>0 ₫</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Phí vận chuyển:</span>
                      <span className="font-medium text-[#111827]">Miễn phí</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[15px] font-semibold text-[#111827]">
                        Cần thanh toán:
                      </span>
                      <span className="text-[18px] font-bold text-[#F97316]">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <svg
                        className="w-4 h-4 text-[#F59E0B]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[12px] text-[#6B7280]">
                        Điểm thưởng: +{rewardPoints}
                      </span>
                    </div>
                    <button className="text-[12px] text-[#6B7280] hover:text-[#111827] flex items-center gap-1">
                      Rút gọn
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-lg bg-[#F97316] text-white font-semibold text-[14px] hover:bg-[#EA580C] transition-colors mb-3"
                >
                  Đặt hàng
                </button>

                {/* Terms and Conditions */}
                <p className="text-[11px] text-[#6B7280] text-center">
                  Bằng việc tiến hành đặt mua hàng, bạn đồng ý với{" "}
                  <a href="#" className="text-[#F97316] hover:underline">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-[#F97316] hover:underline">
                    Chính sách xử lý dữ liệu cá nhân
                  </a>{" "}
                  của FPT Shop
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal chọn địa chỉ */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                Thêm địa chỉ nhận hàng
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setAddressSearch("");
                  setWardSearch("");
                  setAddressStep("province");
                  setSelectedProvince("");
                  setSelectedWard("");
                  setDetailedAddress("");
                }}
                className="w-8 h-8 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs - Chỉ hiển thị khi ở bước chọn tỉnh */}
            {addressStep === "province" && (
              <div className="flex border-b border-[#E5E7EB] px-4">
                <button
                  onClick={() => setAddressTab("after")}
                  className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
                    addressTab === "after"
                      ? "border-[#F97316] text-[#F97316]"
                      : "border-transparent text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  Sau sáp nhập
                </button>
                <button
                  onClick={() => setAddressTab("before")}
                  className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
                    addressTab === "before"
                      ? "border-[#F97316] text-[#F97316]"
                      : "border-transparent text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  Trước sáp nhập
                </button>
              </div>
            )}

            {/* Nút Thiết lập lại - Chỉ hiển thị khi ở bước chọn phường/xã */}
            {addressStep === "ward" && (
              <div className="px-4 py-2 border-b border-[#E5E7EB]">
                <button
                  onClick={() => {
                    setAddressStep("province");
                    setSelectedProvince("");
                    setWardSearch("");
                  }}
                  className="text-[13px] text-[#F97316] hover:underline"
                >
                  Thiết lập lại
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {addressStep === "province" ? (
                <>
                  {/* Province Selection */}
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium text-[#111827] mb-2">
                      Chọn tỉnh/thành phố
                    </label>
                    <div className="relative border-2 border-[#F97316] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!!selectedProvince}
                          readOnly
                          className="w-4 h-4 text-[#F97316]"
                        />
                        <span className="text-[13px] text-[#111827]">
                          {selectedProvince || "Chọn tỉnh/thành phố"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={addressSearch}
                        onChange={(e) => setAddressSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316] pr-10"
                        placeholder="Tìm kiếm..."
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Province List - 2 Columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Left Column */}
                    <div className="space-y-1">
                      {leftColumn.map((province) => {
                        const wards = getWardsForProvince(province);
                        return (
                          <button
                            key={province}
                            onClick={() => {
                              if (wards.length > 0) {
                                setSelectedProvince(province);
                                setAddressStep("ward");
                                setAddressSearch("");
                              } else {
                                handleInputChange("province", province);
                                setShowAddressModal(false);
                                setAddressSearch("");
                                setAddressStep("province");
                                setSelectedProvince("");
                                setSelectedWard("");
                                setDetailedAddress("");
                            setSuggestedWards([]);
                            setSelectedSuggestedWard("");
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                          >
                            {province}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1">
                      {rightColumn.map((province) => {
                        const wards = getWardsForProvince(province);
                        return (
                          <button
                            key={province}
                            onClick={() => {
                              if (wards.length > 0) {
                                setSelectedProvince(province);
                                setAddressStep("ward");
                                setAddressSearch("");
                              } else {
                                handleInputChange("province", province);
                                setShowAddressModal(false);
                                setAddressSearch("");
                                setAddressStep("province");
                                setSelectedProvince("");
                                setSelectedWard("");
                                setDetailedAddress("");
                            setSuggestedWards([]);
                            setSelectedSuggestedWard("");
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                          >
                            {province}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filteredProvinces.length === 0 && (
                    <div className="text-center py-8 text-[#6B7280] text-[13px]">
                      Không tìm thấy tỉnh/thành phố nào
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Ward Selection */}
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium text-[#111827] mb-2">
                      Chọn Phường/Xã
                    </label>
                    <div className="relative border-2 border-[#F97316] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!!formData.ward}
                          readOnly
                          className="w-4 h-4 text-[#F97316]"
                        />
                        <span className="text-[13px] text-[#111827]">
                          {formData.ward || "Chọn Phường/Xã"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={wardSearch}
                        onChange={(e) => setWardSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#F97316] pr-10"
                        placeholder="Tìm kiếm..."
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Ward List - 2 Columns */}
                  {currentWards.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Left Column */}
                      <div className="space-y-1">
                        {leftColumn.map((ward) => (
                          <button
                            key={ward}
                            onClick={() => {
                              setSelectedWard(ward);
                              setAddressStep("address");
                              setWardSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                          >
                            {ward}
                          </button>
                        ))}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-1">
                        {rightColumn.map((ward) => (
                          <button
                            key={ward}
                            onClick={() => {
                              setSelectedWard(ward);
                              setAddressStep("address");
                              setWardSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                          >
                            {ward}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#6B7280] text-[13px]">
                      Chưa có dữ liệu phường/xã cho tỉnh/thành phố này
                    </div>
                  )}

                  {filteredWards.length === 0 && currentWards.length > 0 && (
                    <div className="text-center py-8 text-[#6B7280] text-[13px]">
                      Không tìm thấy phường/xã nào
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Nhập địa chỉ cụ thể */}
              {addressStep === "address" && (
                <>
                  {/* Hiển thị tỉnh và phường/xã đã chọn */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setAddressStep("ward");
                        setDetailedAddress("");
                      }}
                      className="flex items-center gap-2 text-[#111827] hover:text-[#DC2626] transition-colors text-[13px] mb-3"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Quay lại
                    </button>
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                      <span className="text-[13px] text-[#111827]">
                        {selectedWard}, {selectedProvince}
                      </span>
                      <button
                        onClick={() => {
                          setAddressStep("province");
                          setSelectedProvince("");
                          setSelectedWard("");
                          setDetailedAddress("");
                        }}
                        className="ml-auto text-[#6B7280] hover:text-[#DC2626] transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Ô nhập địa chỉ cụ thể */}
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium text-[#111827] mb-2">
                      Địa chỉ cụ thể
                    </label>
                    <textarea
                      value={detailedAddress}
                      onChange={(e) => setDetailedAddress(e.target.value)}
                      placeholder="Nhập số nhà, tên đường, tòa nhà..."
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent text-[13px] text-[#111827] resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Hiển thị danh sách gợi ý phường/xã khi có địa chỉ cụ thể */}
                  {suggestedWards.length > 0 && detailedAddress.trim() && (
                    <div className="mb-4">
                      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 mb-3">
                        <p className="text-[13px] text-[#111827]">
                          Vui lòng chọn địa chỉ (trước sáp nhập) tương ứng:
                        </p>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {suggestedWards.map((suggestion, index) => (
                          <label
                            key={index}
                            className="flex items-start gap-3 p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name="suggestedWard"
                              value={suggestion.fullAddress}
                              checked={selectedSuggestedWard === suggestion.fullAddress}
                              onChange={(e) => {
                                setSelectedSuggestedWard(e.target.value);
                                // Tự động cập nhật địa chỉ cụ thể và phường/xã
                                setDetailedAddress(suggestion.address);
                                setSelectedWard(suggestion.ward);
                              }}
                              className="mt-0.5 w-4 h-4 text-[#DC2626] focus:ring-[#DC2626] cursor-pointer"
                            />
                            <span className="text-[13px] text-[#111827] flex-1">
                              {suggestion.fullAddress}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nút xác nhận */}
                  <button
                    onClick={() => {
                      // Nếu đã chọn từ danh sách gợi ý, sử dụng địa chỉ đầy đủ từ đó
                      const fullAddress = selectedSuggestedWard 
                        ? selectedSuggestedWard 
                        : `${detailedAddress}, ${selectedWard}, ${selectedProvince}`.trim();
                      
                      if (fullAddress.startsWith(",")) {
                        handleInputChange("address", fullAddress.substring(1).trim());
                      } else {
                        handleInputChange("address", fullAddress);
                      }
                      handleInputChange("province", `${selectedProvince}, ${selectedWard}`);
                      handleInputChange("ward", selectedWard);
                      setShowAddressModal(false);
                      setAddressSearch("");
                      setWardSearch("");
                      setAddressStep("province");
                      setSelectedProvince("");
                      setSelectedWard("");
                      setDetailedAddress("");
                      setSuggestedWards([]);
                      setSelectedSuggestedWard("");
                    }}
                    disabled={!detailedAddress.trim()}
                    className="w-full py-3 bg-[#DC2626] text-white rounded-lg font-medium text-[14px] hover:bg-[#B91C1C] transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
                  >
                    Xác nhận
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

