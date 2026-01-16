import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta.jsx";
import { fabricService, cartService, reviewService, appointmentService } from "../services";
import { getCurrentUser } from "../utils/authStorage";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import ReviewSection from "../components/ReviewSection.jsx";

export default function FabricDetailPage() {
  const { key } = useParams();
  const navigate = useNavigate();

  // Load fabric from API
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedFabricsList, setRelatedFabricsList] = useState([]);

  useEffect(() => {
    const loadFabric = async () => {
      if (!key) {
        setError("Fabric key is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to load by slug/code first, then by ID
        let fabricData = null;
        let lastError = null;

        // Try slug first (most common case for URLs like /fabrics/super-120s-wool-charcoal-gray)
        try {
          const response = await fabricService.getDetailBySlug(key);
          fabricData = fabricService.parseResponse(response);
          if (fabricData) {
            console.log(`[FabricDetail] Loaded by slug: ${key}`);
          }
        } catch (e) {
          // Only log if it's not a 404 (expected when trying different endpoints)
          if (e?.status !== 404 && e?.response?.status !== 404) {
            console.warn(`[FabricDetail] Failed to load by slug (${key}):`, e.message);
          }
          lastError = e;

          // If slug fails (404), try code
          try {
            const response = await fabricService.getDetailByCode(key);
            fabricData = fabricService.parseResponse(response);
            if (fabricData) {
              console.log(`[FabricDetail] Loaded by code: ${key}`);
            }
          } catch (e2) {
            // Only log if it's not a 404
            if (e2?.status !== 404 && e2?.response?.status !== 404) {
              console.warn(`[FabricDetail] Failed to load by code (${key}):`, e2.message);
            }
            lastError = e2;

            // If code fails, try ID (if key is numeric)
            const id = parseInt(key);
            if (!isNaN(id)) {
              try {
                const response = await fabricService.getDetail(id);
                fabricData = fabricService.parseResponse(response);
                if (fabricData) {
                  console.log(`[FabricDetail] Loaded by ID: ${id}`);
                }
              } catch (e3) {
                lastError = e3;
              }
            }
          }
        }

        if (fabricData) {
          setFabric(fabricData);

          // Load related fabrics
          try {
            const relatedResponse = await fabricService.list({
              category: fabricData.category,
              page: 0,
              size: 6
            });
            const relatedData = fabricService.parseResponse(relatedResponse);
            if (relatedData?.content) {
              setRelatedFabricsList(relatedData.content.filter(f => f.id !== fabricData.id).slice(0, 6));
            }
          } catch (e) {
            console.warn("Failed to load related fabrics:", e);
          }
        } else {
          // All attempts failed
          const errorMessage = lastError?.response?.status === 404
            ? `Không tìm thấy vải với mã/slug: ${key}`
            : lastError?.message || "Không tìm thấy vải";
          setError(errorMessage);
        }
      } catch (err) {
        console.error("Error loading fabric:", err);
        const errorMessage = err?.response?.status === 404
          ? `Không tìm thấy vải với mã/slug: ${key}`
          : err.message || "Không thể tải thông tin vải";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadFabric();
  }, [key]);

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
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when reviews update
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyNowQuantity, setBuyNowQuantity] = useState(1);
  const [showAddToCartSuccess, setShowAddToCartSuccess] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "highest" | "lowest"

  // Image Zoom on Hover states
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const ZOOM_LEVEL = 2.5; // Magnification factor
  const LENS_SIZE = 150; // Size of the lens box in px

  // Handle mouse move for zoom
  const handleImageMouseMove = (e) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage position
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    // Calculate lens position (centered on cursor)
    const lensX = Math.max(0, Math.min(x - LENS_SIZE / 2, rect.width - LENS_SIZE));
    const lensY = Math.max(0, Math.min(y - LENS_SIZE / 2, rect.height - LENS_SIZE));

    setZoomPosition({ x: xPercent, y: yPercent });
    setLensPosition({ x: lensX, y: lensY });
  };

  const handleImageMouseEnter = () => {
    setIsZooming(true);
  };

  const handleImageMouseLeave = () => {
    setIsZooming(false);
  };

  // SEO Meta Tags
  usePageMeta({
    title: fabric ? `${fabric.name} | Vải may đo chất lượng cao | My Hiền Tailor` : "Chi tiết vải | My Hiền Tailor",
    description: fabric ? `${fabric.description || fabric.name} - Vải ${fabric.category || "cao cấp"} tại My Hiền Tailor. ${fabric.material ? `Chất liệu: ${fabric.material}.` : ""} Đặt mua ngay hoặc hẹn xem tại tiệm.` : "Chi tiết vải may đo chất lượng cao",
    ogImage: fabric?.image || fabric?.images?.[0],
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);

  // Load reviews from API
  const [apiReviews, setApiReviews] = useState([]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!fabric?.id) return;
      try {
        // Try to find fabric ID from key or use fabric object
        const fabricId = fabric.id || fabric.fabricId;
        if (fabricId) {
          const response = await reviewService.list({ productId: fabricId }, { page: 0, size: 100 });
          const responseData = response?.data ?? response?.responseData ?? response;
          const reviewsList = responseData?.content || responseData?.data || [];
          setApiReviews(reviewsList);
        }
      } catch (error) {
        // Silently handle 403 (forbidden) or other errors - reviews are optional
        if (error?.status !== 403 && error?.response?.status !== 403) {
          console.warn("Error loading reviews:", error);
        }
        setApiReviews([]);
      }
    };

    if (fabric?.id) {
      loadReviews();
    }
  }, [fabric?.id]);

  // All hooks must be called before any early return
  // Reviews from API
  const customerReviews = useMemo(() => {
    if (!apiReviews || !Array.isArray(apiReviews)) return [];
    return apiReviews.map((review) => ({
      id: review.id,
      name: review.customer?.name || review.customerName || "Khách hàng",
      comment: review.comment || review.content,
      rating: review.rating || 5,
      image: review.images?.[0] || null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customerId: review.customer?.id || review.customerId,
      orderId: review.order?.id || review.orderId,
    }));
  }, [apiReviews]);

  // Merge reviews: ưu tiên customer reviews, sau đó là fabric.reviews
  const reviews = useMemo(() => {
    if (!fabric) return [];
    const staticReviews = fabric.reviews && fabric.reviews.length ? fabric.reviews : [];
    // Merge và loại bỏ duplicate (nếu có)
    const allReviews = [...customerReviews, ...staticReviews];
    // Loại bỏ duplicate dựa trên customerId và comment hoặc orderId
    const uniqueReviews = allReviews.filter((review, index, self) =>
      index === self.findIndex((r) =>
        // Match bằng orderId (ưu tiên nhất)
        (r.orderId && review.orderId && r.orderId === review.orderId) ||
        // Hoặc match bằng customerId + comment + orderId
        (r.customerId && review.customerId && r.customerId === review.customerId &&
          r.comment === review.comment &&
          r.orderId === review.orderId) ||
        // Hoặc match static reviews bằng name + comment
        (!r.customerId && !review.customerId && !r.orderId && !review.orderId &&
          r.comment === review.comment && r.name === review.name)
      )
    );
    return uniqueReviews;
  }, [customerReviews, fabric?.reviews]);

  const ratingSummary = useMemo(() => {
    if (!fabric) return { avg: 0, counts: {} };
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
  }, [reviews, fabric?.rating]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    let result;
    switch (sortBy) {
      case "newest":
        result = sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        });
        break;
      case "oldest":
        result = sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateA - dateB;
        });
        break;
      case "highest":
        result = sorted.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        break;
      case "lowest":
        result = sorted.sort((a, b) => (a.rating || 5) - (b.rating || 5));
        break;
      default:
        result = sorted;
    }
    return result;
  }, [reviews, sortBy]);

  const filteredReviews = useMemo(() => {
    if (!starFilter || starFilter === 0) {
      return sortedReviews;
    }
    return sortedReviews.filter((r) => {
      const reviewRating = r.rating || 5;
      return reviewRating === starFilter;
    });
  }, [sortedReviews, starFilter]);

  // Lấy sản phẩm liên quan từ API (đã load trong useEffect)
  const relatedFabrics = useMemo(() => {
    return relatedFabricsList || [];
  }, [relatedFabricsList]);

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

  const handleVisit = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        showError("Vui lòng đăng nhập để đặt lịch xem vải.");
        return;
      }

      const fabricId = fabric.id || fabric.fabricId;
      if (!fabricId) {
        showError("Không tìm thấy thông tin vải.");
        return;
      }

      // Note: Backend gets userId from JWT principal, no need to send customerId
      await fabricService.createHoldRequest({
        fabricId: fabricId,
        type: "VISIT",
        requestedDate: visitDate, // Format: YYYY-MM-DD (LocalDate)
        requestedTime: visitTime, // Format: HH:mm (LocalTime)
        notes: `Hẹn xem vải: ${fabric.name}`,
      });

      showSuccess(
        `Đã ghi nhận lịch hẹn xem vải "${fabric.name}" vào ${visitDate} lúc ${visitTime}.`
      );
    } catch (error) {
      console.error("Error creating visit request:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt lịch. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const handleHold = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        showError("Vui lòng đăng nhập để đặt giữ vải.");
        return;
      }

      const fabricId = fabric.id || fabric.fabricId;
      if (!fabricId) {
        showError("Không tìm thấy thông tin vải.");
        return;
      }

      // Note: Backend gets userId from JWT principal, no need to send customerId
      await fabricService.createHoldRequest({
        fabricId: fabricId,
        type: "HOLD",
        quantity: quantity || 1, // Quantity in meters
        notes: `Đặt giữ cuộn vải: ${fabric.name}`,
      });

      showSuccess(
        `Đã đặt giữ cuộn vải "${fabric.name}". Nhân viên sẽ liên hệ để xác nhận.`
      );
    } catch (error) {
      console.error("Error creating hold request:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt giữ vải. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const handleAddToCart = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        showError("Vui lòng đăng nhập để thêm vào giỏ hàng.");
        return;
      }

      const fabricId = fabric.id || fabric.fabricId;
      if (!fabricId) {
        showError("Không tìm thấy thông tin vải.");
        return;
      }

      await cartService.addToCart({
        itemType: "FABRIC",
        itemId: fabricId,
        quantity: quantity || 1,
      });

      setShowAddToCartSuccess(true);
      setTimeout(() => {
        setShowAddToCartSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const handleBuyNow = () => {
    setBuyNowQuantity(quantity);
    setShowBuyNowModal(true);
  };

  const handleConfirmBuyNow = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        showError("Vui lòng đăng nhập để mua ngay.");
        return;
      }

      const fabricId = fabric.id || fabric.fabricId;
      if (!fabricId) {
        showError("Không tìm thấy thông tin vải.");
        return;
      }

      await cartService.addToCart({
        itemType: "FABRIC",
        itemId: fabricId,
        quantity: buyNowQuantity || 1,
      });

      setShowBuyNowModal(false);
      navigate("/cart", {
        state: {
          justAdded: fabric.slug || fabric.code || fabricId,
        },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  // Tính giá từ price string (ví dụ: "Từ 380.000 đ/m" -> 380000)
  const getPriceValue = (price) => {
    // If price is already a number (from API)
    if (typeof price === 'number') {
      return price;
    }
    // If price is a string (legacy format)
    if (typeof price === 'string') {
      const match = price.match(/[\d.]+/);
      if (match) {
        return parseInt(match[0].replace(/\./g, ""), 10);
      }
    }
    return 0;
  };

  const calculateTotal = () => {
    const pricePerMeter = getPriceValue(fabric.pricePerMeter || fabric.price);
    return pricePerMeter * (buyNowQuantity || 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  // Get display price (from API or legacy format)
  const getDisplayPrice = () => {
    if (fabric.pricePerMeter) {
      return formatPrice(fabric.pricePerMeter) + "/m";
    }
    if (fabric.price) {
      return fabric.price;
    }
    return "Liên hệ";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mb-4"></div>
          <p className="text-[#6B7280]">Đang tải chi tiết vải...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !fabric) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center max-w-md px-5">
          <p className="text-red-600 mb-4">{error || "Không tìm thấy vải"}</p>
          <button
            onClick={() => navigate("/fabrics")}
            className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition"
          >
            Quay lại danh sách vải
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived values after fabric is confirmed to exist
  // Parse gallery - can be array or JSON string (same logic as FabricsPage)
  let galleryArray = [];
  if (fabric.gallery) {
    if (Array.isArray(fabric.gallery)) {
      galleryArray = fabric.gallery;
    } else if (typeof fabric.gallery === 'string') {
      try {
        galleryArray = JSON.parse(fabric.gallery);
      } catch (e) {
        galleryArray = [fabric.gallery]; // Single image as string
      }
    }
  }

  // Get main image: fabric.image -> fabric.imageUrl -> gallery[0]
  let mainImage = fabric.image || fabric.imageUrl;
  if (!mainImage && galleryArray.length > 0) {
    mainImage = galleryArray[0];
  }

  // Build final gallery array
  const gallery = galleryArray.length > 0 ? galleryArray : (mainImage ? [mainImage] : []);
  const unit = fabric.unit || "đ/m";

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
            <div className="flex flex-col md:flex-row gap-8 p-6">
              {/* Gallery Section */}
              <div className="md:w-3/5 flex gap-4">
                {/* Vertical Thumbnails (Desktop) */}
                {gallery.length > 1 && (
                  <div className="hidden md:flex flex-col gap-4 w-20 h-[500px] overflow-y-auto no-scrollbar flex-shrink-0">
                    {gallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-20 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${activeImageIndex === idx
                          ? "border-[#1B4332] opacity-100"
                          : "border-transparent opacity-70 hover:opacity-100 hover:border-[#E5E7EB]"
                          }`}
                      >
                        <img
                          src={img}
                          alt={`${fabric.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image Area with Zoom on Hover */}
                <div
                  ref={imageContainerRef}
                  className="flex-1 relative h-[400px] md:h-[500px] rounded-2xl overflow-visible bg-gray-100 group"
                  onMouseEnter={handleImageMouseEnter}
                  onMouseLeave={handleImageMouseLeave}
                  onMouseMove={handleImageMouseMove}
                >
                  <img
                    src={gallery[activeImageIndex]}
                    alt={fabric.name}
                    className="w-full h-full object-cover transition-transform duration-300 cursor-crosshair rounded-2xl"
                    onClick={() => setShowImageLightbox(activeImageIndex)}
                    draggable={false}
                  />

                  {/* Zoom Lens - Shows on hover (Desktop only) */}
                  {isZooming && (
                    <div
                      className="hidden md:block absolute pointer-events-none border-2 border-[#1B4332]/50 bg-white/20 backdrop-blur-[1px] z-10 rounded-lg"
                      style={{
                        width: `${LENS_SIZE}px`,
                        height: `${LENS_SIZE}px`,
                        left: `${lensPosition.x}px`,
                        top: `${lensPosition.y}px`,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.1)',
                      }}
                    >
                      {/* Crosshair inside lens */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-[#1B4332]/30 absolute"></div>
                        <div className="w-[1px] h-full bg-[#1B4332]/30 absolute"></div>
                      </div>
                    </div>
                  )}

                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {fabric.salePrice && (
                      <span className="bg-[#9333EA] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Sale
                      </span>
                    )}
                    {(new Date() - new Date(fabric.createdAt) < 7 * 24 * 60 * 60 * 1000) && (
                      <span className="bg-[#CA8A04] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        New
                      </span>
                    )}
                    {fabric.tag && (
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                        {fabric.tag}
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Navigation Arrows */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}

                  {/* Mobile Pagination Dots */}
                  {gallery.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                      {gallery.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-3' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Zoom Hint - Show on hover when not zooming */}
                  {!isZooming && (
                    <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      Di chuột để phóng to
                    </div>
                  )}

                  {/* Zoom Panel - Fixed overlay positioned to the right (Desktop only) */}
                  {isZooming && (
                    <div
                      className="hidden md:block fixed z-[100] w-[450px] h-[550px] rounded-2xl overflow-hidden border-2 border-[#1B4332]/30 shadow-2xl bg-white"
                      style={{
                        top: '120px',
                        left: 'calc(50% + 280px)',
                        backgroundImage: `url(${gallery[activeImageIndex]})`,
                        backgroundSize: `${100 * ZOOM_LEVEL}%`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {/* Zoom Info Badge */}
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] rounded-full flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        {ZOOM_LEVEL}x zoom
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Horizontal Thumbnails (Visible only on mobile) */}
              <div className="md:hidden flex gap-2 overflow-x-auto pb-2 px-6 no-scrollbar snap-x">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 snap-start ${activeImageIndex === idx ? "border-[#1B4332]" : "border-transparent"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
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
                      {getDisplayPrice()}{" "}
                      <span className="text-[11px] font-normal">{unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                      Gợi ý sử dụng
                    </p>
                    <p className="mt-1">
                      {fabric.tag?.includes("Suiting")
                        ? "Vest, áo khoác mỏng, quần tây."
                        : fabric.tag?.includes("Cotton")
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
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${showShippingDetails ? "rotate-180" : ""
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
                        {fabric.stretch ?
                          (fabric.stretch === 'NONE' ? 'Không co giãn' :
                            fabric.stretch === 'LOW' ? 'Ít co giãn' :
                              fabric.stretch === 'MEDIUM' ? 'Co giãn vừa' :
                                fabric.stretch === 'HIGH' ? 'Co giãn nhiều' : fabric.stretch)
                          : "Vừa / Ít co giãn"}
                      </span>
                    </span>
                    {fabric.weight && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">
                        <span>▥</span>
                        <span>
                          Định lượng: {fabric.weight} gsm
                        </span>
                      </span>
                    )}
                    {fabric.width && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#047857]">
                        <span>📐</span>
                        <span>Khổ vải: {fabric.width} cm</span>
                      </span>
                    )}
                    {fabric.season && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF7ED] text-[#C2410C]">
                        <span>🌤</span>
                        <span>
                          Mùa:{" "}
                          {fabric.season === 'SPRING' ? 'Xuân' :
                            fabric.season === 'SUMMER' ? 'Hè' :
                              fabric.season === 'AUTUMN' ? 'Thu' :
                                fabric.season === 'WINTER' ? 'Đông' :
                                  fabric.season === 'ALL_SEASON' ? '4 mùa' : fabric.season}
                        </span>
                      </span>
                    )}
                    {fabric.pattern && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED]">
                        <span>🎨</span>
                        <span>
                          Họa tiết:{" "}
                          {fabric.pattern === 'SOLID' ? 'Trơn' :
                            fabric.pattern === 'STRIPED' ? 'Kẻ sọc' :
                              fabric.pattern === 'CHECKED' ? 'Kẻ ca-rô' :
                                fabric.pattern === 'FLORAL' ? 'Hoa văn' :
                                  fabric.pattern === 'GEOMETRIC' ? 'Hình học' :
                                    fabric.pattern === 'ABSTRACT' ? 'Trừu tượng' :
                                      fabric.pattern === 'POLKA_DOT' ? 'Chấm bi' :
                                        fabric.pattern === 'TEXTURED' ? 'Dệt vân' : fabric.pattern}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs Shopee-style */}
                <div className="mt-2">
                  <div className="flex gap-4 border-b border-[#E5E7EB] text-[13px]">
                    <button
                      onClick={() => setActiveTab("description")}
                      className={`pb-2 ${activeTab === "description"
                        ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                        : "text-[#6B7280]"
                        }`}
                    >
                      Mô tả
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`pb-2 ${activeTab === "reviews"
                        ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                        : "text-[#6B7280]"
                        }`}
                    >
                      Đánh giá ({reviews.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("qa")}
                      className={`pb-2 ${activeTab === "qa"
                        ? "border-b-2 border-[#1B4332] text-[#1B4332] font-semibold"
                        : "text-[#6B7280]"
                        }`}
                    >
                      Hỏi đáp
                    </button>
                  </div>

                  {activeTab === "description" && (
                    <div className="pt-3 space-y-3 text-[12px]">
                      <p className="font-semibold text-[#111827]">
                        Mô tả chi tiết & thông số vải
                      </p>
                      {fabric.description && (
                        <p className="text-[#4B5563] leading-relaxed">{fabric.description}</p>
                      )}
                      <ul className="list-disc list-inside space-y-1.5 text-[#6B7280]">
                        <li>
                          Thành phần:{" "}
                          <span className="font-medium text-[#111827]">
                            {fabric.material || "Đang cập nhật"}
                          </span>
                        </li>
                        <li>
                          Khổ vải:{" "}
                          <span className="font-medium text-[#111827]">
                            {fabric.width ? `${fabric.width} cm` : "Đang cập nhật"}
                          </span>
                        </li>
                        <li>
                          Trọng lượng:{" "}
                          <span className="font-medium text-[#111827]">
                            {fabric.weight ? `${fabric.weight} gsm` : "Đang cập nhật"}
                          </span>
                        </li>
                        {fabric.color && (
                          <li>
                            Màu sắc:{" "}
                            <span className="font-medium text-[#111827]">
                              {fabric.color}
                            </span>
                          </li>
                        )}
                        {fabric.origin && (
                          <li>
                            Xuất xứ:{" "}
                            <span className="font-medium text-[#111827]">
                              {fabric.origin}
                            </span>
                          </li>
                        )}
                        {fabric.careInstructions && (
                          <li>
                            Bảo quản:{" "}
                            <span className="font-medium text-[#111827]">
                              {fabric.careInstructions}
                            </span>
                          </li>
                        )}
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
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setStarFilter(0)}
                            className={`px-3 py-1 rounded-full border text-[11px] ${starFilter === 0
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
                              className={`px-3 py-1 rounded-full border text-[11px] ${starFilter === star
                                ? "bg-[#1B4332] text-white border-[#1B4332]"
                                : "border-[#E5E7EB] text-[#374151]"
                                }`}
                            >
                              {star}★ ({ratingSummary.counts?.[star] || 0})
                            </button>
                          ))}
                        </div>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-1 rounded-full border border-[#E5E7EB] text-[11px] text-[#374151] bg-white focus:outline-none focus:border-[#1B4332]"
                        >
                          <option value="newest">Mới nhất</option>
                          <option value="oldest">Cũ nhất</option>
                          <option value="highest">Đánh giá cao nhất</option>
                          <option value="lowest">Đánh giá thấp nhất</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const reviewsToShow = filteredReviews;

                          if (!reviewsToShow || !Array.isArray(reviewsToShow) || reviewsToShow.length === 0) {
                            return (
                              <div className="text-center py-8 text-[#6B7280] text-[12px]">
                                <p>Chưa có đánh giá nào cho sản phẩm này</p>
                                <p className="text-[11px] text-[#9CA3AF] mt-1">
                                  {starFilter > 0
                                    ? `Không có đánh giá ${starFilter} sao nào`
                                    : "Hãy là người đầu tiên đánh giá sản phẩm này"}
                                </p>
                              </div>
                            );
                          }

                          return reviewsToShow.map((review, idx) => (
                            <div
                              key={review.id || `review-${idx}`}
                              className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white/70 p-3 hover:shadow-sm transition-shadow"
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex-shrink-0 flex items-center justify-center">
                                {review.images && review.images.length > 0 ? (
                                  <img
                                    src={review.images[0]}
                                    alt={review.customerName || review.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {(review.customerName || review.name || "K")[0].toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-[#111827] text-[12px]">
                                    {review.customerName || review.name || "Khách hàng"}
                                  </p>
                                  <div className="flex items-center">
                                    {renderStars(review.rating || 5)}
                                  </div>
                                  {review.createdAt && (
                                    <span className="text-[10px] text-[#9CA3AF] ml-auto">
                                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                    </span>
                                  )}
                                </div>
                                {review.comment && (
                                  <p className="text-[#4B5563] text-[12px] mb-2 leading-relaxed">
                                    {review.comment}
                                  </p>
                                )}

                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                  <div className="grid grid-cols-4 gap-2 mt-2">
                                    {review.images.slice(0, 4).map((img, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={img}
                                        alt={`Review ${imgIdx + 1}`}
                                        className="w-full h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          setShowImageLightbox({ review, imageIndex: imgIdx });
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Verified badge if from order */}
                                {review.orderId && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-[10px] text-green-600">Đã mua hàng</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
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
                              onClick={() => navigate(`/fabrics/${relatedFabric.slug || relatedFabric.code || relatedFabric.id}`)}
                            >
                              <img
                                src={relatedFabric.image}
                                alt={relatedFabric.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <p className="text-[13px] font-medium text-[#111827] mb-2 line-clamp-2 cursor-pointer hover:text-[#F97316]"
                              onClick={() => navigate(`/fabrics/${relatedFabric.slug || relatedFabric.code || relatedFabric.id}`)}
                            >
                              {relatedFabric.name}
                            </p>
                            <div className="mb-2">
                              <p className="text-[16px] font-semibold text-[#F97316]">
                                {relatedFabric.price}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/fabrics/${relatedFabric.slug || relatedFabric.code || relatedFabric.id}`)}
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
        {/* REVIEW SECTION */}
        {fabric?.id && (
          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
            <ReviewSection
              productId={fabric.id}
              productName={fabric.name}
              productImage={fabric.image}
              type="PRODUCT"
            />
          </div>
        )}

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
                  {fabric.tag && (
                    <p className="text-[12px] text-[#6B7280] mb-2">
                      {fabric.tag}
                    </p>
                  )}
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

      {/* Image Lightbox */}
      {showImageLightbox !== null && showImageLightbox.review?.images && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setShowImageLightbox(null)}
        >
          <button
            onClick={() => setShowImageLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {showImageLightbox.review.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageLightbox(prev => ({
                    ...prev,
                    imageIndex: prev.imageIndex > 0 ? prev.imageIndex - 1 : prev.review.images.length - 1
                  }));
                }}
                className="absolute left-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageLightbox(prev => ({
                    ...prev,
                    imageIndex: prev.imageIndex < prev.review.images.length - 1 ? prev.imageIndex + 1 : 0
                  }));
                }}
                className="absolute right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <img
            src={showImageLightbox.review.images[showImageLightbox.imageIndex]}
            alt={`Review image ${showImageLightbox.imageIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {showImageLightbox.review.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {showImageLightbox.imageIndex + 1} / {showImageLightbox.review.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


