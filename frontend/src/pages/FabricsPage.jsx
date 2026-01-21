import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import ProductSchema from "../components/schema/ProductSchema.jsx";
import { fabricService, appointmentService, workingSlotService, cartService, favoriteService, authService } from "../services";
import flashSaleService from "../services/flashSaleService.js";
import QuickViewModal from "../components/QuickViewModal.jsx";
import { getCurrentUser } from "../utils/authStorage";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

// Fallback image URL - fabric texture image
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=900&auto=format&fit=crop&q=80";

// Helper function to validate and fix image URL
const validateImageUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  // Accept valid URLs: http/https URLs or base64 data URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
    return url;
  }
  // If URL is incomplete (starts with photo-), it's likely a broken Unsplash URL
  return FALLBACK_IMAGE;
};

// Helper function to format price
const formatPrice = (pricePerMeter) => {
  if (!pricePerMeter) return "Liên hệ";
  const price = typeof pricePerMeter === 'number' ? pricePerMeter : parseFloat(pricePerMeter);
  return `Từ ${price.toLocaleString('vi-VN')} đ/m`;
};

// Helper function to map API response to component format
const mapFabricFromAPI = (fabric) => {
  // Backend can return image in different fields: image, imageUrl, or gallery[0]
  // Priority: fabric.image -> fabric.imageUrl -> gallery[0] -> FALLBACK
  let mainImage = fabric.image || fabric.imageUrl;

  // Parse gallery - can be array or JSON string
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

  // If no main image, use first gallery image
  if (!mainImage && galleryArray.length > 0) {
    mainImage = galleryArray[0];
  }

  // Validate and get final image URL
  const imageUrl = validateImageUrl(mainImage);
  const galleryUrls = galleryArray.length > 0
    ? galleryArray.map(validateImageUrl)
    : (imageUrl !== FALLBACK_IMAGE ? [imageUrl] : [FALLBACK_IMAGE]);

  return {
    id: fabric.id,
    key: fabric.slug || fabric.code || `fabric-${fabric.id}`,
    name: fabric.name || "Vải chưa có tên",
    desc: fabric.description || "",
    image: imageUrl,
    gallery: galleryUrls,
    price: formatPrice(fabric.pricePerMeter),
    unit: "đ/m",
    tag: fabric.category ? `${fabric.category}` : "Vải",
    sold: 0,
    rating: null,
    specs: {
      composition: fabric.material || "",
      width: fabric.width ? `Khổ ${fabric.width}m` : "",
      weight: fabric.weight ? `Khoảng ${fabric.weight} gsm` : "",
    },
    isAvailable: fabric.isAvailable !== false,
    availableQuantity: fabric.availableQuantity || 0,
    // Store color from backend if available
    color: fabric.color || null,
  };
};

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heldIds, setHeldIds] = useState([]);
  const [visitIds, setVisitIds] = useState([]);
  const [favoriteFabricIds, setFavoriteFabricIds] = useState([]);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [flashNow, setFlashNow] = useState(() => new Date());
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [visitSlots, setVisitSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedQuickViewFabric, setSelectedQuickViewFabric] = useState(null);
  // Flash sale states
  const [activeFlashSales, setActiveFlashSales] = useState([]);
  const [upcomingFlashSales, setUpcomingFlashSales] = useState([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(true);
  const itemsPerPage = 18;
  const navigate = useNavigate();

  const schemaFabrics = useMemo(
    () =>
      fabrics.map((fabric) => ({
        name: fabric.name,
        desc: fabric.desc,
        image: fabric.image,
        price: fabric.price,
        key: fabric.key,
        category: fabric.tag,
        material: fabric.specs?.composition,
      })),
    [fabrics]
  );

  usePageMeta({
    title: "Kho vải lụa, linen, satin | My Hiền Tailor",
    description:
      "Chọn vải lụa, linen, satin, cashmere... được My Hiền Tailor tuyển chọn cho áo dài, vest và đầm may đo cao cấp.",
  });

  // Load fabrics from API
  const loadFabrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fabricService.list({}, { page: currentPage - 1, size: itemsPerPage });
      const responseData = response?.data ?? response?.responseData ?? response;
      const fabricsList = responseData?.content || responseData?.data || [];
      const totalElements = responseData?.totalElements || 0;
      const totalPages = responseData?.totalPages || 1;

      const mappedFabrics = fabricsList.map(mapFabricFromAPI);
      setFabrics(mappedFabrics);
      setTotalElements(totalElements);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Error loading fabrics:", error);
      setError("Không thể tải danh sách vải. Vui lòng thử lại.");
      showError("Không thể tải danh sách vải. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Load fabric holds/visits from API
  const loadFabricHolds = async () => {
    try {
      const response = await fabricService.listHoldRequests({}, { page: 0, size: 1000 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const holdsList = responseData?.content || responseData?.data || [];

      setHeldIds(holdsList.filter((h) => h.type === "HOLD").map((h) => h.fabric?.id || h.fabricId));
      setVisitIds(holdsList.filter((h) => h.type === "VISIT").map((h) => h.fabric?.id || h.fabricId));
    } catch (error) {
      console.error("Error loading fabric holds:", error);
    }
  };

  // Load favorite fabrics from backend when user is logged in
  const loadFavoriteFabrics = async () => {
    try {
      if (!authService.isAuthenticated?.()) {
        setFavoriteFabricIds([]);
        return;
      }

      const response = await favoriteService.listByType("FABRIC", {
        page: 0,
        size: 200,
      });

      const data =
        response?.responseData ??
        response?.data?.responseData ??
        response?.data ??
        response;
      const items = data?.content ?? data?.data ?? [];

      const ids = Array.isArray(items)
        ? items
          .map((fav) => fav.itemId)
          .filter((id) => typeof id === "number" || typeof id === "bigint")
        : [];

      setFavoriteFabricIds(ids);
    } catch (err) {
      console.warn("Không thể tải danh sách vải yêu thích:", err);
    }
  };

  // Load flash sales from API
  const loadFlashSales = async () => {
    try {
      setFlashSaleLoading(true);
      const [activeResponse, upcomingResponse] = await Promise.all([
        flashSaleService.getActiveSales(),
        flashSaleService.getUpcomingSales(),
      ]);

      const activeData = activeResponse?.data ?? activeResponse ?? [];
      const upcomingData = upcomingResponse?.data ?? upcomingResponse ?? [];

      setActiveFlashSales(Array.isArray(activeData) ? activeData : []);
      setUpcomingFlashSales(Array.isArray(upcomingData) ? upcomingData : []);
    } catch (error) {
      console.error("Error loading flash sales:", error);
      setActiveFlashSales([]);
      setUpcomingFlashSales([]);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  useEffect(() => {
    loadFabrics();
    loadFabricHolds();
    loadFavoriteFabrics();
    loadFlashSales();
  }, [currentPage]);

  // Toggle favorite for fabric (sync với backend)
  const handleFavoriteFabricToggle = async (event, fabric) => {
    event.stopPropagation();
    if (!fabric?.id) return;

    if (!authService.isAuthenticated?.()) {
      showError("Vui lòng đăng nhập để lưu vải yêu thích.");
      return;
    }

    const isFavorite = favoriteFabricIds.includes(fabric.id);

    // Optimistic update
    setFavoriteFabricIds((prev) =>
      isFavorite ? prev.filter((id) => id !== fabric.id) : [...prev, fabric.id]
    );

    try {
      if (isFavorite) {
        await favoriteService.remove("FABRIC", fabric.id);
      } else {
        await favoriteService.add({
          itemType: "FABRIC",
          itemId: fabric.id,
          itemKey: fabric.key,
        });
      }
    } catch (err) {
      console.error("Không thể đồng bộ yêu thích vải với backend:", err);
      // Revert optimistic update nếu lỗi
      setFavoriteFabricIds((prev) =>
        isFavorite
          ? [...prev, fabric.id]
          : prev.filter((id) => id !== fabric.id)
      );
      showError("Không thể cập nhật danh sách vải yêu thích. Vui lòng thử lại.");
    }
  };
  // open modal for visit booking
  const openVisitModal = async (fabric) => {
    setSelectedFabric(fabric);
    try {
      // Load available working slots from API
      const response = await workingSlotService.list({}, { page: 0, size: 500 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const slotsList = responseData?.content || responseData?.data || [];

      // Map working slots to expected format
      // Note: WorkingSlotResponse from BE doesn't have date, type, status, capacity, bookedCount
      // We need to generate dates from effectiveFrom/effectiveTo or use current date
      const today = new Date();
      const availableSlots = slotsList
        .filter((s) => s.isActive !== false)
        .flatMap((s) => {
          // Generate slots for next 30 days
          const slots = [];
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dayOfWeek];

            // Check if slot is active for this day
            if (s.dayOfWeek === dayName && dayOfWeek !== 0) { // Skip Sunday
              slots.push({
                id: s.id,
                date: date.toISOString().split('T')[0],
                startTime: s.startTime,
                endTime: s.endTime,
                type: "consult",
                status: "AVAILABLE",
                capacity: 1,
                bookedCount: 0,
              });
            }
          }
          return slots;
        });

      setVisitSlots(availableSlots);
      const firstDate = availableSlots[0]?.date || "";
      setSelectedDate(firstDate);
      setSelectedSlotId("");
      setVisitModalOpen(true);
    } catch (error) {
      console.error("Error loading working slots:", error);
      showError("Không thể tải lịch hẹn. Vui lòng thử lại.");
    }
  };

  // derived from API data
  const flashSaleConfig = useMemo(() => {
    if (!activeFlashSales || activeFlashSales.length === 0) return null;

    // Use the first active sale as the main config source, or find the one ending soonest
    // For now, let's take the first one
    const mainSale = activeFlashSales[0];
    const endTime = mainSale.endTime ? new Date(mainSale.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);

    return {
      title: mainSale.name || "Flash Sale Đang Diễn Ra",
      desc: mainSale.description || "Ưu đãi đặc biệt cho các sản phẩm vải cao cấp trong khung giờ vàng.",
      highlightTag: "Flash Sale",
      endsAt: endTime,
    };
  }, [activeFlashSales]);

  const [flashRemaining, setFlashRemaining] = useState(0);

  useEffect(() => {
    if (!flashSaleConfig) {
      setFlashRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = flashSaleConfig.endsAt.getTime() - Date.now();
      setFlashRemaining(Math.max(0, remaining));
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [flashSaleConfig]);

  const isFlashActive = activeFlashSales.length > 0 && flashRemaining > 0;

  const formatCountdown = (ms) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(
      Math.floor((totalSeconds % 3600) / 60)
    ).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const flashItems = useMemo(() => {
    if (!activeFlashSales || activeFlashSales.length === 0) return [];

    return activeFlashSales.map(sale => {
      // Create a fabric-like object for display
      return {
        id: sale.fabricId, // Important: use fabricId for navigation
        flashSaleId: sale.id, // Keep flash sale ID for purchase
        key: sale.fabricCode || `flash-${sale.id}`,
        name: sale.fabricName || sale.name,
        desc: sale.description || "",
        image: validateImageUrl(sale.fabricImage),
        price: formatPrice(sale.flashPrice),
        originalPrice: formatPrice(sale.originalPrice),
        discountPercent: sale.discountPercent,
        availableQuantity: sale.availableQuantity,
        totalQuantity: sale.totalQuantity,
        soldQuantity: sale.soldQuantity,
        soldPercentage: sale.soldPercentage || 0,
        tag: "Flash Sale",
      };
    });
  }, [activeFlashSales]);

  useEffect(() => {
    const section = document.getElementById("fabrics-grid-section");
    if (section) {
      const headerHeight = 190;
      const targetTop = section.offsetTop - headerHeight;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [currentPage]);
  const availableVisitDates = useMemo(
    () => [...new Set(visitSlots.map((s) => s.date))],
    [visitSlots]
  );

  const handleHold = async (fabric) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        showError("Vui lòng đăng nhập để đặt giữ vải.");
        return;
      }

      // Get fabric ID
      const fabricId = fabric.id;
      if (!fabricId) {
        showError("Không tìm thấy thông tin vải.");
        return;
      }

      // Note: Backend gets userId from JWT principal, no need to send customerId
      await fabricService.createHoldRequest({
        fabricId: fabricId,
        type: "HOLD",
        quantity: 1, // Default 1 meter
        notes: `Đặt giữ cuộn vải: ${fabric.name}`,
      });

      await loadFabricHolds();
      showSuccess(`Đã đặt giữ cuộn vải "${fabric.name}". Nhân viên sẽ liên hệ xác nhận.`);
    } catch (error) {
      console.error("Error creating hold request:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt giữ vải. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const handleVisitSubmit = async () => {
    if (!selectedFabric) return;
    if (!selectedSlotId) {
      showError("Vui lòng chọn khung giờ xem vải tại tiệm.");
      return;
    }
    const user = getCurrentUser();
    if (!user) {
      showError("Vui lòng đăng nhập để đặt lịch xem vải.");
      return;
    }
    const slot = visitSlots.find((s) => s.id === selectedSlotId);
    if (!slot) return;

    try {
      // Create fabric visit request first
      // Note: Backend gets userId from JWT principal, no need to send customerId
      const fabricId = selectedFabric.id;
      if (fabricId) {
        await fabricService.createHoldRequest({
          fabricId: fabricId,
          type: "VISIT",
          requestedDate: slot.date, // Format: YYYY-MM-DD (LocalDate)
          requestedTime: slot.startTime, // Format: HH:mm (LocalTime)
          notes: `Hẹn xem vải: ${selectedFabric.name}`,
        });
      }

      // Create appointment via API (using customer endpoint)
      const appointmentData = {
        workingSlotId: slot.id,
        type: "CONSULT",
        notes: `Hẹn xem vải: ${selectedFabric.name}`,
      };

      await appointmentService.createByCustomer(appointmentData);

      await loadFabricHolds();
      showSuccess(
        `Đã đặt lịch xem vải "${selectedFabric.name}" lúc ${slot.startTime}–${slot.endTime} ngày ${slot.date}.`
      );
      setVisitModalOpen(false);
    } catch (error) {
      console.error("Error creating visit appointment:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt lịch. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <ProductSchema items={schemaFabrics} />
      <Header currentPage="/fabrics" />

      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-8">
          {isFlashActive && (
            <section className="overflow-hidden rounded-3xl bg-[#B91C1C] text-white shadow-[0_18px_40px_rgba(185,28,28,0.45)] border border-[#F97316]">
              {/* Banner header giống FPT */}
              <div className="bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#7F1D1D] px-4 md:px-8 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">⚡</span>
                  <div>
                    <p className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-amber-200">
                      {flashSaleConfig.highlightTag}
                    </p>
                    <h2 className="heading-font text-[18px] md:text-[22px]">
                      {flashSaleConfig.title}
                    </h2>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100">
                    Kết thúc sau
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-sm md:text-base font-semibold">
                    <span className="tabular-nums">
                      {formatCountdown(flashRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dãy ngày flash sale đơn giản */}
              <div className="bg-[#F9FAFB] text-[#111827] flex overflow-x-auto border-y border-[#F87171]">
                {[0, 1, 2].map((offset) => {
                  const date = new Date(flashNow);
                  date.setDate(date.getDate() + offset);
                  const isToday = offset === 0;
                  return (
                    <div
                      key={offset}
                      className={`flex-1 min-w-[120px] text-center px-4 py-2 text-[12px] border-r border-[#FCD34D] ${isToday
                        ? "bg-[#FEE2E2] font-semibold text-[#B91C1C]"
                        : "bg-white text-[#4B5563]"
                        }`}
                    >
                      <p className="uppercase tracking-[0.16em]">
                        {date.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      <p className="mt-1">
                        {isToday ? "Đang diễn ra" : "Sắp diễn ra"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Danh sách vải flash sale */}
              <div className="bg-white px-4 md:px-6 pb-4 md:pb-6 pt-4">
                <div className="flex items-center justify-between mb-3 text-[12px] text-[#6B7280]">
                  <span>
                    Chỉ áp dụng cho{" "}
                    <span className="font-semibold text-[#B91C1C]">
                      {flashItems.length} sản phẩm
                    </span>{" "}
                    khi đặt mua trong khung giờ này.
                  </span>
                  <button
                    onClick={() => {
                      const section = document.getElementById(
                        "fabrics-grid-section"
                      );
                      if (section) {
                        section.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                    className="hidden md:inline-flex items-center gap-1 rounded-full border border-[#B91C1C] text-[#B91C1C] px-3 py-1 hover:bg-[#B91C1C] hover:text-white"
                  >
                    Xem tất cả vải
                    <span>→</span>
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 text-[12px]">
                  {flashItems.slice(0, 6).map((fabric) => (
                    <div
                      key={fabric.key}
                      className="border border-[#FECACA] rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-28 w-full overflow-hidden bg-gray-100">
                        <img
                          src={fabric.image || FALLBACK_IMAGE}
                          alt={fabric.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                        {fabric.availableQuantity !== null && (
                          <div className="absolute left-0 top-2 bg-[#FBBF24] text-[#7C2D12] text-[10px] font-semibold px-2 py-1 rounded-r-full flex items-center gap-1 z-20">
                            <span>⚡</span>
                            <span>Còn {fabric.availableQuantity > 0 ? fabric.availableQuantity : 0} suất</span>
                          </div>
                        )}

                        {/* Navigation Overlay - z-10 */}
                        <div
                          className="absolute inset-0 z-10 cursor-pointer"
                          onClick={() => navigate(`/fabrics/${fabric.key}`)}
                        />

                        {/* Quick View Button - appears on hover - z-30 */}
                        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-30 pointer-events-none">
                          <div className="pointer-events-auto">
                            <button
                              onClick={(e) => {
                                console.log("Quick View Clicked (Flash Sale)", fabric.name);
                                e.stopPropagation();
                                setSelectedQuickViewFabric(fabric);
                              }}
                              className="w-full py-2 bg-white/95 backdrop-blur-sm text-gray-800 text-[10px] font-medium rounded-md hover:bg-white shadow-lg transition-colors cursor-pointer"
                            >
                              Xem Nhanh
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="line-clamp-2 font-semibold text-[#111827]">
                          {fabric.name}
                        </p>
                        <p className="text-[11px] text-[#6B7280] line-clamp-2">
                          {fabric.desc}
                        </p>
                        <div className="mt-1">
                          <p className="text-sm font-bold text-[#B91C1C]">
                            {fabric.price}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] line-through">
                            Giá thường: {fabric.originalPrice}
                          </p>
                        </div>
                        <button
                          onClick={() => handleHold(fabric)}
                          className="mt-1 w-full rounded-full bg-[#B91C1C] text-white text-[11px] font-semibold py-1.5 hover:bg-[#7F1D1D]"
                        >
                          Đặt mua ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <header className="text-left max-w-3xl space-y-2">
            <h1 className="text-xl md:text-2xl font-medium text-gray-900">
              Bộ sưu tập vải cao cấp
            </h1>
            <p className="text-sm text-gray-600">
              Khám phá các loại vải lụa, linen, cotton và satin được chọn lọc kỹ càng cho may đo cao cấp
            </p>
          </header>

          {message && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
              <div className="mt-24 pointer-events-auto bg-white border border-emerald-200 shadow-2xl rounded-2xl px-4 py-3 text-sm text-emerald-900 flex items-start gap-3 max-w-md">
                <span className="text-lg leading-none">✅</span>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900">Thành công</p>
                  <p className="text-emerald-800">{message}</p>
                </div>
                <button
                  onClick={() => setMessage("")}
                  className="text-slate-500 hover:text-slate-800 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 border-b border-gray-200 pb-4">
            <span>
              Đang có <span className="font-medium text-gray-900">{totalElements}</span> mẫu vải tại tiệm
            </span>
            {totalPages > 1 && (
              <span className="text-xs text-gray-500">
                Trang {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-[#6B7280]">Đang tải danh sách vải...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadFabrics}
                className="mt-4 px-4 py-2 rounded-full bg-[#1B4332] text-white hover:bg-[#133021]"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && fabrics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#6B7280]">Chưa có vải nào trong kho.</p>
            </div>
          )}

          <section
            id="fabrics-grid-section"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {!loading && !error && fabrics.map((fabric) => {
              const isFavorite = favoriteFabricIds.includes(fabric.id);

              // Parse actual colors from backend color field (e.g., "Pink, White" or "Teal")
              const parseColors = (colorString) => {
                if (!colorString) return [];
                return colorString.split(',').map(c => c.trim()).filter(Boolean);
              };

              // Map color names to hex codes for display
              const colorNameToHex = {
                // Basic colors
                'pink': '#FFC0CB', 'hồng': '#FFC0CB',
                'white': '#FFFFFF', 'trắng': '#FFFFFF',
                'black': '#1a1a1a', 'đen': '#1a1a1a',
                'red': '#DC2626', 'đỏ': '#DC2626',
                'blue': '#3B82F6', 'xanh dương': '#3B82F6', 'xanh': '#3B82F6',
                'green': '#22C55E', 'xanh lá': '#22C55E',
                'yellow': '#EAB308', 'vàng': '#EAB308',
                'orange': '#F97316', 'cam': '#F97316',
                'purple': '#9333EA', 'tím': '#9333EA',
                'brown': '#92400E', 'nâu': '#92400E',
                'gray': '#6B7280', 'grey': '#6B7280', 'xám': '#6B7280',
                'beige': '#F5F5DC', 'be': '#F5F5DC',
                'cream': '#FFFDD0', 'kem': '#FFFDD0',
                'navy': '#1e3a5f', 'xanh navy': '#1e3a5f',
                // Fabric-specific colors
                'teal': '#0D9488', 'xanh ngọc': '#0D9488',
                'coral': '#FF7F50', 'san hô': '#FF7F50',
                'mint': '#98FF98', 'bạc hà': '#98FF98',
                'lavender': '#E6E6FA', 'oải hương': '#E6E6FA',
                'seafoam': '#93E9BE', 'xanh biển': '#93E9BE',
                'mulberry': '#C54B8C', 'dâu tằm': '#C54B8C',
                'natural': '#F5F5DC', 'tự nhiên': '#F5F5DC',
                'ivory': '#FFFFF0', 'ngà': '#FFFFF0',
                'burnt orange': '#CC5500',
                'floral': '#DB7093',
              };

              const getColorHex = (colorName) => {
                const lowerName = colorName.toLowerCase();
                return colorNameToHex[lowerName] || '#9CA3AF'; // Default gray if unknown
              };

              const fabricColorNames = parseColors(fabric.color);

              // Find related fabrics with same pattern/design but different colors
              // Look for fabrics with similar names (same base design)
              const getBaseName = (name) => {
                // Extract base pattern name (e.g., "Cotton and Linen Canvas Print" from full name)
                const patterns = ['Block Print', 'Canvas Print', 'Chiffon Print', 'Batik', 'Floral'];
                for (const pattern of patterns) {
                  if (name.includes(pattern)) {
                    const idx = name.indexOf(pattern);
                    return name.substring(0, idx + pattern.length).trim();
                  }
                }
                return null;
              };

              const baseName = getBaseName(fabric.name);
              const colorVariants = baseName
                ? fabrics.filter(f =>
                  f.id !== fabric.id &&
                  getBaseName(f.name) === baseName
                ).slice(0, 4)
                : [];

              // Combine current fabric colors with variants
              const allColorOptions = [
                ...fabricColorNames.map(color => ({
                  color,
                  hex: getColorHex(color),
                  fabricId: fabric.id,
                  fabricKey: fabric.key,
                  isCurrent: true
                })),
                ...colorVariants.flatMap(variant =>
                  parseColors(variant.color).slice(0, 1).map(color => ({
                    color,
                    hex: getColorHex(color),
                    fabricId: variant.id,
                    fabricKey: variant.key,
                    isCurrent: false
                  }))
                )
              ];

              return (
                <article
                  key={fabric.id}
                  className="group flex flex-col"
                >
                  {/* Image Container with Quick View */}
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100 group"
                  >
                    {/* Navigation Overlay - z-10 */}
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={() => navigate(`/fabrics/${fabric.key}`)}
                    />

                    <img
                      src={fabric.image || FALLBACK_IMAGE}
                      alt={fabric.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-0"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />

                    {/* Favorite Button - z-30 (above nav) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteFabricToggle(e, fabric);
                      }}
                      aria-pressed={isFavorite}
                      title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md backdrop-blur-sm transition-all duration-200 z-30 cursor-pointer ${isFavorite
                        ? "bg-rose-50 text-rose-500 border border-rose-200"
                        : "bg-white/90 text-gray-400 hover:text-rose-400"
                        }`}
                    >
                      {isFavorite ? "❤" : "♡"}
                    </button>

                    {/* Quick View Button - appears on hover - z-30 (above nav) */}
                    <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-30 pointer-events-none">
                      <div className="pointer-events-auto">
                        <button
                          onClick={(e) => {
                            console.log("Quick View Clicked (Main Grid)", fabric.name);
                            e.stopPropagation();
                            setSelectedQuickViewFabric(fabric);
                          }}
                          className="w-full py-3 bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-medium rounded-md hover:bg-white shadow-lg transition-colors cursor-pointer"
                        >
                          Xem Nhanh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mt-3 space-y-2">
                    {/* Product Name */}
                    <h3
                      className="text-sm text-gray-800 font-medium line-clamp-2 cursor-pointer hover:text-[#1B4332] transition-colors leading-snug"
                      onClick={() => navigate(`/fabrics/${fabric.key}`)}
                    >
                      {fabric.name}
                    </h3>

                    {/* Price */}
                    <p className="text-sm font-semibold text-gray-900">
                      {fabric.price}
                    </p>

                    {/* Available Colors - Real data from backend */}
                    {allColorOptions.length > 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-gray-500 mb-1.5">Màu có sẵn:</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {allColorOptions.slice(0, 5).map((colorOption, idx) => (
                            <button
                              key={`${colorOption.fabricId}-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!colorOption.isCurrent) {
                                  navigate(`/fabrics/${colorOption.fabricKey}`);
                                }
                              }}
                              className={`w-5 h-5 rounded-full border-2 shadow-sm transition-all duration-200 ${colorOption.isCurrent
                                ? 'border-gray-800 ring-1 ring-offset-1 ring-gray-400'
                                : 'border-gray-200 hover:scale-110 hover:border-gray-400 cursor-pointer'
                                }`}
                              style={{ backgroundColor: colorOption.hex }}
                              title={colorOption.isCurrent ? `${colorOption.color} (đang xem)` : `${colorOption.color} - Click để xem`}
                            />
                          ))}
                          {allColorOptions.length > 5 && (
                            <span
                              className="text-xs text-gray-500 ml-1 cursor-pointer hover:text-[#1B4332] hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/fabrics/${fabric.key}`);
                              }}
                            >
                              +{allColorOptions.length - 5} màu
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-[#E4D8C3] text-[#111827] hover:bg-[#1B4332] hover:text-white hover:border-[#1B4332]"
                  }`}
              >
                ← Trước
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all ${currentPage === page
                            ? "bg-[#1B4332] text-white shadow-md"
                            : "bg-white border border-[#E4D8C3] text-[#111827] hover:bg-[#F8F4EC] hover:border-[#1B4332]"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="text-[#9CA3AF] px-1 select-none"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-[#E4D8C3] text-[#111827] hover:bg-[#1B4332] hover:text-white hover:border-[#1B4332]"
                  }`}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal đặt lịch xem vải */}
      {visitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                  Hẹn xem vải tại tiệm
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedFabric?.name || "Chọn vải"}
                </h3>
              </div>
              <button
                onClick={() => setVisitModalOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3">
                <p className="font-semibold">Tại Atelier My Hiền</p>
                <p className="text-xs">
                  123 Nguyễn Thị Minh Khai, Q.1, TP.HCM · Giờ mở cửa 7:00–23:00
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-semibold">Chọn ngày</p>
                <div className="flex flex-wrap gap-2">
                  {availableVisitDates.length === 0 && (
                    <p className="text-xs text-slate-500">Chưa có ca tư vấn trống.</p>
                  )}
                  {availableVisitDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-3 py-2 rounded-lg border text-xs ${selectedDate === date
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                        }`}
                    >
                      {new Date(date + "T00:00:00").toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-semibold">Chọn giờ</p>
                <div className="grid grid-cols-2 gap-2">
                  {visitSlots
                    .filter((s) => !selectedDate || s.date === selectedDate)
                    .map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`px-3 py-2 rounded-lg border text-xs text-left ${selectedSlotId === slot.id
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                          }`}
                      >
                        {slot.startTime}–{slot.endTime} ·{" "}
                        {(slot.capacity || 1) - (slot.bookedCount || 0)} chỗ trống
                      </button>
                    ))}
                  {visitSlots.filter((s) => !selectedDate || s.date === selectedDate)
                    .length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2">
                        Chưa có khung giờ trống cho ngày đã chọn.
                      </p>
                    )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setVisitModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 text-xs"
                >
                  Đóng
                </button>
                <button
                  onClick={handleVisitSubmit}
                  className="px-5 py-2 rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                >
                  Xác nhận lịch xem vải
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FabricDetailModal({
  fabric,
  onClose,
  onVisit,
  onHold,
  isHeld,
  hasVisit,
}) {
  if (!fabric) return null;

  const today = new Date();
  const defaultDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [visitDate, setVisitDate] = useState(defaultDate);
  const [visitTime, setVisitTime] = useState("10:00");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const gallery =
    fabric.gallery && fabric.gallery.length ? fabric.gallery : [fabric.image];
  const unit = fabric.unit || "đ/m";

  const handleVisitClick = () => {
    onVisit(fabric, { visitDate, visitTime });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-[#E4D8C3] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 relative h-64 md:h-auto">
            <img
              src={gallery[activeImageIndex] || FALLBACK_IMAGE}
              alt={fabric.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = FALLBACK_IMAGE;
              }}
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-[#111827] flex items-center justify-center text-sm shadow"
            >
              ✕
            </button>
            <div className="absolute bottom-3 left-4">
              <span className="inline-flex text-[10px] uppercase tracking-[0.22em] text-white/80">
                {fabric.tag}
              </span>
              <p className="heading-font text-[20px] text-white">
                {fabric.name}
              </p>
            </div>
          </div>
          <div className="md:w-1/2 p-6 space-y-4 text-[13px] text-[#4B5563]">
            <h2 className="text-[16px] font-semibold text-[#111827]">
              {fabric.name}
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Tên sản phẩm vải:{" "}
              <span className="font-medium">{fabric.name}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
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

            <div className="space-y-2">
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

            <div className="space-y-1 text-[12px]">
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

            {gallery.length > 1 && (
              <div className="space-y-1">
                <p className="font-semibold text-[12px] text-[#111827]">
                  Hình ảnh chất liệu
                </p>
                <div className="flex gap-2">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-11 h-11 rounded-lg overflow-hidden border ${activeImageIndex === idx
                        ? "border-[#1B4332]"
                        : "border-transparent"
                        }`}
                    >
                      <img
                        src={img || FALLBACK_IMAGE}
                        alt={`${fabric.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fabric.videoUrl && (
              <div className="space-y-1">
                <p className="font-semibold text-[12px] text-[#111827]">
                  Video test vải
                </p>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#E5E7EB]">
                  <iframe
                    width="100%"
                    height="100%"
                    src={fabric.videoUrl}
                    title="Video test vải"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            <div className="space-y-2 text-[12px]">
              <p className="font-semibold text-[#111827]">
                Chọn ngày và giờ đến xem vải
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#6B7280] mb-1">Ngày đến tiệm</p>
                  <input
                    type="date"
                    value={visitDate}
                    min={today.toISOString().slice(0, 10)}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-[12px]"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] mb-1">Giờ dự kiến</p>
                  <input
                    type="time"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-[12px]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 text-[11px] text-[#6B7280] space-y-1">
              <p className="font-semibold text-[#111827] text-[12px]">
                Thông tin tiệm may
              </p>
              <p>Tiệm May Mỹ Hiền · 123 Đường ABC, Quận XYZ, TP. HCM</p>
              <p>Giờ mở cửa: 09:00 – 20:00 (Thứ 2 – Chủ nhật)</p>
              <p>Hotline: 0901 134 256 · Zalo / Call</p>
            </div>

            <div className="space-y-2 pt-1">
              <p className="font-semibold text-[12px] text-[#111827]">
                Đánh giá từ khách đã may
              </p>
              {(fabric.reviews && fabric.reviews.length > 0
                ? fabric.reviews
                : [
                  {
                    name: "Khách ẩn danh",
                    comment: "Vải lên form đẹp, dễ mặc, rất hài lòng.",
                    image:
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
                  },
                ]
              ).map((review, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white/70 p-2.5"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={review.image || FALLBACK_IMAGE}
                      alt={review.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="text-[11px]">
                    <p className="font-semibold text-[#111827]">
                      {review.name}
                    </p>
                    <p className="text-[#4B5563]">{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleVisitClick}
                disabled={hasVisit}
                className={`flex-1 px-4 py-2.5 rounded-full text-[12px] font-semibold transition ${hasVisit
                  ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
                  : "bg-[#1B4332] text-white hover:bg-[#133021]"
                  }`}
              >
                {hasVisit ? "Đã gửi yêu cầu hẹn xem vải" : "Hẹn xem vải tại tiệm"}
              </button>
              <button
                onClick={() => onHold(fabric)}
                disabled={isHeld}
                className={`flex-1 px-4 py-2.5 rounded-full border-2 text-[12px] font-semibold transition ${isHeld
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 cursor-default"
                  : "border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white"
                  }`}
              >
                {isHeld ? "Đã đặt giữ cuộn vải này" : "Đặt giữ cuộn vải này"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedQuickViewFabric}
        type="FABRIC"
        onClose={() => setSelectedQuickViewFabric(null)}
      />
    </div>
  );
}

