import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header.jsx";
import { getCurrentUser } from "../utils/authStorage.js";
import { getWorkingSlots, updateWorkingSlot } from "../utils/workingSlotStorage.js";
import { addAppointment } from "../utils/appointmentStorage.js";
import { productService, authService, imageAssetService, reviewService } from "../services/index.js";
import favoriteService from '../services/favoriteService';
import OptimizedImage from "../components/OptimizedImage.jsx";
import ReviewSection from "../components/ReviewSection.jsx";
import {
  ArrowLeft,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  Ruler,
  Info,
  Droplets,
  Shirt,
  Loader,
  Heart,
  Palette,
  Shield,
  UserCheck,
  Edit,
  Edit3,
  X
} from 'lucide-react';

const ProductDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { key: urlKey } = useParams();

  // Get product key from URL params or location state
  const productKeyFromState = location.state?.product?.key || location.state?.product?.slug;
  const productKey = urlKey || productKeyFromState || "product-detail";

  // State for product Data from API
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback product from location state
  const fallbackProduct = location.state?.product || {
    name: "Sản phẩm may đo",
    desc: "Mô tả sản phẩm",
    price: "0 ₫",
    tag: "Bộ sưu tập",
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
    type: "newArrival",
  };

  // Use productData from API if available, otherwise use fallback
  const product = productData || fallbackProduct;

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Load favorite status from API
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!authService.isAuthenticated?.()) {
        setIsFavorited(false);
        return;
      }

      // Determine Item Type and ID
      // If productKey starts with "image-", it is IMAGE_ASSET
      // Else it is PRODUCT
      // BUT current flow: productData might be loaded later.
      // logic: wait for productData? 
      // Actually we can check by key for products, but for image assets we need ID.

      const isImageAsset = productKey && String(productKey).startsWith("image-");
      const itemId = product?.id ?? productData?.id ?? null;

      if (!itemId && !productKey) {
        setIsFavorited(false);
        return;
      }

      try {
        let response;
        if (isImageAsset) {
          // For image asset, we need ID. productKey is "image-{id}"
          const idPart = productKey.replace("image-", "");
          response = await favoriteService.check("IMAGE_ASSET", idPart);
        } else {
          // Product
          if (itemId) {
            response = await favoriteService.check("PRODUCT", itemId);
          } else {
            response = await favoriteService.checkByKey(productKey);
          }
        }

        const data = response?.responseData ?? response?.data?.responseData ?? response?.data ?? response;
        setIsFavorited(data?.isFavorite ?? false);
      } catch (error) {
        console.error("Error checking favorite status:", error);
        setIsFavorited(false);
      }
    };

    if (productKey && productKey !== "product-detail") {
      checkFavoriteStatus();
    }
  }, [productKey, product?.id, productData?.id]);

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

        // Check if this is an image asset key (format: image-{id})
        if (String(productKey).startsWith("image-")) {
          const imageId = productKey.replace("image-", "");
          try {
            const response = await imageAssetService.getById(imageId);
            const imageData = imageAssetService.parseResponse(response);

            if (imageData) {
              const typeLabels = {
                "ao_dai": "Áo dài",
                "ao_dai_cuoi": "Áo dài cưới",
                "vest": "Vest",
                "blazer": "Blazer",
                "vay_dam": "Váy đầm",
                "dam_da_hoi": "Đầm dạ hội",
                "dam_cocktail": "Đầm cocktail",
                "dam_cuoi": "Đầm cưới",
                "ao_so_mi": "Áo sơ mi",
                "quan_tay": "Quần tây",
              };

              setProductData({
                id: imageData.id,
                key: productKey,
                fileName: imageData.fileName, // Store fileName for header
                name: typeLabels[imageData.type] || imageData.type?.replace(/_/g, " ") || "Sản phẩm AI",
                description: imageData.description || "Thiết kế được phân tích bởi AI",
                tag: "AI Design",
                image: imageData.url || imageData.thumbnailUrl,
                media: {
                  thumbnail: imageData.thumbnailUrl || imageData.url,
                  url: imageData.url,
                  large: imageData.url,
                },
                pricing: { basePrice: null },
                specifications: {
                  tailoringTime: imageData.tailoringTime,
                  fittingCount: imageData.fittingCount,
                  warranty: imageData.warranty,
                  silhouette: imageData.silhouette,
                  length: imageData.lengthInfo,
                  materials: imageData.materials,
                  lining: imageData.lining,
                  colors: imageData.colors,
                  accessories: imageData.accessories,
                },
                occasions: imageData.occasions || [],
                customerStyles: imageData.customerStyles || [],
                careInstructions: imageData.careInstructions ? [imageData.careInstructions] : [],
                styleCategory: imageData.styleCategory,
                occasion: imageData.occasion,
                season: imageData.season,
                gender: imageData.gender,
                tags: imageData.tags,
                confidence: imageData.confidence,
                s3Key: imageData.s3Key
              });
              return;
            }
          } catch (imgErr) {
            console.error("Error loading image asset:", imgErr);
          }
        }

        // Regular product key
        const response = await productService.getDetail(productKey);
        const data = productService.parseResponse(response);

        if (data) {
          setProductData(data);
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
        images.push({
          thumbnail: productData.media.thumbnail,
          url: productData.media.url || productData.media.thumbnail,
          large: productData.media.large || productData.media.url || productData.media.thumbnail,
        });
      }
      if (productData.media.gallery && Array.isArray(productData.media.gallery)) {
        productData.media.gallery.forEach(img => {
          images.push({
            thumbnail: img.thumbnail || img,
            url: img.url || img,
            large: img.large || img.url || img,
          });
        });
      }
      return images.length > 0 ? images : [{
        thumbnail: product.image || fallbackProduct.image,
        url: product.image || fallbackProduct.image,
        large: product.image || fallbackProduct.image,
      }];
    }

    const fallbackImg = product.image || fallbackProduct.image;
    // For image assets, use single image
    if (productKey && String(productKey).startsWith("image-")) {
      return [{
        thumbnail: fallbackImg,
        url: fallbackImg,
        large: fallbackImg,
      }];
    }

    return [
      { thumbnail: fallbackImg, url: fallbackImg, large: fallbackImg },
    ];
  }, [productData, product.image, fallbackProduct.image, productKey]);

  const specs = productData?.specifications || {};
  const occasions = productData?.occasions || [];
  const customerStyles = productData?.customerStyles || [];
  const careInstructions = productData?.careInstructions || [];

  const handleBackClick = () => navigate(-1);
  const handleOrderClick = () => navigate("/customer/order", { state: { product } });

  const handleToggleFavorite = async () => {
    if (!authService.isAuthenticated?.()) {
      alert("Vui lòng đăng nhập để lưu vào danh sách yêu thích.");
      return;
    }

    if (!productKey) return;

    const isImageAsset = String(productKey).startsWith("image-");
    const itemId = product?.id ?? productData?.id ?? null;
    const wasFavorite = isFavorited;

    // Optimistic update
    setIsFavorited(!wasFavorite);

    try {
      if (wasFavorite) {
        // Remove
        if (isImageAsset) {
          const idPart = productKey.replace("image-", "");
          await favoriteService.remove("IMAGE_ASSET", idPart);
        } else {
          if (itemId) await favoriteService.remove("PRODUCT", itemId);
          else await favoriteService.removeByKey(productKey);
        }
      } else {
        // Add
        if (isImageAsset) {
          const idPart = productKey.replace("image-", "");
          await favoriteService.add({
            itemType: "IMAGE_ASSET",
            itemId: idPart,
            itemKey: productData?.s3Key
          });
        } else {
          await favoriteService.add({ itemType: "PRODUCT", itemId, itemKey: productKey });
        }
      }
    } catch (error) {
      console.error("Failed to sync favorite with backend:", error);
      setIsFavorited(wasFavorite); // Rollback
      alert("Không thể cập nhật trạng thái yêu thích.");
    }
  };

  // Consultation Logic
  useEffect(() => {
    if (showConsultationModal) {
      const slots = getWorkingSlots().filter(
        (slot) => slot.type === "consult" && slot.status === "available" && (slot.bookedCount || 0) < (slot.capacity || 1)
      );
      setAvailableSlots(slots);
    }
  }, [showConsultationModal]);

  const next14Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      return d;
    });
  }, []);

  const daysWithSlots = useMemo(() => new Set(availableSlots.map((slot) => slot.date)), [availableSlots]);
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots.filter((slot) => slot.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availableSlots, selectedDate]);

  const handleOpenConsultation = () => {
    if (!getCurrentUser()) {
      alert("Vui lòng đăng nhập để đặt lịch tư vấn.");
      navigate("/login");
      return;
    }
    setShowConsultationModal(true);
    setSelectedDate("");
    setSelectedSlotId(null);
    setBookingSuccess(false);
  };

  const formatDateLabel = (date) => {
    return date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  const handleConfirmBooking = () => {
    if (!selectedSlotId || !selectedDate) return alert("Vui lòng chọn ngày và giờ hẹn.");
    if (!getCurrentUser()) return alert("Vui lòng đăng nhập để đặt lịch.");

    setIsBooking(true);
    const slot = availableSlots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setIsBooking(false);
      return alert("Slot không còn khả dụng.");
    }

    const user = getCurrentUser();
    addAppointment({
      customerId: user.username || user.phone,
      slotId: slot.id,
      orderId: null,
      type: "consult",
      status: "pending",
      note: `Tư vấn về sản phẩm: ${product.name} `,
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
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2933] font-sans antialiased pb-20">
      <Header />

      {/* HEADER SPACER */}
      <div className="h-[120px] md:h-[140px]"></div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 transition-all duration-500 ease-in-out">
        {/* Breadcrumbs & Back */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleBackClick} className="flex items-center gap-2 text-gray-500 hover:text-[#1B4332] transition-colors rounded-lg px-3 py-2 hover:bg-white">
            <ArrowLeft size={18} />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full border transition-all ${isFavorited ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-gray-200 text-gray-400 hover:text-[#1B4332]'} `}
              title={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
            </button>
            <button className="p-2 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#1B4332] transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader className="w-12 h-12 text-[#1B4332] animate-spin mb-4" />
            <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button onClick={handleBackClick} className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 animate-fade-in-up">

            {/* === LEFT COLUMN: IMAGES === */}
            <div className="space-y-6">
              <div className="relative aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                <OptimizedImage
                  src={productImages[selectedImage]?.large}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {String(productKey).startsWith("image-") && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#1B4332] px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 shadow-sm flex items-center gap-2">
                    <Sparkles size={14} className="text-[#D4AF37]" />
                    AI Analyzed
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[#1B4332] shadow-md ring-1 ring-[#1B4332]/20' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <OptimizedImage src={img.thumbnail} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === RIGHT COLUMN: DETAILS CARDS === */}
            <div className="space-y-6">

              {/* 1. Header Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-gray-200">
                        {product.tag}
                      </span>
                      {product.type === "newArrival" && (
                        <span className="bg-[#1B4332]/10 text-[#1B4332] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-[#1B4332]/20">
                          New Arrival
                        </span>
                      )}
                    </div>
                    <h1 className="font-heading text-3xl text-gray-900 mb-2">{product.name}</h1>
                    <div className="flex items-end gap-3 text-[#1B4332]">
                      <span className="text-2xl font-bold font-heading">{product.price || "Liên hệ"}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={handleOrderClick}
                    className="bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#14532d] transition-all shadow-lg flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <Scissors size={18} />
                    Đặt may ngay
                  </button>
                  <button
                    onClick={handleOpenConsultation}
                    className="bg-white text-[#1B4332] border-2 border-[#1B4332] py-3 rounded-xl font-medium hover:bg-[#1B4332] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Clock size={18} />
                    Hẹn tư vấn
                  </button>
                </div>
              </div>

              {/* 2. Description Card (Mô tả sản phẩm) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="text-blue-600" size={18} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Mô tả sản phẩm</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.desc || product.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={14} className="text-blue-600" />
                        <span className="text-[10px] uppercase font-bold text-blue-800">Thời gian</span>
                      </div>
                      <p className="text-sm font-medium text-blue-900">{specs.tailoringTime || "7-14 ngày"}</p>
                    </div>
                    <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserCheck size={14} className="text-purple-600" />
                        <span className="text-[10px] uppercase font-bold text-purple-800">Thử đồ</span>
                      </div>
                      <p className="text-sm font-medium text-purple-900">{specs.fittingCount || "1-2 lần"}</p>
                    </div>
                    <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield size={14} className="text-emerald-600" />
                        <span className="text-[10px] uppercase font-bold text-emerald-800">Bảo hành</span>
                      </div>
                      <p className="text-sm font-medium text-emerald-900">{specs.warranty || "Trọn đời"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Tailoring Details Card (Chi tiết may đo) */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Scissors className="text-white" size={18} />
                  </div>
                  <h3 className="text-base font-bold text-amber-900">Chi tiết may đo</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Form dáng</span>
                    <p className="text-sm font-medium text-gray-800">{specs.silhouette || "Theo số đo"}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Độ dài</span>
                    <p className="text-sm font-medium text-gray-800">{specs.length || "Tùy chỉnh"}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Lót trong</span>
                    <p className="text-sm font-medium text-gray-800">{specs.lining || "Lụa Habutai"}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Phụ kiện</span>
                    <p className="text-sm font-medium text-gray-800">{specs.accessories || "Không"}</p>
                  </div>
                </div>

                {specs.materials && specs.materials.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-800">
                      <Palette size={12} /> CHẤT LIỆU GỢI Ý
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specs.materials.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-white border border-amber-200 rounded text-xs text-amber-900 font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {specs.colors && specs.colors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-800">
                      <Palette size={12} /> MÀU SẮC
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specs.colors.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-white border border-amber-200 rounded text-xs text-amber-900 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Suitability Card (Phù hợp với) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Heart className="text-pink-600" size={18} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Mẫu này phù hợp với</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-pink-700 uppercase mb-3">
                      <Sparkles size={14} /> Dịp sử dụng
                    </h4>
                    <ul className="space-y-2">
                      {(occasions.length > 0 ? occasions : ["Tiệc cưới", "Sự kiện", "Kỷ niệm"]).map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-pink-400 mt-1">•</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase mb-3">
                      <UserCheck size={14} /> Phong cách
                    </h4>
                    <ul className="space-y-2">
                      {(customerStyles.length > 0 ? customerStyles : ["Thanh lịch", "Sang trọng"]).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-400 mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. Care Instructions Card (Bảo quản) */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Shield className="text-white" size={18} />
                  </div>
                  <h3 className="text-base font-bold text-green-900">Gợi ý bảo quản</h3>
                </div>
                <ul className="space-y-2">
                  {(careInstructions.length > 0 ? careInstructions : ["Giặt tay nhẹ nhàng", "Tránh ánh nắng trực tiếp"]).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                      <span className="text-green-500 font-bold">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 6. Classification Card */}
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center text-indigo-700">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600 font-bold uppercase">Phân loại</p>
                    <p className="text-sm font-medium text-indigo-900">
                      {productData?.gender || "Unisex"} • {productData?.type || "General"}
                    </p>
                  </div>
                </div>
                {productData?.confidence && (
                  <div className="text-right">
                    <p className="text-[10px] text-indigo-400 font-bold">AI CONFIDENCE</p>
                    <p className="text-lg font-bold text-indigo-700">{(productData.confidence * 100).toFixed(0)}%</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* REVIEW SECTION */}
      {productData?.id && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 border-t border-gray-200">
          <ReviewSection
            productId={String(productKey).startsWith("image-") ? null : productData.id}
            imageAssetId={String(productKey).startsWith("image-") ? productData.id : null}
            productName={productData.name || product.name}
            productImage={productData.image || product.image}
            type={String(productKey).startsWith("image-") ? "IMAGE_ASSET" : "PRODUCT"}
          />
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#1F2937] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="text-[#D4AF37]" size={24} />
                <span className="font-heading text-xl font-bold tracking-wider">LAVI TAILOR</span>
              </div>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">
                Nghệ thuật may đo thủ công kết hợp công nghệ hiện đại. Mang đến vẻ đẹp độc bản cho riêng bạn.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Về chúng tôi
              </h4>
              <p className="text-[#9CA3AF]">
                Giới thiệu
                <br />
                Đội ngũ
                <br />
                Tuyển dụng
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

      {/* Consultation Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up overflow-hidden">
            <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Đặt lịch tư vấn</h3>
                <p className="text-xs text-gray-500">{product.name}</p>
              </div>
              <button onClick={() => setShowConsultationModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h4>
                  <p className="text-gray-600">Lịch hẹn của bạn đã được ghi nhận.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {next14Days.map((date, idx) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const hasSlot = daysWithSlots.has(dateStr);
                        return (
                          <button
                            key={idx}
                            disabled={!hasSlot}
                            onClick={() => { setSelectedDate(dateStr); setSelectedSlotId(null); }}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${selectedDate === dateStr
                                ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-md'
                                : hasSlot
                                  ? 'bg-white text-gray-800 border-gray-200 hover:border-[#1B4332]'
                                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              }`}
                          >
                            <div className="text-xs opacity-80">{date.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
                            <div className="font-bold">{date.getDate()}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="animate-fade-in-up">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chọn giờ ({formatDateLabel(new Date(selectedDate))})</label>
                      {timeSlotsForDate.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {timeSlotsForDate.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`py-2 rounded-lg text-sm font-medium transition-all ${selectedSlotId === slot.id
                                  ? 'bg-[#1B4332] text-white shadow-md'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:border-[#1B4332]'
                                }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Không có lịch trống cho ngày này.</p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={handleConfirmBooking}
                      disabled={isBooking || !selectedSlotId}
                      className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#14532d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {isBooking ? <Loader className="animate-spin" size={20} /> : <Calendar size={20} />}
                      Xác nhận đặt lịch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
