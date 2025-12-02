import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import { fabrics } from "./FabricsPage.jsx";
import { addFabricVisit, addFabricHold } from "../utils/fabricHoldStorage.js";
import { addToFabricCart } from "../utils/fabricCartStorage.js";

export default function FabricDetailPage() {
  const { key } = useParams();
  const navigate = useNavigate();
  const fabric =
    fabrics.find((f) => f.key === key) ||
    fabrics.find((f) => f.key === "lua-taffeta");

  const today = new Date();
  const defaultDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [visitDate, setVisitDate] = useState(defaultDate);
  const [visitTime, setVisitTime] = useState("10:00");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // description | reviews | qa
  const [starFilter, setStarFilter] = useState(0); // 0 = all
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyNowQuantity, setBuyNowQuantity] = useState(1);
  const [showAddToCartSuccess, setShowAddToCartSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);

  if (!fabric) return null;

  const gallery =
    fabric.gallery && fabric.gallery.length ? fabric.gallery : [fabric.image];
  const unit = fabric.unit || "đ/m";

  const reviews = fabric.reviews && fabric.reviews.length ? fabric.reviews : [];

  const ratingSummary = useMemo(() => {
    if (!reviews.length) return { avg: fabric.rating || 0, counts: {} };
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    reviews.forEach((r) => {
      const star = r.rating || 5;
      counts[star] = (counts[star] || 0) + 1;
      total += star;
    });
    return {
      avg: total / reviews.length,
      counts,
    };
  }, [reviews, fabric.rating]);

  const filteredReviews = useMemo(() => {
    if (!starFilter) return reviews;
    return reviews.filter((r) => (r.rating || 5) === starFilter);
  }, [reviews, starFilter]);

  const renderStars = (value) => {
    const full = Math.round(value || 0);
    return (
      <span className="text-[13px] text-[#F59E0B]">
        {Array.from({ length: 5 }).map((_, idx) =>
          idx < full ? "★" : "☆"
        )}
      </span>
    );
  };

  const handleVisit = () => {
    addFabricVisit(fabric, { visitDate, visitTime });
    setMessage(
      `Đã ghi nhận lịch hẹn xem vải “${fabric.name}” vào ${visitDate} lúc ${visitTime}.`
    );
  };

  const handleHold = () => {
    addFabricHold(fabric);
    setMessage(
      `Đã đặt giữ cuộn vải “${fabric.name}”. Nhân viên sẽ liên hệ để xác nhận.`
    );
  };

  const handleAddToCart = () => {
    addToFabricCart(fabric, quantity || 1);
    setShowAddToCartSuccess(true);
    // Tự động ẩn popup sau 3 giây
    setTimeout(() => {
      setShowAddToCartSuccess(false);
    }, 3000);
  };

  const handleBuyNow = () => {
    setBuyNowQuantity(quantity);
    setShowBuyNowModal(true);
  };

  const handleConfirmBuyNow = () => {
    addToFabricCart(fabric, buyNowQuantity || 1);
    setShowBuyNowModal(false);
    navigate("/cart", {
      state: {
        justAdded: fabric.key, // Đánh dấu sản phẩm vừa thêm
      },
    });
  };

  // Tính giá từ price string (ví dụ: "Từ 380.000 đ/m" -> 380000)
  const getPriceValue = (priceStr) => {
    const match = priceStr?.match(/[\d.]+/);
    if (match) {
      return parseInt(match[0].replace(/\./g, ""), 10);
    }
    return 0;
  };

  const calculateTotal = () => {
    const pricePerMeter = getPriceValue(fabric.price);
    return pricePerMeter * (buyNowQuantity || 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  // Lấy sản phẩm liên quan (cùng tag hoặc category tương tự)
  const relatedFabrics = useMemo(() => {
    if (!fabric) return [];
    const currentTag = fabric.tag?.toLowerCase() || "";
    const related = fabrics
      .filter((f) => f.key !== fabric.key)
      .filter((f) => {
        const fTag = f.tag?.toLowerCase() || "";
        // Lọc theo tag tương tự hoặc random nếu không có tag giống
        return (
          fTag.includes(currentTag.split(" ")[0]) ||
          currentTag.includes(fTag.split(" ")[0])
        );
      })
      .slice(0, 6); // Lấy tối đa 6 sản phẩm

    // Nếu không đủ 6 sản phẩm, thêm random
    if (related.length < 6) {
      const remaining = fabrics
        .filter((f) => f.key !== fabric.key && !related.find((r) => r.key === f.key))
        .slice(0, 6 - related.length);
      return [...related, ...remaining];
    }
    return related;
  }, [fabric]);

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <style>{`
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Header currentPage="/fabrics" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="text-[12px] text-[#6B7280] hover:text-[#111827] mb-2"
          >
            ← Quay lại danh sách vải
          </button>

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] px-4 py-3 rounded-2xl shadow-sm">
              {message}
            </div>
          )}

          <section className="bg-white rounded-3xl border border-[#E4D8C3] shadow-[0_18px_40px_rgba(148,114,80,0.25)] overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 relative h-72 md:h-auto flex flex-col">
                <img
                  src={gallery[activeImageIndex]}
                  alt={fabric.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-5">
                  <span className="inline-flex text-[10px] uppercase tracking-[0.22em] text-white/80">
                    {fabric.tag}
                  </span>
                  <p className="heading-font text-[22px] text-white">
                    {fabric.name}
                  </p>
                </div>
                {gallery.length > 1 && (
                  <div className="relative bg-white/90 p-3 border-t border-[#E5E7EB]">
                    <div className="flex gap-2 overflow-x-auto">
                      {gallery.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border ${
                            activeImageIndex === idx
                              ? "border-[#1B4332]"
                              : "border-[#E5E7EB]"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${fabric.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:w-1/2 p-6 space-y-4 text-[13px] text-[#4B5563]">
                <h1 className="text-[18px] font-semibold text-[#111827]">
                  {fabric.name}
                </h1>
                <p className="text-[12px] text-[#6B7280]">
                  Tên sản phẩm vải:{" "}
                  <span className="font-medium">{fabric.name}</span>
                </p>

                <div className="flex items-center gap-3 text-[12px]">
                  <div className="flex items-center gap-1">
                    {renderStars(ratingSummary.avg || fabric.rating || 0)}
                    <span className="text-[#4B5563]">
                      {(ratingSummary.avg || fabric.rating || 0).toFixed(1)} / 5
                    </span>
                  </div>
                  <span className="w-px h-3 bg-[#E5E7EB]" />
                  <p className="text-[#6B7280]">
                    Đã bán{" "}
                    <span className="font-semibold text-[#111827]">
                      {fabric.sold || 0}
                    </span>{" "}
                    cuộn
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px] mt-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                      Giá bán tham khảo
                    </p>
                    <p className="text-[18px] font-semibold text-[#1B4332] mt-1">
                      {fabric.price}{" "}
                      <span className="text-[11px] font-normal">{unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                      Gợi ý sử dụng
                    </p>
                    <p className="mt-1">
                      {fabric.tag.includes("Suiting")
                        ? "Vest, áo khoác mỏng, quần tây."
                        : fabric.tag.includes("Cotton")
                        ? "Áo sơ mi, đầm nhẹ, đồ mặc hằng ngày."
                        : "Áo dài, đầm dạ hội, váy maxi."}
                    </p>
                  </div>
                </div>

                {/* Vận chuyển - Shopee style */}
                <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowShippingDetails(!showShippingDetails)}
                  >
                    <span className="text-[13px] font-medium text-[#111827]">
                      Vận Chuyển
                    </span>
                    <svg
                      className="w-5 h-5 text-[#40A9FF]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                    <div className="flex-1 flex items-center gap-2">
                      {(() => {
                        const deliveryStart = new Date(
                          today.getTime() + 3 * 24 * 60 * 60 * 1000
                        );
                        const deliveryEnd = new Date(
                          today.getTime() + 8 * 24 * 60 * 60 * 1000
                        );
                        const formatDate = (date) => {
                          const day = date.getDate();
                          const month = date.getMonth() + 1;
                          return `${day} Th${month}`;
                        };
                        return (
                          <span className="text-[13px] text-[#111827]">
                            Nhận từ {formatDate(deliveryStart)} -{" "}
                            {formatDate(deliveryEnd)}, phí giao 0₫
                          </span>
                        );
                      })()}
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${
                        showShippingDetails ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {showShippingDetails && (
                    <div className="mt-2 p-3 bg-[#F9FAFB] rounded-lg text-[12px] text-[#4B5563]">
                      <p className="font-semibold text-[#111827] mb-1">
                        Thông tin vận chuyển
                      </p>
                      <p>
                        • Giao hàng tận nơi trong TP. HCM: 3-5 ngày làm việc
                      </p>
                      <p>• Giao hàng tỉnh/thành khác: 5-8 ngày làm việc</p>
                      <p>• Miễn phí vận chuyển cho đơn hàng từ 500.000₫</p>
                    </div>
                  )}
                </div>

                {/* An tâm mua sắm - Shopee style */}
                <div className="border-t border-[#E5E7EB] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#111827]">
                      An Tâm Mua Sắm
                    </span>
                    <div className="flex-1 flex items-center gap-2 relative group">
                      <svg
                        className="w-5 h-5 text-[#F97316]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[13px] text-[#111827] cursor-pointer">
                        Trả hàng miễn phí 15 ngày
                      </span>
                      {/* Popover hiển thị khi hover - Shopee style */}
                      <div className="absolute left-0 top-full mt-2 w-[320px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 before:content-[''] before:absolute before:bottom-full before:left-6 before:border-8 before:border-transparent before:border-b-[#E5E7EB] after:content-[''] after:absolute after:bottom-full after:left-[25px] after:border-8 after:border-transparent after:border-b-white">
                        <p className="font-semibold text-[#111827] text-[13px] mb-2">
                          An tâm mua sắm cùng Shopee
                        </p>
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="text-[12px] text-[#4B5563]">
                            <p className="font-semibold text-[#111827] mb-1">
                              Trả hàng miễn phí 15 ngày
                            </p>
                            <p className="mb-1">
                              Miễn phí Trả hàng trong 15 ngày để đảm bảo bạn hoàn
                              toàn có thể yên tâm khi mua hàng ở Shopee.
                            </p>
                            <p>
                              Ngoài ra, tại thời điểm nhận hàng, bạn có thể đồng
                              kiểm và được trả hàng miễn phí.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="font-semibold text-[#111827] text-[12px]">
                    Đặc tính vải
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F3F4FF] text-[#1D4ED8]">
                      <span>↔</span>
                      <span>
                        Co giãn:{" "}
                        {fabric.properties?.stretch || "Vừa / Ít co giãn"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">
                      <span>▥</span>
                      <span>
                        Độ dày: {fabric.properties?.thickness || "Trung bình"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#047857]">
                      <span>〰</span>
                      <span>Độ rủ: {fabric.properties?.drape || "Rủ vừa"}</span>
                    </span>
                  </div>
                </div>

                {/* Tabs Shopee-style */}
                <div className="mt-2">
                  <div className="flex gap-4 border-b border-[#E5E7EB] text-[13px]">
                    <button
                      onClick={() => setActiveTab("description")}
                      className={`pb-2 ${
                        activeTab === "description"
                          ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                          : "text-[#6B7280]"
                      }`}
                    >
                      Mô tả
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`pb-2 ${
                        activeTab === "reviews"
                          ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                          : "text-[#6B7280]"
                      }`}
                    >
                      Đánh giá ({reviews.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("qa")}
                      className={`pb-2 ${
                        activeTab === "qa"
                          ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                          : "text-[#6B7280]"
                      }`}
                    >
                      Hỏi đáp
                    </button>
                  </div>

                  {activeTab === "description" && (
                    <div className="pt-3 space-y-1 text-[12px]">
                      <p className="font-semibold text-[#111827]">
                        Mô tả chi tiết & thông số vải
                      </p>
                      <p>{fabric.desc}</p>
                      <ul className="list-disc list-inside space-y-1 text-[#6B7280]">
                        <li>
                          Thành phần:{" "}
                          <span className="font-medium">
                            {fabric.specs?.composition || "Đang cập nhật"}
                          </span>
                        </li>
                        <li>
                          Khổ vải:{" "}
                          <span className="font-medium">
                            {fabric.specs?.width || "Khoảng 1m4 – 1m6"}
                          </span>
                        </li>
                        <li>
                          Trọng lượng:{" "}
                          <span className="font-medium">
                            {fabric.specs?.weight || "Khoảng 120–220 gsm"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="pt-3 space-y-3 text-[12px]">
                      <div className="flex items-center gap-3">
                        {renderStars(ratingSummary.avg || fabric.rating || 0)}
                        <span className="font-semibold text-[#111827]">
                          {(ratingSummary.avg || fabric.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-[#6B7280]">
                          / 5 ({reviews.length} đánh giá)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setStarFilter(0)}
                          className={`px-3 py-1 rounded-full border text-[11px] ${
                            starFilter === 0
                              ? "bg-[#1B4332] text-white border-[#1B4332]"
                              : "border-[#E5E7EB] text-[#374151]"
                          }`}
                        >
                          Tất cả
                        </button>
                        {[5, 4, 3, 2, 1].map((star) => (
                          <button
                            key={star}
                            onClick={() => setStarFilter(star)}
                            className={`px-3 py-1 rounded-full border text-[11px] ${
                              starFilter === star
                                ? "bg-[#1B4332] text-white border-[#1B4332]"
                                : "border-[#E5E7EB] text-[#374151]"
                            }`}
                          >
                            {star}★ ({ratingSummary.counts?.[star] || 0})
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {(filteredReviews.length ? filteredReviews : reviews).map(
                          (review, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white/70 p-2.5"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img
                                  src={review.image}
                                  alt={review.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-[11px]">
                                <p className="font-semibold text-[#111827] flex items-center gap-2">
                                  {review.name}
                                  {renderStars(review.rating || 5)}
                                </p>
                                <p className="text-[#4B5563]">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "qa" && (
                    <div className="pt-3 text-[12px] text-[#6B7280]">
                      Tính năng hỏi đáp đang được xây dựng. Nếu bạn có câu hỏi,
                      vui lòng ghi trong ghi chú khi đặt may hoặc liên hệ trực
                      tiếp qua Zalo/Hotline.
                    </div>
                  )}
                </div>

                {/* Shopee-like action bar */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center border border-[#E5E7EB] rounded-full text-[12px]">
                    <button
                      onClick={() =>
                        setQuantity((q) => (q > 1 ? q - 1 : 1))
                      }
                      className="px-3 py-1.5 text-[#6B7280]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(1, parseInt(e.target.value || "1", 10))
                        )
                      }
                      className="w-14 text-center border-x border-[#E5E7EB] py-1.5 text-[12px] outline-none"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-[#6B7280]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">
                    Đơn vị: mét vải
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-4 py-2.5 rounded-full border border-[#1B4332] text-[#1B4332] text-[12px] font-semibold hover:bg-[#ECFDF5]"
                  >
                    + Thêm vào giỏ vải
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 px-4 py-2.5 rounded-full bg-[#F97316] text-white text-[12px] font-semibold hover:bg-[#EA580C]"
                  >
                    Mua ngay
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Sản phẩm liên quan - Bảng so sánh ngang */}
          {relatedFabrics.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-semibold text-[#111827] mb-6">
                Sản phẩm liên quan
              </h2>
              <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="flex min-w-max">
                    {/* Cột sản phẩm hiện tại */}
                    <div className="flex-shrink-0 w-[240px] border-r border-[#E5E7EB] p-4 bg-[#F9FAFB]">
                      <div className="text-center mb-3">
                        <div className="w-32 h-32 mx-auto mb-3 relative">
                          <img
                            src={fabric.image}
                            alt={fabric.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-[13px] font-medium text-[#111827] mb-2 line-clamp-2">
                          {fabric.name}
                        </p>
                        <div className="mb-2">
                          <p className="text-[16px] font-semibold text-[#F97316]">
                            {fabric.price}
                          </p>
                        </div>
                        <span className="inline-block px-2 py-1 bg-[#ECFDF5] text-[#047857] text-[11px] rounded-full mb-3">
                          Sản phẩm đang xem
                        </span>
                      </div>
                      <div className="space-y-2 text-[12px] text-[#4B5563]">
                        <div>
                          <p className="text-[10px] text-[#9CA3AF] mb-1">
                            Đặc tính vải
                          </p>
                          <p className="font-medium">
                            {fabric.properties?.stretch || "Vừa"} |{" "}
                            {fabric.properties?.thickness || "Trung bình"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#9CA3AF] mb-1">
                            Khổ vải
                          </p>
                          <p className="font-medium">
                            {fabric.specs?.width || "1m4 - 1m6"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#9CA3AF] mb-1">
                            Thành phần
                          </p>
                          <p className="font-medium line-clamp-2">
                            {fabric.specs?.composition || "Đang cập nhật"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Các sản phẩm liên quan */}
                    {relatedFabrics.slice(0, 4).map((relatedFabric) => {
                      const relatedRating = relatedFabric.rating || 4.5;
                      const relatedSold = relatedFabric.sold || Math.floor(Math.random() * 50) + 10;
                      return (
                        <div
                          key={relatedFabric.key}
                          className="flex-shrink-0 w-[240px] border-r border-[#E5E7EB] last:border-r-0 p-4 hover:bg-[#F9FAFB] transition-colors"
                        >
                          <div className="text-center mb-3">
                            <div className="w-32 h-32 mx-auto mb-3 relative cursor-pointer"
                              onClick={() => navigate(`/fabrics/${relatedFabric.key}`)}
                            >
                              <img
                                src={relatedFabric.image}
                                alt={relatedFabric.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <p className="text-[13px] font-medium text-[#111827] mb-2 line-clamp-2 cursor-pointer hover:text-[#F97316]"
                              onClick={() => navigate(`/fabrics/${relatedFabric.key}`)}
                            >
                              {relatedFabric.name}
                            </p>
                            <div className="mb-2">
                              <p className="text-[16px] font-semibold text-[#F97316]">
                                {relatedFabric.price}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/fabrics/${relatedFabric.key}`)}
                              className="text-[12px] text-[#1B4332] hover:text-[#F97316] font-medium flex items-center gap-1 mx-auto"
                            >
                              So sánh chi tiết{" "}
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
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-2 text-[12px] text-[#4B5563]">
                            <div>
                              <p className="text-[10px] text-[#9CA3AF] mb-1">
                                Đặc tính vải
                              </p>
                              <p className="font-medium">
                                {relatedFabric.properties?.stretch || "Vừa"} |{" "}
                                {relatedFabric.properties?.thickness || "Trung bình"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#9CA3AF] mb-1">
                                Khổ vải
                              </p>
                              <p className="font-medium">
                                {relatedFabric.specs?.width || "1m4 - 1m6"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#9CA3AF] mb-1">
                                Thành phần
                              </p>
                              <p className="font-medium line-clamp-2">
                                {relatedFabric.specs?.composition || "Đang cập nhật"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Nút xem thêm (nếu có nhiều hơn 4 sản phẩm) */}
                    {relatedFabrics.length > 4 && (
                      <div className="flex-shrink-0 w-[80px] flex items-center justify-center border-l border-[#E5E7EB]">
                        <button
                          onClick={() => navigate("/fabrics")}
                          className="w-10 h-10 rounded-full border border-[#E5E7EB] hover:bg-[#F9FAFB] flex items-center justify-center transition-colors"
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modal Mua ngay - FPT Shop style */}
      {showBuyNowModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                Xác nhận mua ngay
              </h3>
              <button
                onClick={() => setShowBuyNowModal(false)}
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

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Sản phẩm */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={fabric.image}
                    alt={fabric.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#111827] line-clamp-2 mb-1">
                    {fabric.name}
                  </p>
                  <p className="text-[12px] text-[#6B7280] mb-2">
                    {fabric.tag}
                  </p>
                  <p className="text-[16px] font-semibold text-[#F97316]">
                    {fabric.price}
                  </p>
                </div>
              </div>

              {/* Chọn số lượng */}
              <div className="border-t border-[#E5E7EB] pt-4">
                <p className="text-[13px] font-medium text-[#111827] mb-3">
                  Số lượng (mét)
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-[#E5E7EB] rounded-lg">
                    <button
                      onClick={() =>
                        setBuyNowQuantity((q) => (q > 1 ? q - 1 : 1))
                      }
                      className="px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={buyNowQuantity}
                      onChange={(e) =>
                        setBuyNowQuantity(
                          Math.max(1, parseInt(e.target.value || "1", 10))
                        )
                      }
                      className="w-20 text-center border-x border-[#E5E7EB] py-2 text-[14px] outline-none"
                    />
                    <button
                      onClick={() => setBuyNowQuantity((q) => q + 1)}
                      className="px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">
                    Đơn vị: mét vải
                  </span>
                </div>
              </div>

              {/* Thông tin giá */}
              <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">Đơn giá:</span>
                  <span className="font-medium text-[#111827]">
                    {fabric.price}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">Số lượng:</span>
                  <span className="font-medium text-[#111827]">
                    {buyNowQuantity} mét
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[15px] font-semibold text-[#111827]">
                    Tổng tiền:
                  </span>
                  <span className="text-[20px] font-bold text-[#F97316]">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Lưu ý */}
              <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-3">
                <p className="text-[12px] text-[#92400E]">
                  <span className="font-semibold">Lưu ý:</span> Giá trên chỉ là
                  giá tham khảo. Giá thực tế có thể thay đổi tùy theo khổ vải và
                  số lượng đặt hàng. Vui lòng liên hệ để được báo giá chính xác.
                </p>
              </div>
            </div>

            {/* Footer - Nút xác nhận */}
            <div className="border-t border-[#E5E7EB] p-4 space-y-2">
              <button
                onClick={handleConfirmBuyNow}
                className="w-full py-3 rounded-lg bg-[#F97316] text-white font-semibold text-[14px] hover:bg-[#EA580C] transition-colors"
              >
                Xác nhận mua ngay
              </button>
              <button
                onClick={() => setShowBuyNowModal(false)}
                className="w-full py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] text-[13px] hover:bg-[#F9FAFB] transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup thông báo thêm vào giỏ hàng thành công */}
      {showAddToCartSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 max-w-sm w-full mx-4 pointer-events-auto transform transition-all duration-300"
            style={{
              animation: 'slideUpFadeIn 0.3s ease-out',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Icon checkmark */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#111827] mb-1">
                  Đã thêm vào giỏ hàng
                </h3>
                <p className="text-[13px] text-[#6B7280] mb-3">
                  Đã thêm {quantity}m "{fabric.name}" vào giỏ vải của bạn.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddToCartSuccess(false);
                      navigate("/cart");
                    }}
                    className="flex-1 px-4 py-2 bg-[#F97316] text-white rounded-lg text-[13px] font-medium hover:bg-[#EA580C] transition-colors"
                  >
                    Xem giỏ hàng
                  </button>
                  <button
                    onClick={() => setShowAddToCartSuccess(false)}
                    className="px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] font-medium hover:bg-[#F9FAFB] transition-colors"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowAddToCartSuccess(false)}
                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


