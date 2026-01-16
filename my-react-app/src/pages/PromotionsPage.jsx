import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { productService } from "../services/index.js";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";

const PromotionsPage = () => {
  const navigate = useNavigate();

  usePageMeta({
    title: "Ưu đãi may đo áo dài, vest & đầm | My Hiền Tailor",
    description:
      "Cập nhật voucher may đo, combo vest, ưu đãi sinh nhật và flash sale cho khách hàng thân thiết tại My Hiền Tailor.",
  });

  // ====== DATA ƯU ĐÃI THEO DỊP LỄ ======
  const [promotions, setPromotions] = useState([
    {
      id: 1,
      title: "Tết Nguyên Đán – Sale may đo 20%",
      description:
        "Ưu đãi đầu năm cho các mẫu đầm, vest, áo dài đi chúc Tết, họp mặt gia đình. Form may đo riêng, chỉnh sửa tới khi ưng ý.",
      discount: "20%",
      period: "01/01 – 15/02 hằng năm",
      image:
        "https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Đầm, áo dài, vest",
      segment: "Tết & đầu xuân",
      minBill: "Từ 2.500.000₫",
      channel: "Tại tiệm & Online",
      badge: "Tết",
      occasionKey: "tet",
      type: "seasonal",
    },
    {
      id: 2,
      title: "Mùa cưới Thu – Đông: Áo dài & vest giảm 18%",
      description:
        "Đặt từ 2 bộ áo dài cưới hoặc combo áo dài – vest chú rể: giảm 18% tổng hóa đơn, tặng phụ kiện tóc/khăn choàng basic.",
      discount: "18%",
      period: "01/08 – 30/11 hằng năm",
      image:
        "https://images.pexels.com/photos/2567372/pexels-photo-2567372.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Áo dài cưới, vest cưới",
      segment: "Mùa cưới",
      minBill: "Từ 2 bộ trở lên",
      channel: "Tại tiệm",
      badge: "Wedding season",
      occasionKey: "wedding-season",
      type: "bundle",
    },
    {
      id: 3,
      title: "Back to work sau Tết – Gói vest công sở 3 bộ",
      description:
        "Đặt 3 bộ vest công sở trở lên: giảm 25% + miễn phí chỉnh form trong 6 tháng. Rất hợp cho giai đoạn quay lại công việc sau kỳ nghỉ.",
      discount: "25%",
      period: "Sau Tết đến hết 31/03",
      image:
        "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Vest công sở",
      segment: "Đi làm",
      minBill: "Từ 3 bộ trở lên",
      channel: "Tại tiệm",
      badge: "Best deal",
      occasionKey: "back-to-work",
      type: "bundle",
    },
    {
      id: 4,
      title: "8/3 & 20/10 – Ưu đãi dành riêng cho phái đẹp",
      description:
        "Giảm 15% cho tất cả mẫu đầm/váy thiết kế khi đặt may trong tuần lễ 8/3 và 20/10. Tặng kèm gói tư vấn phối đồ miễn phí.",
      discount: "15%",
      period: "Tuần lễ 08/03 & 20/10",
      image:
        "https://images.pexels.com/photos/2078265/pexels-photo-2078265.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Đầm, váy thiết kế",
      segment: "Ngày của nàng",
      minBill: "Không yêu cầu",
      channel: "Tại tiệm & Online",
      badge: "Women’s day",
      occasionKey: "women-day",
      type: "campaign",
    },
    {
      id: 5,
      title: "Noel & Tiệc cuối năm – Đầm dạ hội giảm 18%",
      description:
        "Giảm 18% cho đầm dạ hội từ tháng 11 đến hết tháng 1. Lý tưởng cho mùa tiệc cuối năm, Year End Party, prom, gala.",
      discount: "18%",
      period: "01/11 – 31/01 hằng năm",
      image:
        "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Đầm dạ hội",
      segment: "Lễ hội cuối năm",
      minBill: "Từ 3.000.000₫",
      channel: "Tại tiệm & Online",
      badge: "Seasonal",
      occasionKey: "year-end",
      type: "seasonal",
    },
    {
      id: 6,
      title: "Tháng sinh nhật của bạn – giảm 20% hóa đơn may đo",
      description:
        "Đặt may trong tháng sinh nhật: giảm 20% hóa đơn may đo + tặng voucher 500.000₫ cho đơn tiếp theo trong vòng 3 tháng.",
      discount: "20%",
      period: "Trong tháng sinh nhật (theo CMND/CCCD)",
      image:
        "https://images.pexels.com/photos/196024/pexels-photo-196024.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Tất cả sản phẩm",
      segment: "Sinh nhật khách hàng",
      minBill: "Từ 2.500.000₫",
      channel: "Tại tiệm",
      badge: "Birthday",
      occasionKey: "birthday",
      type: "personal",
    },
  ]);

  // ====== 5 BANNER SỰ KIỆN CHO POPUP (ÍT NHẤT 5 ẢNH) ======
  const [eventBanners, setEventBanners] = useState([
    {
      id: "popup-tet",
      title: "Tết Nguyên Đán 2025",
      subtitle: "Đầm – áo dài – vest gia đình, giảm đến 20%",
      tag: "Tết & đầu xuân",
      image:
        "https://images.pexels.com/photos/6964070/pexels-photo-6964070.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "popup-wedding",
      title: "Mùa cưới Thu – Đông",
      subtitle: "Áo dài cô dâu & vest chú rể, combo siêu lời",
      tag: "Wedding season",
      image:
        "https://images.pexels.com/photos/3014858/pexels-photo-3014858.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "popup-work",
      title: "Back to work sau Tết",
      subtitle: "Gói vest công sở 3 bộ – tiết kiệm 25%",
      tag: "Office look",
      image:
        "https://images.pexels.com/photos/2983463/pexels-photo-2983463.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "popup-year-end",
      title: "Noel & Year End Party",
      subtitle: "Đầm dạ hội lấp lánh, giảm đến 18%",
      tag: "Lễ hội cuối năm",
      image:
        "https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "popup-birthday",
      title: "Tháng sinh nhật của bạn",
      subtitle: "Ưu đãi -20% & quà tặng riêng từ Mỹ Hiền Tailor",
      tag: "Birthday month",
      image:
        "https://images.pexels.com/photos/1204595/pexels-photo-1204595.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ]);

  const filters = [
    { key: "all", label: "Tất cả dịp" },
    { key: "tet", label: "Tết & đầu xuân" },
    { key: "wedding-season", label: "Mùa cưới" },
    { key: "back-to-work", label: "Back to work" },
    { key: "year-end", label: "Noel & cuối năm" },
    { key: "women-day", label: "8/3 & 20/10" },
    { key: "birthday", label: "Sinh nhật" },
  ];

  const [trendCampaigns, setTrendCampaigns] = useState([
    {
      id: "capsule",
      title: "Capsule Wardrobe Combo",
      description:
        "Chọn 4 items cơ bản (vest, quần, chân váy, áo) – mix & match cho 30 outfits tối giản. Giảm 15% + miễn phí chỉnh phom 2 lần.",
      stat: "+320 đơn trong 7 ngày",
      image:
        "https://images.pexels.com/photos/7130498/pexels-photo-7130498.jpeg?auto=compress&cs=tinysrgb&w=1200",
      accent: "#F472B6",
      hashtags: ["#capsulecloset", "#quietluxury", "#worklifebalance"],
      channel: "Book qua TikTok Shop",
    },
    {
      id: "vip-fit",
      title: "Fit Check VIP Reel",
      description:
        "Khách quay reel/FYP với sản phẩm Mỹ Hiền Tailor, được giảm thêm 10% khi đính kèm mã video và book lịch fit thử cá nhân hóa.",
      stat: "2.1M lượt xem",
      image:
        "https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=1200",
      accent: "#38BDF8",
      hashtags: ["#fitcheck", "#OOTD", "#shareyourlook"],
      channel: "TikTok & IG Reels",
    },
    {
      id: "try-before",
      title: "Try Before Party",
      description:
        "Giữ mẫu trong 48h để thử cùng stylist online. Giảm 12% + freeship 2 chiều cho nhóm bạn đặt may đồng loạt.",
      stat: "87% giữ đơn thành công",
      image:
        "https://images.pexels.com/photos/6480702/pexels-photo-6480702.jpeg?auto=compress&cs=tinysrgb&w=1200",
      accent: "#F97316",
      hashtags: ["#sleepoverfit", "#bridesquad", "#trybeforebuy"],
      channel: "Online & showroom",
    },
  ]);

  const [animatedShots, setAnimatedShots] = useState([
    {
      id: "motion-01",
      label: "Live fitting",
      description: "Stylist realtime trên video call",
      image:
        "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "motion-02",
      label: "AI sizing",
      description: "Đo số đo qua app trong 30s",
      image:
        "https://images.pexels.com/photos/3738087/pexels-photo-3738087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "motion-03",
      label: "Flash fitting",
      description: "Nhận đồ sau 72h cho event gấp",
      image:
        "https://images.pexels.com/photos/1771383/pexels-photo-1771383.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ]);

  const fallbackImage =
    "https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg?auto=compress&cs=tinysrgb&w=1200";

  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchDynamicImages = async () => {
      try {
        const response = await productService.list({}, {
          page: 0,
          size: 100,
          sort: "createdAt,desc"
        });
        const data = productService.parseResponse(response);
        const items = data?.content || data?.data || (Array.isArray(data) ? data : []);

        if (items.length > 0) {
          // Helper to find matching images
          const findImages = (keywords, count = 1) => {
            return items.filter(i =>
              keywords.some(k =>
                (i.name && i.name.toLowerCase().includes(k)) ||
                (i.category && i.category.toLowerCase().includes(k)) ||
                (i.occasion && i.occasion.toLowerCase().includes(k)) ||
                (i.tag && i.tag.toLowerCase().includes(k))
              )
            ).slice(0, count);
          };

          const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
          const getValidImage = (img) => img?.image || img?.url || img?.thumbnailUrl;

          // 1. Update Promotions
          setPromotions(prev => prev.map(p => {
            let keywords = [];
            if (p.occasionKey === 'tet') keywords = ['tet', 'ao_dai', 'áo dài'];
            else if (p.occasionKey === 'wedding-season') keywords = ['wedding', 'cuoi', 'vest'];
            else if (p.occasionKey === 'back-to-work') keywords = ['work', 'office', 'vest', 'công sở'];
            else if (p.occasionKey === 'women-day') keywords = ['daily', 'party', 'dress', 'đầm'];
            else if (p.occasionKey === 'year-end') keywords = ['party', 'da_hoi', 'dạ hội'];
            else if (p.occasionKey === 'birthday') keywords = ['party', 'casual', 'vest'];

            const matches = findImages(keywords, 5);
            const match = getRandom(matches) || getRandom(items);
            return match ? { ...p, image: getValidImage(match) || p.image } : p;
          }));

          // 2. Update Event Banners
          setEventBanners(prev => prev.map(p => {
            let keywords = [];
            if (p.tag.includes('Tết')) keywords = ['tet', 'ao_dai'];
            else if (p.tag.includes('Wedding')) keywords = ['wedding', 'cuoi'];
            else if (p.tag.includes('Office')) keywords = ['work', 'office'];
            else if (p.tag.includes('Lễ hội')) keywords = ['party', 'da_hoi'];
            else keywords = ['daily', 'casual'];

            const matches = findImages(keywords, 5);
            const match = getRandom(matches) || getRandom(items);
            return match ? { ...p, image: getValidImage(match) || p.image } : p;
          }));

          // 3. Update Trend Campaigns
          setTrendCampaigns(prev => prev.map(p => {
            const match = getRandom(items);
            return match ? { ...p, image: getValidImage(match) || p.image } : p;
          }));

          // 4. Update Animated Shots
          setAnimatedShots(prev => prev.map(p => {
            const match = getRandom(items);
            return match ? { ...p, image: getValidImage(match) || p.image } : p;
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dynamic images:", error);
      }
    };
    fetchDynamicImages();
  }, []);

  // popup state
  const [showPopup, setShowPopup] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [activeTrendIndex, setActiveTrendIndex] = useState(0);

  const featuredPromo = promotions[2];

  const filteredPromos = useMemo(() => {
    if (activeFilter === "all") return promotions;
    return promotions.filter((p) => p.occasionKey === activeFilter);
  }, [activeFilter]);

  // Auto-slide banner
  useEffect(() => {
    if (!showPopup) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % eventBanners.length);
    }, 4000); // Tăng thời gian lên 4s để khách kịp đọc
    return () => clearInterval(interval);
  }, [showPopup, eventBanners.length]);

  useEffect(() => {
    const trendInterval = setInterval(() => {
      setActiveTrendIndex((prev) => (prev + 1) % trendCampaigns.length);
    }, 5000);
    return () => clearInterval(trendInterval);
  }, [trendCampaigns.length]);

  const handleOrderClick = (promotion) => {
    navigate("/customer/order", { state: { promotion } });
  };

  const scrollToPromotions = () => {
    const section = document.getElementById("promotions-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentBanner = eventBanners[activeBannerIndex];
  const currentTrend = trendCampaigns[activeTrendIndex];

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImage;
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/promotions" />

      {/* ====== POPUP REDESIGNED: LỚN HƠN & SANG TRỌNG HƠN ====== */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300">
          <div
            className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          // max-w-6xl giúp popup rộng hơn nhiều
          // max-h-[90vh] đảm bảo không bị tràn màn hình
          >
            {/* Nút Close nằm góc ngoài hoặc trong tùy ý, ở đây để absolute góc phải */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white md:text-[#1F2933] md:bg-[#F3F4F6] flex items-center justify-center hover:bg-[#1F2933] hover:text-white transition-all shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Cột 1: Hình ảnh lớn (Chiếm 60% trên Desktop) */}
            <div className="relative h-64 md:h-auto md:w-[60%] bg-gray-200 overflow-hidden group">
              <img
                key={currentBanner.image} // Key change force re-render animation
                src={currentBanner.image}
                alt={currentBanner.title}
                className="w-full h-full object-cover transition-transform duration-[4000ms] ease-linear scale-100 group-hover:scale-105"
                onError={handleImageError}
              // Hiệu ứng zoom nhẹ khi hover
              />
              {/* Overlay gradient để text trên ảnh (nếu có) dễ đọc, hoặc tạo chiều sâu */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />

              {/* Tag nổi trên hình */}
              <div className="absolute top-6 left-6">
                <span className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm text-[12px] font-bold tracking-widest uppercase text-[#B45309]">
                  {currentBanner.tag}
                </span>
              </div>
            </div>

            {/* Cột 2: Nội dung (Chiếm 40%) */}
            <div className="flex-1 flex flex-col p-6 md:p-10 lg:p-12 justify-center bg-white relative">

              {/* Progress Bar nhỏ thể hiện slide đang chạy */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
                <div
                  key={activeBannerIndex}
                  className="h-full bg-[#B45309] animate-progress-bar"
                ></div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[13px] text-[#9CA3AF] uppercase tracking-[0.2em] mb-3 font-medium">
                    Sự kiện nổi bật
                  </p>
                  <h2
                    key={currentBanner.title}
                    className="heading-font text-[32px] md:text-[40px] leading-[1.1] text-[#111827] animate-fade-in-up"
                  >
                    {currentBanner.title}
                  </h2>
                  <p
                    key={currentBanner.subtitle}
                    className="text-[16px] text-[#4B5563] mt-3 leading-relaxed animate-fade-in-up delay-75"
                  >
                    {currentBanner.subtitle}. <br className="hidden md:block" />
                    Chương trình áp dụng tự động tại Mỹ Hiền Tailor.
                  </p>
                </div>

                {/* Thumbnails điều hướng */}
                <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-hide">
                  {eventBanners.map((banner, idx) => (
                    <button
                      key={banner.id}
                      onClick={() => setActiveBannerIndex(idx)}
                      className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === activeBannerIndex
                        ? "border-[#B45309] ring-2 ring-[#B45309]/20"
                        : "border-transparent opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
                        }`}
                    >
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      scrollToPromotions();
                    }}
                    className="w-full py-4 rounded-full bg-[#1B4332] text-white text-[15px] font-semibold hover:bg-[#14532d] hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <span>Xem chi tiết ưu đãi</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full py-3 rounded-full text-[14px] text-[#6B7280] hover:text-[#111827] hover:underline transition-all"
                  >
                    Đóng cửa sổ này
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MAIN ====== */}
      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-10">
          {/* HERO: ƯU ĐÃI THEO DỊP LỄ */}
          <section className="promo-hero grid lg:grid-cols-[1.2fr_minmax(0,1fr)] gap-10 items-center rounded-[32px] p-6 md:p-10 border border-[#FCD34D]/60">
            <div className="space-y-5 relative z-[2]">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-[11px] tracking-[0.3em] uppercase text-[#B45309] bg-white/70 px-3 py-1 rounded-full border border-[#FCD34D]/60">
                  Ưu đãi theo mùa & dịp lễ
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  Đã cập nhật tuần này
                </div>
              </div>
              <h1 className="heading-font text-[30px] md:text-[36px] text-[#111827] leading-tight">
                Ưu đãi may đo áo dài, vest, đầm tại My Hiền Tailor
                <span className="block text-[#B45309]">
                  tự động áp dụng theo mùa & dịp lễ
                </span>
              </h1>
              <p className="text-[14px] text-[#4B5563] max-w-2xl leading-relaxed">
                Mỹ Hiền Tailor thiết kế gói ưu đãi theo từng mùa lễ hội, sự kiện và
                milestone quan trọng của khách hàng. Hệ thống sẽ tự động trừ
                ưu đãi khi đơn hàng khớp điều kiện, không cần nhập mã hay chờ
                xác nhận thủ công.
              </p>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Tỷ lệ hài lòng",
                    value: "4.9/5",
                    note: "Đánh giá sau 7 ngày nhận đồ",
                  },
                  {
                    label: "Thời gian may đo",
                    value: "48-72h",
                    note: "Tùy độ phức tạp mẫu",
                  },
                  {
                    label: "Hình thức nhận ưu đãi",
                    value: "Auto apply",
                    note: "Không cần mã, không gom đơn",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(251,191,36,0.15)]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">
                      {stat.label}
                    </p>
                    <p className="text-[20px] font-semibold text-[#111827]">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">{stat.note}</p>
                  </div>
                ))}
              </div>

              <div className="promo-hero__spotlight">
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280]">
                    Ưu đãi spotlight tuần này
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <h2 className="text-[20px] font-semibold text-[#111827]">
                      {featuredPromo.title}
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-[#1F2937] text-white text-[12px]">
                      -{featuredPromo.discount}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#F97316]/10 text-[#B45309] text-[11px] border border-[#FDBA74]">
                      {featuredPromo.segment}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#4B5563]">
                    {featuredPromo.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-[12px] text-[#6B7280]">
                    <span className="inline-flex items-center gap-1">
                      📅 {featuredPromo.period}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#059669] font-medium">
                      ⚡ Không cần nhập mã
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <button
                    onClick={() => handleOrderClick(featuredPromo)}
                    className="px-4 py-3 rounded-2xl bg-[#1B4332] text-white text-[13px] font-semibold hover:bg-[#14532d] transition-colors"
                  >
                    Đặt may trong dịp này
                  </button>
                  <button
                    onClick={scrollToPromotions}
                    className="px-4 py-3 rounded-2xl border border-[#D1D5DB] text-[13px] text-[#1F2937] hover:border-[#111827] transition-colors"
                  >
                    Xem toàn bộ ưu đãi
                  </button>
                </div>
              </div>
            </div>

            <div className="relative h-full min-h-[280px] promo-hero__visual rounded-[28px] overflow-hidden">
              <img
                src={featuredPromo.image}
                alt={featuredPromo.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute top-6 left-6 bg-white/90 rounded-2xl px-4 py-3 text-[12px] shadow-lg max-w-[220px]">
                <p className="uppercase tracking-[0.16em] text-[#6B7280]">
                  {featuredPromo.segment}
                </p>
                <p className="text-[18px] font-semibold text-[#111827]">
                  Giảm {featuredPromo.discount}
                </p>
                <p className="text-[11px] text-[#6B7280]">Auto áp dụng tại quầy</p>
              </div>
              <div className="promo-hero__badge">
                <p>Khách quay lại</p>
                <strong>68%</strong>
                <span>/ tháng</span>
              </div>
            </div>
          </section>

          {/* TRENDING PROGRAMS */}
          <section className="grid lg:grid-cols-[1.1fr_minmax(0,0.9fr)] gap-6 items-stretch">
            <div className="relative bg-[#111827] text-white rounded-3xl overflow-hidden p-6 md:p-10 shadow-[0_20px_60px_rgba(17,24,39,0.45)]">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#fef3c7,_transparent_45%)]" />
              <div className="relative space-y-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#FCD34D]/80">
                  Live trendboard
                </p>
                <h2 className="heading-font text-[28px] md:text-[34px] leading-tight">
                  Chương trình ưu đãi theo xu hướng 2025
                </h2>
                <p className="text-[14px] text-[#E5E7EB]/80 max-w-xl">
                  {currentTrend.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentTrend.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[12px] bg-white/10 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur">
                    <p className="text-[11px] uppercase text-[#9CA3AF]">
                      Số liệu thời gian thực
                    </p>
                    <p className="text-[20px] font-semibold mt-1">
                      {currentTrend.stat}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur">
                    <p className="text-[11px] uppercase text-[#9CA3AF]">
                      Kênh đặt chỗ
                    </p>
                    <p className="text-[15px] font-semibold mt-1">
                      {currentTrend.channel}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    onClick={() => handleOrderClick(featuredPromo)}
                    className="flex-1 py-3 rounded-2xl bg-white text-[#111827] font-semibold text-[14px] hover:bg-[#FCD34D] transition-colors"
                  >
                    Book trend này
                  </button>
                  <button
                    onClick={() => scrollToPromotions()}
                    className="flex-1 py-3 rounded-2xl border border-white/30 text-[13px] hover:border-white transition-colors"
                  >
                    Xem toàn bộ ưu đãi
                  </button>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 text-right text-[12px] text-white/70">
                Auto update mỗi 5s
              </div>
            </div>

            <div className="space-y-4">
              {trendCampaigns.map((trend, idx) => (
                <button
                  key={trend.id}
                  onClick={() => setActiveTrendIndex(idx)}
                  className={`w-full rounded-3xl overflow-hidden border relative text-left transition-all promo-trend-card ${idx === activeTrendIndex
                    ? "promo-trend-card--active"
                    : "promo-trend-card--muted"
                    }`}
                >
                  <div className="grid grid-cols-[1.2fr_minmax(0,0.8fr)] gap-4 p-4 md:p-5 items-center">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.2em] text-[#6B7280]">
                        Xu hướng
                      </p>
                      <h3 className="text-[17px] font-semibold text-[#111827]">
                        {trend.title}
                      </h3>
                      <p className="text-[13px] text-[#6B7280] line-clamp-2">
                        {trend.description}
                      </p>
                      <span
                        className="inline-flex items-center gap-2 text-[12px] font-semibold mt-2"
                        style={{ color: trend.accent }}
                      >
                        ⏺ {trend.stat}
                      </span>
                    </div>
                    <div className="relative h-28 rounded-2xl overflow-hidden promo-card-motion">
                      <img
                        src={trend.image}
                        alt={trend.title}
                        className="w-full h-full object-cover promo-card-motion__img"
                        onError={handleImageError}
                      />
                      <span className="absolute bottom-2 right-2 text-[11px] text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur">
                        {trend.channel}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* MOTION SHOTS */}
          <section className="bg-white/70 rounded-3xl p-4 md:p-6 border border-[#E5E7EB] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF]">
                  Motion gallery
                </p>
                <h3 className="text-[20px] font-semibold text-[#111827]">
                  Hình ảnh động mô tả trải nghiệm ưu đãi
                </h3>
                <p className="text-[13px] text-[#4B5563]">
                  Zoom-pan & floating animation giúp khách cảm được vibe dịch vụ.
                </p>
              </div>
              <div className="promo-marquee">
                <div className="promo-marquee__inner">
                  {trendCampaigns
                    .map((trend) => trend.hashtags)
                    .flat()
                    .map((tag) => (
                      <span key={`${tag}-marquee`}>{tag}</span>
                    ))}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {animatedShots.map((shot, idx) => (
                <div
                  key={shot.id}
                  className={`promo-shot ${idx === 1 ? "promo-shot--delay" : ""}`}
                >
                  <div className="promo-shot__media">
                    <img
                      src={shot.image}
                      alt={shot.label}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="promo-shot__info">
                    <p className="promo-shot__label">{shot.label}</p>
                    <p className="promo-shot__desc">{shot.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FILTER BAR */}
          <section className="bg-white rounded-2xl px-4 py-3 md:px-6 md:py-4 border border-[#E5E7EB] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#6B7280]">
                Lọc ưu đãi theo dịp
              </p>
              <p className="text-[12px] text-[#4B5563] mt-1">
                Chọn dịp bạn quan tâm: Tết, mùa cưới, Noel, 8/3 & 20/10, Back to
                work hoặc ưu đãi sinh nhật khách hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] border transition-colors ${activeFilter === f.key
                    ? "bg-[#111827] text-white border-[#111827]"
                    : "bg-white text-[#374151] border-[#D1D5DB] hover:border-[#111827]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* PROMOTION CARDS */}
          <section id="promotions-list">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {filteredPromos.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-[#E5E7EB] flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-[400px] w-full overflow-hidden bg-gray-200">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover object-top"
                      onError={handleImageError}
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                      <div className="bg-[#F2A500] text-white text-[14px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                        -{promo.discount}
                      </div>
                      <span className="px-2 py-1 rounded-full bg-black/60 text-[10px] uppercase tracking-[0.16em] text-white">
                        {promo.badge}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="inline-block text-[10px] uppercase tracking-[0.18em] text-[#6B7280] mb-2">
                      {promo.category} • {promo.segment}
                    </span>
                    <h3 className="heading-font text-[18px] text-[#111827] mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-[13px] text-[#6B7280] flex-1 mb-4">
                      {promo.description}
                    </p>

                    {/* Meta info */}
                    <div className="space-y-2 mb-4 text-[12px] text-[#4B5563]">
                      <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                        <div>
                          <p className="text-[11px] text-[#6B7280]">
                            Thời gian áp dụng
                          </p>
                          <p className="text-[13px] font-medium text-[#111827]">
                            {promo.period}
                          </p>
                        </div>
                        <span className="text-[11px] text-[#9CA3AF]">
                          {promo.channel}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        <span className="font-medium">Điều kiện:</span>{" "}
                        {promo.minBill}
                      </div>
                      <div className="text-[11px] text-[#16a34a]">
                        <strong>Không cần nhập mã.</strong> Ưu đãi sẽ được trừ
                        trực tiếp trên hóa đơn trong thời gian khuyến mãi.
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleOrderClick(promo)}
                      className="w-full px-4 py-2.5 text-[13px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
                    >
                      <span>🗓️</span>
                      <span>Đặt may trong dịp này</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TERMS & CONDITIONS */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E7EB]">
            <h2 className="heading-font text-[20px] text-[#111827] mb-4">
              Điều kiện & lưu ý chung
            </h2>
            <ul className="space-y-2 text-[13px] text-[#4B5563]">
              <li className="flex items-start gap-2">
                <span className="text-[#1B4332] mt-1">•</span>
                <span>
                  Ưu đãi được{" "}
                  <strong>áp dụng tự động, không cần nhập mã</strong> trong
                  khoảng thời gian khuyến mãi ghi trên từng chương trình.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1B4332] mt-1">•</span>
                <span>
                  Mỗi đơn hàng chỉ áp dụng tối đa một chương trình khuyến mãi
                  theo dịp lễ. Một số ưu đãi có thể cộng dồn với quyền lợi hội
                  viên, tùy theo thông báo tại thời điểm đặt may.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1B4332] mt-1">•</span>
                <span>
                  Một số chương trình yêu cầu hóa đơn tối thiểu hoặc số lượng
                  bộ đồ nhất định – vui lòng trao đổi với nhân viên tư vấn
                  trước khi chốt đơn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1B4332] mt-1">•</span>
                <span>
                  Thời gian và mức giảm có thể thay đổi tùy mùa, tùy chi nhánh.
                  Để chắc chắn, hãy hỏi lại nhân viên trước khi thanh toán.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1B4332] mt-1">•</span>
                <span>
                  Mỹ Hiền Tailor có quyền tạm dừng hoặc kết thúc chương trình
                  khuyến mãi sớm hơn dự kiến khi đạt đủ số lượng đơn hàng.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* FOOTER */}
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
            <span>© 2025 Mỹ Hiền Tailor</span>
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

export default PromotionsPage;