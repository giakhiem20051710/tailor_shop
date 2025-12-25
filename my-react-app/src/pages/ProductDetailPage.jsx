import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header.jsx";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../utils/favoriteStorage.js";
import { getCurrentUser } from "../utils/authStorage.js";
import { getWorkingSlots, updateWorkingSlot } from "../utils/workingSlotStorage.js";
import { addAppointment } from "../utils/appointmentStorage.js";
import { productService } from "../services/index.js";
import OptimizedImage from "../components/OptimizedImage.jsx";

const ProductDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { key: urlKey } = useParams();
  
  // Get product key from URL params or location state
  const productKeyFromState = location.state?.product?.key || location.state?.product?.slug;
  const productKey = urlKey || productKeyFromState || "product-detail";
  
  // State for product data from API
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fallback product from location state
  const fallbackProduct = location.state?.product || {
    name: "Sản phẩm may đo",
    desc: "Mô tả sản phẩm",
    price: "0 ₫",
    tag: "Bộ sưu tập",
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
    type: "newArrival",
  };
  
  // Use productData from API if available, otherwise use fallback
  const product = productData || fallbackProduct;

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavoriteProduct, setIsFavoriteProduct] = useState(() =>
    isFavorite(productKey)
  );
  
  // Load product detail from API
  useEffect(() => {
    const loadProductDetail = async () => {
      if (!productKey || productKey === "product-detail") {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await productService.getDetail(productKey);
        const data = productService.parseResponse(response);
        
        if (data) {
          setProductData(data);
          // Update favorite status if product is favorite from API
          if (data.stats?.isFavorite !== undefined) {
            setIsFavoriteProduct(data.stats.isFavorite);
          }
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
        setError(err.message || "Không thể tải chi tiết sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    
    loadProductDetail();
  }, [productKey]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ====== GALLERY ======
  const productImages = useMemo(() => {
    if (productData?.media) {
      const images = [];
      if (productData.media.thumbnail) {
        images.push(productData.media.thumbnail);
      }
      if (productData.media.gallery && Array.isArray(productData.media.gallery)) {
        images.push(...productData.media.gallery);
      }
      return images.length > 0 ? images : [product.image || fallbackProduct.image];
    }
    // Fallback: use product.image or mock images
    return [
      product.image || fallbackProduct.image,
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1601925260368-ae2f83d34b08?w=900&auto=format&fit=crop&q=80",
    ];
  }, [productData, product.image, fallbackProduct.image]);
  
  // Get price display
  const priceDisplay = useMemo(() => {
    if (productData?.pricing?.basePrice) {
      return `${Number(productData.pricing.basePrice).toLocaleString("vi-VN")} ₫`;
    }
    if (productData?.pricing?.priceRange) {
      return productData.pricing.priceRange;
    }
    return product.price || "Liên hệ";
  }, [productData, product.price]);
  
  // Get tailoring specifications
  const specs = productData?.specifications || {};
  
  // Get occasions, customer styles, care instructions
  const occasions = productData?.occasions || [];
  const customerStyles = productData?.customerStyles || [];
  const careInstructions = productData?.careInstructions || [];

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleOrderClick = () => {
    navigate("/customer/order", { state: { product } });
  };

  const handleFavoriteToggle = () => {
    if (!productKey) return;
    if (isFavoriteProduct) {
      removeFavorite(productKey);
      setIsFavoriteProduct(false);
    } else {
      addFavorite({ ...product, key: productKey });
      setIsFavoriteProduct(true);
    }
  };

  // Load available consultation slots
  useEffect(() => {
    if (showConsultationModal) {
      const slots = getWorkingSlots().filter(
        (slot) =>
          slot.type === "consult" &&
          slot.status === "available" &&
          (slot.bookedCount || 0) < (slot.capacity || 1)
      );
      setAvailableSlots(slots);
    }
  }, [showConsultationModal]);

  // Get next 14 days
  const next14Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      return d;
    });
  }, []);

  // Get days with available slots
  const daysWithSlots = useMemo(() => {
    const daysSet = new Set(
      availableSlots.map((slot) => slot.date)
    );
    return daysSet;
  }, [availableSlots]);

  // Get available time slots for selected date
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots
      .filter((slot) => slot.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availableSlots, selectedDate]);

  const handleOpenConsultation = () => {
    const user = getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập để đặt lịch tư vấn.");
      navigate("/login");
      return;
    }
    setShowConsultationModal(true);
    setSelectedDate("");
    setSelectedSlotId(null);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlotId || !selectedDate) {
      alert("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập để đặt lịch.");
      return;
    }

    setIsBooking(true);
    const slot = availableSlots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setIsBooking(false);
      alert("Slot không còn khả dụng. Vui lòng chọn slot khác.");
      return;
    }

    const customerId = user.username || user.phone;
    const newAppointment = addAppointment({
      customerId,
      slotId: slot.id,
      orderId: null,
      type: "consult",
      status: "pending",
      note: `Tư vấn về sản phẩm: ${product.name}`,
    });

    const nextBooked = (slot.bookedCount || 0) + 1;
    updateWorkingSlot(slot.id, {
      bookedCount: nextBooked,
      status: nextBooked >= (slot.capacity || 1) ? "booked" : "available",
    });

    setIsBooking(false);
    setBookingSuccess(true);
    
    setTimeout(() => {
      setShowConsultationModal(false);
      setBookingSuccess(false);
      alert(
        `Đã đặt lịch tư vấn về "${product.name}" vào ${slot.date} lúc ${slot.startTime}–${slot.endTime}. Chúng tôi sẽ liên hệ xác nhận.`
      );
    }, 2000);
  };

  const formatDateLabel = (d) =>
    d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      {/* HEADER chung với toàn site */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div>
              <p className="mt-4 text-[#6B7280]">Đang tải chi tiết sản phẩm...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Quay lại
              </button>
            </div>
          )}
          
          {/* Product Content */}
          {!loading && !error && (
            <>
              {/* Breadcrumb + Back */}
              <div className="flex items-center justify-between gap-4 mb-6 text-[12px] text-[#6B7280]">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 hover:text-[#111827] transition-colors"
            >
              <span className="text-[14px]">←</span>
              <span>Quay lại bộ sưu tập</span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              <span className="text-[#9CA3AF]">Bộ sưu tập</span>
              <span>/</span>
              <span className="text-[#4B5563]">{product.tag}</span>
              <span>/</span>
              <span className="text-[#111827] font-medium">{product.name}</span>
            </div>
          </div>

          {/* TITLE BLOCK */}
          <div className="mb-8">
            <span className="inline-flex text-[11px] uppercase tracking-[0.25em] text-[#6B7280] bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB]">
              {product.tag}
            </span>
            <div className="mt-3 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h1 className="heading-font text-[26px] md:text-[30px] text-[#111827] leading-tight">
                  {product.name}
                </h1>
                <p className="mt-1 text-[12px] text-[#6B7280] max-w-xl">
                  Thiết kế may đo dành riêng cho bạn – có thể chỉnh từng chi
                  tiết theo dáng người, dịp sử dụng và ngân sách.
                </p>
              </div>

              <div className="text-right">
                <p className="text-[12px] text-[#6B7280]">Giá tham khảo từ</p>
                <p className="text-[24px] md:text-[26px] font-semibold text-[#1B4332]">
                  {priceDisplay}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Giá có thể thay đổi theo chất liệu & chi tiết may
                </p>
              </div>
            </div>
          </div>

          {/* 2 CỘT: GALLERY + THÔNG TIN */}
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] gap-10">
            {/* LEFT: HÌNH ẢNH */}
            <section className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-gray-200 aspect-[4/5] shadow-md">
                <OptimizedImage
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {(product.type === "newArrival" || product.isNew) && (
                  <div className="absolute top-4 left-4 bg-[#1B4332] text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-[0.16em]">
                    New Arrival
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-[#1B4332] shadow-sm"
                        : "border-transparent hover:border-[#D1D5DB]"
                    }`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* NOTE: INFO NHỎ */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-[12px] text-[#4B5563]">
                <p className="font-semibold text-[#111827] mb-1">
                  Về chất liệu & dáng áo
                </p>
                <p>
                  Khi đến tiệm, bạn có thể thử nhiều phom khác nhau (suông, ôm,
                  chữ A...) để chọn dáng phù hợp nhất. Thợ may sẽ tư vấn thêm về
                  độ dày mỏng của vải và cách chăm sóc sau khi sử dụng.
                </p>
              </div>
            </section>

            {/* RIGHT: THÔNG TIN CHI TIẾT */}
            <section className="space-y-6">
              {/* MÔ TẢ SẢN PHẨM */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6">
                <h3 className="text-[14px] font-semibold text-[#111827] mb-2">
                  Mô tả sản phẩm
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  {product.desc || product.description}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-[#4B5563]">
                  <InfoChip 
                    label="Thời gian may" 
                    value={specs.tailoringTime || "7–14 ngày"} 
                  />
                  <InfoChip 
                    label="Số lần thử đồ" 
                    value={specs.fittingCount || "1–2 lần"} 
                  />
                  <InfoChip 
                    label="Bảo hành" 
                    value={specs.warranty || "Chỉnh sửa miễn phí 1 lần"} 
                  />
                </div>
              </div>

              {/* CHI TIẾT MAY ĐO */}
              <div className="bg-[#FFF7ED] rounded-2xl border border-[#FED7AA] p-5 md:p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#92400E] mb-2">
                  Chi tiết may đo
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px] text-[#4B5563] mb-3">
                  <DetailRow 
                    label="Form dáng" 
                    value={specs.silhouette || "Ôm nhẹ, tôn eo"} 
                  />
                  <DetailRow 
                    label="Độ dài" 
                    value={specs.length || "Qua gối / maxi tùy chọn"} 
                  />
                  <DetailRow
                    label="Chất liệu gợi ý"
                    value={
                      specs.materials && specs.materials.length > 0
                        ? specs.materials.join(", ")
                        : "Lụa, satin, crepe cao cấp"
                    }
                  />
                  <DetailRow 
                    label="Lót trong" 
                    value={specs.lining || "Có, chống hằn & thoáng"} 
                  />
                  <DetailRow
                    label="Màu sắc"
                    value={
                      specs.colors && specs.colors.length > 0
                        ? specs.colors.join(", ")
                        : "Tùy chọn theo bảng màu tại tiệm"
                    }
                  />
                  <DetailRow
                    label="Phụ kiện"
                    value={specs.accessories || "Có thể phối thêm belt, hoa cài, khăn choàng"}
                  />
                </div>

                <p className="text-[11px] text-[#92400E] italic">
                  * Nếu bạn có ảnh mẫu yêu thích, hãy mang theo – thợ may sẽ
                  tư vấn xem form và chất liệu đó có phù hợp với dáng của bạn
                  không.
                </p>
              </div>

              {/* PHÙ HỢP VỚI AI / DỊP NÀO */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6">
                <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                  Mẫu này phù hợp với
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-[12px] text-[#4B5563]">
                  <div>
                    <p className="font-medium mb-1">Dịp sử dụng</p>
                    {occasions.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {occasions.map((occasion, idx) => (
                          <li key={idx}>{occasion}</li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Cưới hỏi, lễ kỷ niệm, tiệc tối</li>
                        <li>Chụp ảnh kỷ niệm, pre-wedding</li>
                        <li>Sự kiện cần sự chỉn chu, thanh lịch</li>
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="font-medium mb-1">Phong cách khách hàng</p>
                    {customerStyles.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {customerStyles.map((style, idx) => (
                          <li key={idx}>{style}</li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Thích sự nữ tính, mềm mại nhưng không sến</li>
                        <li>Muốn tôn dáng nhưng vẫn di chuyển thoải mái</li>
                        <li>Cần trang phục "đẹp ngoài đời & đẹp trên hình"</li>
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[12px] text-[#4B5563]">
                  <p className="font-medium mb-1">Gợi ý bảo quản</p>
                  {careInstructions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {careInstructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh.</li>
                      <li>Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt.</li>
                      <li>
                        Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn.
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              {/* NÚT HÀNH ĐỘNG */}
              <div className="flex flex-col lg:flex-row gap-3">
                <button
                  onClick={handleOrderClick}
                  className="flex-1 px-6 py-3.5 text-[14px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
                >
                  <span>📝</span>
                  <span>Đặt may mẫu này</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
                <button
                  onClick={handleOpenConsultation}
                  className="flex-1 px-6 py-3.5 text-[14px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Hẹn tư vấn riêng cho tôi</span>
                </button>
                <button
                  onClick={handleFavoriteToggle}
                  className={`flex-1 px-6 py-3.5 text-[14px] font-medium rounded-full border flex items-center justify-center gap-2 transition-all duration-300 ${
                    isFavoriteProduct
                      ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                      : "bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <span className="text-[16px]">
                    {isFavoriteProduct ? "❤" : "♡"}
                  </span>
                  <span className="text-[13px]">
                    {isFavoriteProduct
                      ? "Đã lưu vào yêu thích"
                      : "Thêm vào danh sách yêu thích"}
                  </span>
                </button>
              </div>
            </section>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Consultation Booking Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-slate-900">
                Đặt lịch tư vấn về "{product.name}"
              </h2>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="text-slate-500 hover:text-slate-800 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Đặt lịch thành công!
                  </h3>
                  <p className="text-slate-600">
                    Chúng tôi sẽ liên hệ xác nhận với bạn sớm nhất.
                  </p>
                </div>
              ) : (
                <>
                  {/* Product Info */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-600">{product.tag}</p>
                    </div>
                  </div>

                  {/* Step 1: Select Date */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Chọn ngày hẹn *
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {next14Days.map((day) => {
                        const dateStr = day.toISOString().split("T")[0];
                        const hasSlots = daysWithSlots.has(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const isPast = day < new Date().setHours(0, 0, 0, 0);

                        return (
                          <button
                            key={dateStr}
                            onClick={() => hasSlots && !isPast && setSelectedDate(dateStr)}
                            disabled={!hasSlots || isPast}
                            className={`aspect-square rounded-lg text-xs font-medium transition ${
                              isSelected
                                ? "bg-[#1B4332] text-white shadow-md"
                                : hasSlots && !isPast
                                ? "bg-white border-2 border-slate-200 hover:border-[#1B4332] text-slate-700"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <div>{formatDateLabel(day)}</div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedDate && (
                      <p className="mt-2 text-sm text-slate-600">
                        Đã chọn: {new Date(selectedDate).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Step 2: Select Time */}
                  {selectedDate && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Chọn giờ hẹn *
                      </label>
                      {timeSlotsForDate.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">
                          Ngày này không còn slot trống. Vui lòng chọn ngày khác.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {timeSlotsForDate.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
                                selectedSlotId === slot.id
                                  ? "border-[#1B4332] bg-[#1B4332] text-white"
                                  : "border-slate-200 hover:border-[#1B4332] text-slate-700"
                              }`}
                            >
                              {slot.startTime}–{slot.endTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>📍 Địa điểm:</strong> 123 Nguyễn Thị Minh Khai, Q.1, TP.HCM
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>⏰ Thời gian:</strong> 07:00 - 23:00 hàng ngày
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>📞 Hotline:</strong> 0901 134 256
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConsultationModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      disabled={!selectedSlotId || isBooking}
                      className="flex-1 px-6 py-3 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#14532d] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER (giữ giống các page khác) */}
      <footer className="bg-[#111827] text-white py-10 text-[12px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div className="md:col-span-2">
              <h3 className="heading-font text-[16px] mb-2">LAVI TAILOR</h3>
              <p className="text-[#9CA3AF] max-w-md">
                Tiệm may đo nhỏ, nhưng cẩn thận trong từng đường kim mũi chỉ.
                Chúng tôi mong bạn có thể mặc đồ may đo thường xuyên, không chỉ
                trong những dịp “đặc biệt”.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Địa chỉ
              </h4>
              <p className="text-[#9CA3AF]">
                123 Đường ABC
                <br />
                Quận XYZ, TP. Hồ Chí Minh
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Liên hệ
              </h4>
              <p className="text-[#9CA3AF]">
                Email: info@lavitailor.com
                <br />
                Phone: 0901 234 567
                <br />
                Giờ mở cửa: 9:00 - 20:00
              </p>
            </div>
          </div>
          <div className="border-t border-[#1F2937] pt-4 flex justify-between items-center text-[#6B7280] text-[11px]">
            <span>© 2025 Lavi Tailor</span>
            <div className="flex gap-4">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ====== SUB COMPONENTS ====== */

function InfoChip({ label, value }) {
  return (
    <div className="bg-[#F9FAFB] rounded-lg px-3 py-2 border border-[#E5E7EB]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="text-[12px] text-[#111827] mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-[12px] text-[#111827] font-medium">{value}</p>
    </div>
  );
}

export default ProductDetailPage;
