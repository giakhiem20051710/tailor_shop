import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { imageAssetService } from "../services/index.js";

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStyle, setActiveStyle] = useState("wedding");
  const heroRef = useRef(null);

  usePageMeta({
    title: "My Hiền Tailor TP.HCM | May đo áo dài, vest, đầm & kho vải",
    description:
      "My Hiền Tailor đồng hành cùng bạn trong hành trình may đo áo dài, vest và đầm dạ hội. Đặt lịch tư vấn, xem bộ sưu tập và kho vải chọn lọc ngay tại TP.HCM.",
    ogImage:
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop&q=80",
  });

  const [heroImages, setHeroImages] = useState([
    "https://watermark.lovepik.com/photo/20211124/large/lovepik-fashion-womens-summer-shopping-image-picture_500961857.jpg"
  ]);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const response = await imageAssetService.filter({
          category: "template",
          page: 0,
          size: 6, // Fetch 6 images as requested
          sort: "createdDate,desc"
        });
        const data = imageAssetService.parseResponse(response);
        const items = data?.content || data?.data || (Array.isArray(data) ? data : []);

        if (items.length > 0) {
          const fetchedUrls = items
            .map(item => item.url || item.thumbnailUrl)
            .filter(url => url); // Ensure no nulls

          // Keep the first static image (Lovepik one) and append fetched images
          setHeroImages(prev => {
            const firstImage = "https://watermark.lovepik.com/photo/20211124/large/lovepik-fashion-womens-summer-shopping-image-picture_500961857.jpg";
            // Avoid duplicates if this runs multiple times or hot reloads
            const newImages = [firstImage, ...fetchedUrls];
            return newImages;
          });
        }
      } catch (error) {
        console.error("Failed to fetch hero images:", error);
      }
    };
    fetchHeroImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);


  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    const hero = heroRef.current;
    if (hero) {
      hero.addEventListener("mousemove", handleMouseMove);
      return () => hero.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  const [collections, setCollections] = useState([
    {
      key: "wedding",
      name: "Wedding Collection",
      description: "Áo dài & vest cưới tối giản, dễ chụp hình, dễ di chuyển.",
      image:
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80",
      price: "Từ 2.500.000 ₫",
      tag: "Cưới hỏi",
    },
    {
      key: "office",
      name: "Office Edit",
      description: "Vest công sở & sơ mi may đo cho người đi làm mỗi ngày.",
      image:
        "https://images.unsplash.com/photo-1594938291221-94f18cbb566b?w=900&auto=format&fit=crop&q=80",
      price: "Từ 1.800.000 ₫",
      tag: "Công sở",
    },
    {
      key: "evening",
      name: "Evening Line",
      description: "Đầm dạ hội, váy tiệc nhẹ nhàng nhưng vẫn nổi bật.",
      image:
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=80",
      price: "Từ 3.200.000 ₫",
      tag: "Dạ hội",
    },
    {
      key: "daily",
      name: "Everyday Fit",
      description: "Quần, váy, áo may đo mặc hằng ngày – ít nhăn, dễ phối.",
      image:
        "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
      price: "Từ 800.000 ₫",
      tag: "Hằng ngày",
    },
  ]);

  const activeCollection =
    collections.find((c) => c.key === activeStyle) || collections[0];

  const processSteps = [
    {
      step: "01",
      title: "Tư vấn",
      desc: "Bạn cho biết dịp, phong cách mong muốn, ngân sách. Chúng tôi gợi ý mẫu & chất liệu phù hợp.",
      icon: "💬",
    },
    {
      step: "02",
      title: "Đo & chọn vải",
      desc: "Đo số đo chi tiết, thử vài phom dáng, chọn vải và màu sắc bạn thấy tự tin nhất.",
      icon: "📏",
    },
    {
      step: "03",
      title: "May & thử",
      desc: "Tiến hành may, hẹn lịch thử đồ. Nếu cần chỉnh, chúng tôi chỉnh đến khi bạn hài lòng.",
      icon: "✨",
    },
    {
      step: "04",
      title: "Hoàn thiện",
      desc: "Là ủi, đóng gói và bàn giao. Có thể nhận tại tiệm hoặc giao tận nơi.",
      icon: "🎁",
    },
  ];


  const testimonials = [
    {
      quote:
        "Áo dài cưới vừa vặn, lên hình rất đẹp. Lần đầu đặt may mà cảm giác yên tâm từ lúc tư vấn đến lúc nhận đồ.",
      name: "Lan Anh",
      role: "Khách hàng áo dài cưới",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      rating: 5,
    },
    {
      quote:
        "Vest công sở may đo, mặc cả ngày vẫn thoải mái. Sau đó mình đặt thêm 2 bộ nữa vì quá ưng.",
      name: "Minh Tuấn",
      role: "Khách hàng vest công sở",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      rating: 5,
    },
    {
      quote:
        "Đầm dạ hội đúng form mình muốn, đứng trên sân khấu tự tin hẳn. Lần sau có dịp sẽ quay lại.",
      name: "Hương",
      role: "Khách hàng đầm dạ hội",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
      rating: 5,
    },
  ];

  const [newArrivals, setNewArrivals] = useState([
    {
      name: "Áo dài lụa tông kem",
      desc: "Form suông nhẹ, tay lửng, hợp chụp ảnh cưới & lễ hỏi.",
      price: "2.750.000 ₫",
      tag: "Áo dài",
      image:
        "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
    },
    {
      name: "Vest nâu café slim-fit",
      desc: "Vest 2 khuy, màu nâu trầm, hợp anh gầy hoặc trung bình.",
      price: "3.150.000 ₫",
      tag: "Vest công sở",
      image:
        "https://images.unsplash.com/photo-1594938291221-94f18cbb566b?w=900&auto=format&fit=crop&q=80",
    },
    {
      name: "Đầm satin cổ vuông",
      desc: "Dáng midi, tôn vai & cổ, hợp đi tiệc hoặc dạ hội nhẹ.",
      price: "2.280.000 ₫",
      tag: "Đầm tiệc",
      image:
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=80",
    },
  ]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        // Fetch enough items to find suitable ones for each category
        const response = await imageAssetService.filter({
          category: "template",
          page: 0,
          size: 50, // Increase size to find matches
          sort: "createdDate,desc"
        });
        const data = imageAssetService.parseResponse(response);
        const items = data?.content || data?.data || (Array.isArray(data) ? data : []);

        if (items.length > 0) {
          setCollections(prevCollections => {
            return prevCollections.map(col => {
              let match = null;
              if (col.key === 'wedding') {
                match = items.find(i => (i.occasion === 'wedding' || i.type?.includes('cuoi') || i.type?.includes('ao_dai')));
              } else if (col.key === 'office') {
                match = items.find(i => (i.occasion === 'work' || i.occasion === 'office' || i.type === 'vest' || i.type === 'blazer' || i.type === 'ao_so_mi'));
              } else if (col.key === 'evening') {
                match = items.find(i => (i.occasion === 'party' || i.type?.includes('da_hoi') || i.type?.includes('dam')));
              } else if (col.key === 'daily') {
                match = items.find(i => (i.occasion === 'daily' || i.occasion === 'casual' || !i.occasion));
              }

              // Fallback to any item if no specific match, but try to avoid duplicates if possible (simple version for now)
              if (!match) match = items.find(i => i.url || i.thumbnailUrl);

              if (match && (match.url || match.thumbnailUrl)) {
                return {
                  ...col,
                  image: match.url || match.thumbnailUrl
                };
              }
              return col;
            });
          });
        }

        // Also map new arrivals from the same fetched batch to save a call, 
        // OR keep the separate efficient call for new arrivals. 
        // We already have a separate effect for new arrivals, so we'll keep that or merge them.
        // For simplicity and separation of concerns, I will keep them separate or just let them run.
        // Actually, the previous effect fetches 3 items. This one fetches 50. 
        // We could optimize, but for now let's just add this effect.
      } catch (error) {
        console.error("Failed to fetch collection images:", error);
      }
    };
    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await imageAssetService.filter({
          category: "template",
          page: 0,
          size: 3,
          sort: "createdDate,desc"
        });
        const data = imageAssetService.parseResponse(response);
        const items = data?.content || data?.data || (Array.isArray(data) ? data : []);

        if (items.length > 0) {
          const mappedItems = items.map(item => ({
            name: item.type ? item.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Sản phẩm mới",
            desc: item.description || "Thiết kế mới nhất từ Mỹ Hiền Tailor",
            price: "Liên hệ",
            tag: "New Arrival",
            image: item.url || item.thumbnailUrl
          }));
          setNewArrivals(mappedItems);
        }
      } catch (error) {
        console.error("Failed to fetch new arrivals:", error);
      }
    };
    fetchNewArrivals();
  }, []);

  const trustBadges = [
    {
      title: "Bảo hành form 90 ngày",
      desc: "Chỉnh sửa miễn phí nếu bạn chưa thấy thật sự vừa vặn.",
    },
    {
      title: "Tư vấn 1:1 miễn phí",
      desc: "Stylist đồng hành từ lúc chọn mẫu tới khi nhận đồ.",
    },
    {
      title: "Minh bạch chi phí",
      desc: "Bảng giá rõ ràng, báo trước mọi chi tiết phát sinh.",
    },
  ];

  const fittingTips = [
    {
      title: "Dáng người nhỏ / gầy",
      body: "Ưu tiên phom vừa người, vai không rơi, tay áo gọn. Tránh đồ quá rộng dễ bị “nuốt dáng”.",
    },
    {
      title: "Dáng người đầy đặn",
      body: "Chọn chất liệu rủ nhẹ, ít nhăn, ưu tiên cổ chữ V hoặc cổ vuông để phần trên thanh thoát hơn.",
    },
    {
      title: "Đi làm hằng ngày",
      body: "Nên chọn vải ít nhăn, màu trung tính (đen, nâu, xám, navy) để dễ phối với đồ sẵn có.",
    },
  ];

  const faqs = [
    {
      q: "Mất bao lâu để hoàn thành một bộ đồ may đo?",
      a: "Thời gian trung bình 5–10 ngày làm việc tuỳ mẫu. Với các dịp gấp, My Hiền sẽ ưu tiên lịch và báo rõ thời gian ngay từ lúc tư vấn.",
    },
    {
      q: "Nếu nhận đồ chưa vừa ý thì sao?",
      a: "Bạn được chỉnh sửa form miễn phí trong 90 ngày. Chúng tôi ưu tiên sự thoải mái và tự tin của bạn hơn bất cứ điều gì khác.",
    },
    {
      q: "Tôi chưa rõ mình hợp kiểu đồ nào, có cần chuẩn bị gì không?",
      a: "Bạn chỉ cần cho biết dịp, phong cách mong muốn và ngân sách. Stylist sẽ gợi ý vài phương án và cho bạn thử phom trực tiếp.",
    },
  ];

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEA] text-[#111827] body-font antialiased overflow-x-hidden">
      {/* HEADER */}
      <Header currentPage="/customer-home" />


      {/* HERO */}
      <section
        id="top"
        ref={heroRef}
        className="relative min-h-[520px] md:min-h-[600px] flex items-center pt-[170px] md:pt-[190px] pb-16 md:pb-20 overflow-hidden bg-gradient-to-br from-[#FFFBEA] via-[#FFF3C4] to-[#FFFBF5]"
      >
        {/* Light background blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-56 h-56 md:w-80 md:h-80 bg-[#FACC15]/22 rounded-full blur-3xl transition-all duration-500"
            style={{
              left: `${mousePosition.x * 0.08}px`,
              top: `${mousePosition.y * 0.08}px`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left text */}
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center text-[10px] tracking-[0.25em] uppercase text-[#854D0E] font-semibold bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-[#FACC15]/40">
                My Hiền • Fashion Design Studio
              </span>

              <h1 className="heading-font text-[28px] leading-snug md:text-[34px] lg:text-[38px] text-[#111827]">
                My Hiền Tailor – May đo áo dài, vest, đầm
                <br />
                <span className="text-[#854D0E]">
                  chuẩn dáng người Việt & thoải mái mỗi ngày
                </span>
              </h1>

              <p className="text-[13px] md:text-[14px] text-[#4B5563] leading-relaxed max-w-md">
                Không chỉ là “đồ đẹp để chụp hình”, My Hiền ưu tiên cảm giác
                thoải mái khi mặc – từ lúc di chuyển, ngồi làm việc, đến lúc
                cười nói với bạn bè.
              </p>

              {/* Small trust line */}
              <p className="text-[11px] text-[#4B5563]">
                Hơn{" "}
                <span className="font-semibold text-[#B45309]">3.000+</span>{" "}
                bộ đồ đã hoàn thiện,{" "}
                <span className="font-semibold text-[#B45309]">1.500+</span>{" "}
                khách hàng quay lại & giới thiệu thêm bạn bè.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="px-5 py-2.5 text-[13px] bg-[#B45309] text-white rounded-full hover:bg-[#92400E] transition-colors shadow-md flex items-center gap-2"
                  onClick={() => navigate("/customer/order")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Đặt may mẫu
                </button>
                <button
                  className="px-5 py-2.5 text-[13px] border border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-colors bg-white/70 flex items-center gap-2"
                  onClick={() => navigate("/fabrics")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Mua vải
                </button>
                <button
                  className="px-5 py-2.5 text-[13px] border border-[#B45309] text-[#B45309] rounded-full hover:bg-[#B45309] hover:text-white transition-colors bg-white/70"
                  onClick={() => handleScrollTo("process")}
                >
                  Tìm hiểu quy trình
                </button>
              </div>
            </div>

            {/* Right: main hero image */}
            <div className="lg:col-span-7">
              <div className="relative h-[260px] sm:h-[320px] md:h-[360px] lg:h-[400px] rounded-[32px] overflow-hidden shadow-xl bg-gray-200">
                {heroImages.map((img, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${index === currentImageIndex
                      ? "opacity-100"
                      : "opacity-0"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Hero ${index + 1}`}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/5" />

                {/* Small info card */}
                <div className="absolute bottom-4 left-4 bg-white/92 backdrop-blur px-4 py-3 rounded-2xl shadow-md text-[11px] md:text-[12px] max-w-[260px]">
                  <div className="heading-font text-[13px] text-[#111827]">
                    Áo dài & Vest may đo
                  </div>
                  <div className="text-[#6B7280]">
                    Form gọn gàng, dễ di chuyển, không “gồng mình” để đẹp.
                  </div>
                </div>

                {/* Counter */}
                <div className="absolute bottom-4 right-4 bg-black/45 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1">
                  <span>
                    {String(currentImageIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="text-gray-300">/</span>
                  <span>
                    {String(heroImages.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES – CAM KẾT TỪ MY HIỀN */}
      <section className="bg-white border-y border-[#FDEFC2] py-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
                Vì sao khách tin My Hiền
              </p>
              <h2 className="heading-font text-[18px] md:text-[20px] text-[#111827]">
                3 cam kết để bạn yên tâm trước khi quyết định may đo
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-[12px] md:text-[13px]">
            {trustBadges.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-[#FFFBF2] rounded-2xl px-4 py-4 shadow-sm border border-[#FDEFC2]"
              >
                <div className="mt-1 w-7 h-7 rounded-full bg-[#B45309]/10 flex items-center justify-center text-[13px]">
                  {index === 0 && "✓"}
                  {index === 1 && "👩‍🎨"}
                  {index === 2 && "₫"}
                </div>
                <div>
                  <h3 className="heading-font text-[13px] md:text-[14px] text-[#111827] mb-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[11px] md:text-[12px] text-[#6B7280]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI & AR FEATURES – TÍNH NĂNG THÔNG MINH */}
      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-16 border-y border-purple-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">
              <span>✨</span>
              <span>Trải nghiệm công nghệ</span>
            </span>
            <h2 className="heading-font text-[24px] md:text-[28px] text-[#111827] mb-3">
              Khám phá với AI & AR
            </h2>
            <p className="text-[13px] md:text-[14px] text-[#6B7280] max-w-2xl mx-auto">
              Sử dụng công nghệ AI và AR để tìm phong cách phù hợp và xem trước sản phẩm trên người bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Style Suggestions */}
            <button
              onClick={() => navigate("/ai-style-suggestions")}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="heading-font text-[15px] text-[#111827] mb-2">
                AI Gợi ý Phong cách
              </h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Cho AI biết về bạn và dịp sử dụng, nhận gợi ý thiết kế phù hợp nhất
              </p>
              <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Thử ngay <span>→</span>
              </span>
            </button>

            {/* 3D Preview */}
            <button
              onClick={() => navigate("/3d-preview")}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="heading-font text-[15px] text-[#111827] mb-2">
                Xem trước 3D
              </h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Xoay 360° sản phẩm, thay đổi màu sắc và chất liệu trực tiếp trên màn hình
              </p>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Khám phá <span>→</span>
              </span>
            </button>

            {/* Virtual Try-On */}
            <button
              onClick={() => navigate("/virtual-tryon")}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-green-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="heading-font text-[15px] text-[#111827] mb-2">
                Thử áo ảo AR
              </h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Sử dụng camera để thử sản phẩm trực tiếp trên người bạn bằng công nghệ AR
              </p>
              <span className="text-[11px] text-green-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Bắt đầu <span>→</span>
              </span>
            </button>

            {/* Trend Analysis */}
            <button
              onClick={() => navigate("/trend-analysis")}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="heading-font text-[15px] text-[#111827] mb-2">
                Phân tích Xu hướng
              </h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Khám phá những xu hướng thời trang đang thịnh hành dựa trên dữ liệu thực tế
              </p>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Xem ngay <span>→</span>
              </span>
            </button>
          </div>

          {/* Quick access banner */}
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white text-center">
            <p className="text-[13px] md:text-[14px] mb-3">
              💬 <strong>Chat với AI Assistant</strong> để được tư vấn ngay lập tức về size, giá cả, và phong cách phù hợp
            </p>
            <button
              onClick={() => {
                // Trigger chat widget if available
                const chatButton = document.querySelector('[aria-label="Mở chat"]');
                if (chatButton) {
                  chatButton.click();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-white text-purple-600 rounded-full text-[12px] font-semibold hover:bg-purple-50 transition"
            >
              <span>💬</span>
              <span>Mở Chat AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS – HÀNG MỚI VỀ */}
      <section
        id="new-arrivals"
        className="bg-[#FFFDF5] border-y border-[#FDEFC2] py-12"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
                New Arrival
              </p>
              <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
                Một vài mẫu mới vừa lên kệ
              </h2>
            </div>
            <p className="text-[12px] md:text-[13px] text-[#6B7280] max-w-md">
              Hàng mới sẽ thay đổi theo mùa & theo dịp. Bạn có thể dùng làm
              gợi ý khi trao đổi với thợ may.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-[13px]">
            {newArrivals.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col border border-[#FDEFC2]"
              >
                <div className="relative h-[400px] w-full overflow-hidden bg-gray-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  {/* góc NEW */}
                  <div className="absolute top-2 left-2 bg-[#1B4332] text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-[0.16em]">
                    New
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="inline-block text-[10px] uppercase tracking-[0.18em] text-[#6B7280] mb-1">
                    {item.tag}
                  </span>
                  <h3 className="heading-font text-[15px] text-[#111827] mb-1">
                    {item.name}
                  </h3>
                  <p className="text-[12px] text-[#6B7280] flex-1">
                    {item.desc}
                  </p>
                  <div className="mt-2 text-[13px] font-semibold text-[#B45309]">
                    {item.price}
                  </div>
                  <button
                    onClick={() =>
                      navigate("/product/new-arrival", {
                        state: { product: { ...item, type: "newArrival" } },
                      })
                    }
                    className="mt-3 w-full px-4 py-2.5 text-[12px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
                  >
                    <span>💬</span>
                    <span>Dùng mẫu này để tư vấn</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STYLE SELECTOR – PHÙ HỢP VỚI DỊP NÀO */}
      <section
        id="styles"
        className="bg-[#FFFBEA] border-b border-[#FDEFC2] py-10"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
                Chọn dịp của bạn
              </p>
              <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
                Bạn cần may đồ cho dịp nào?
              </h2>
            </div>
            <p className="text-[12px] md:text-[13px] text-[#6B7280] max-w-md">
              Chọn một trong các dịp bên dưới, chúng tôi gợi ý nhanh kiểu đồ và
              mức giá tham khảo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {collections.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveStyle(c.key)}
                className={`px-4 py-2 text-[12px] rounded-full border transition-colors ${activeStyle === c.key
                  ? "bg-[#B45309] text-white border-[#B45309]"
                  : "bg-white text-[#374151] border-[#FDEFC2] hover:border-[#B45309]"
                  }`}
              >
                {c.tag}
              </button>
            ))}
          </div>

          {/* Active style card */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl overflow-hidden bg-gray-200 h-[400px] md:h-[550px] shadow-lg">
              <img
                src={activeCollection.image}
                alt={activeCollection.name}
                className="w-full h-full object-cover object-center md:object-top"
                loading="lazy"
              />
            </div>
            <div className="space-y-3 text-[13px] md:text-[14px]">
              <span className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280]">
                Gợi ý cho bạn
              </span>
              <h3 className="heading-font text-[18px] md:text-[20px] text-[#111827]">
                {activeCollection.name}
              </h3>
              <p className="text-[#4B5563]">
                {activeCollection.description}
              </p>
              <p className="text-[#1B4332] font-semibold">
                {activeCollection.price}
              </p>
              <p className="text-[12px] text-[#6B7280]">
                Bạn có thể mang hình mẫu đến tiệm, chúng tôi tư vấn xem form đó
                có phù hợp dáng người & dịp của bạn không.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FITTING ADVICE – GÓC TƯ VẤN NHANH */}
      <section className="bg-white border-b border-[#FDEFC2] py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
                Góc tư vấn nhanh
              </p>
              <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
                Chưa biết chọn dáng nào? Bắt đầu từ đây nhé
              </h2>
            </div>
            <p className="text-[12px] md:text-[13px] text-[#6B7280] max-w-md">
              Dưới đây là vài gợi ý cơ bản My Hiền thường chia sẻ với khách mới.
              Khi đến tiệm, chúng tôi sẽ dựa trên dáng người thật của bạn để tư vấn kỹ hơn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 text-[13px]">
            {fittingTips.map((tip, index) => (
              <div
                key={index}
                className="bg-[#FFFBF2] rounded-2xl p-5 border border-[#FDEFC2] shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-[#1D3557]/10 flex items-center justify-center text-[11px] font-semibold text-[#1D3557]">
                    0{index + 1}
                  </span>
                  <h3 className="heading-font text-[14px] text-[#111827]">
                    {tip.title}
                  </h3>
                </div>
                <p className="text-[12px] text-[#4B5563] leading-relaxed">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTION CARDS */}
      <section
        id="collections"
        className="py-14 md:py-18 bg-white relative"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-9">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
              Bộ sưu tập
            </p>
            <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
              Một vài dòng sản phẩm tại My Hiền
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5 text-[13px]">
            {collections.map((c, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col border border-[#FDEFC2]"
              >
                <div className="h-36 md:h-40 w-full overflow-hidden bg-gray-200">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="inline-block text-[10px] uppercase tracking-[0.18em] text-[#6B7280] mb-1">
                    {c.tag}
                  </span>
                  <h3 className="heading-font text-[15px] text-[#111827] mb-1">
                    {c.name}
                  </h3>
                  <p className="text-[12px] text-[#6B7280] flex-1">
                    {c.description}
                  </p>
                  <div className="mt-2 text-[13px] font-semibold text-[#1B4332]">
                    {c.price}
                  </div>
                  <button
                    onClick={() =>
                      navigate("/product/collection", {
                        state: { product: { ...c, type: "collection" } },
                      })
                    }
                    className="mt-3 w-full px-4 py-2.5 text-[12px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <span>👁️</span>
                    <span>Xem gợi ý chi tiết</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section
        id="process"
        className="py-16 md:py-20 bg-[#F5F3EF] relative"
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-9">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
              Quy trình
            </p>
            <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
              Đặt may tại My Hiền diễn ra như thế nào?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-[13px]">
            {processSteps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[11px] font-semibold">
                    {step.step}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">{step.icon}</span>
                    <h3 className="heading-font text-[14px] text-[#111827]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[12px] md:text-[13px] text-[#4B5563]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ – MỘT VÀI CÂU HỎI THƯỜNG GẶP */}
      <section className="py-14 md:py-18 bg-white border-t border-[#FDEFC2]">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
              Hỏi nhanh – Đáp gọn
            </p>
            <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
              Trước khi đặt may, khách thường hỏi gì?
            </h2>
          </div>
          <div className="space-y-3 text-[13px]">
            {faqs.map((item, index) => (
              <div
                key={index}
                className="bg-[#FFFBF2] rounded-xl px-4 py-3 border border-[#FDEFC2]"
              >
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-semibold text-[#111827]">{item.q}</p>
                    <p className="mt-1 text-[12px] text-[#4B5563]">
                      {item.a}
                    </p>
                  </div>
                  <span className="text-[#9CA3AF] text-[16px]">?</span>
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-center text-[#6B7280]">
            Nếu bạn có câu hỏi riêng, hãy để lại ghi chú khi đặt lịch tư vấn –
            My Hiền sẽ chuẩn bị kỹ trước buổi gặp.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="stories"
        className="py-16 md:py-20 bg-white relative"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-9">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-1">
              Khách nói gì
            </p>
            <h2 className="heading-font text-[20px] md:text-[22px] text-[#111827]">
              Một vài chia sẻ thật từ khách
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-[13px]">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className="bg-[#F5F3EF] rounded-2xl p-5 shadow-sm"
              >
                <div className="flex gap-3 items-center mb-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="heading-font text-[14px] text-[#111827]">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {t.role}
                    </div>
                  </div>
                </div>
                <p className="text-[12px] md:text-[13px] text-[#4B5563] italic mb-3">
                  “{t.quote}”
                </p>
                <div className="flex gap-1 text-[#E0B973] text-[11px]">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES - ĐẶT MAY MẪU & MUA VẢI */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#1B4332] via-[#14532d] to-[#1B4332] text-white">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="heading-font text-[24px] md:text-[28px] mb-3">
              Bạn muốn làm gì?
            </h2>
            <p className="text-[13px] md:text-[14px] text-[#E5E7EB] max-w-2xl mx-auto">
              Chọn dịch vụ phù hợp với nhu cầu của bạn: đặt may mẫu theo yêu cầu hoặc mua vải chất lượng cao
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1: Đặt may mẫu */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="heading-font text-[22px] md:text-[24px] mb-2">
                  Đặt may mẫu
                </h3>
                <p className="text-[13px] md:text-[14px] text-[#E5E7EB] mb-4">
                  May đo theo số đo cá nhân, tư vấn mẫu và chất liệu phù hợp với dịp của bạn
                </p>
              </div>

              <div className="space-y-3 mb-6 text-[12px] md:text-[13px]">
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Đo số đo chi tiết tại tiệm hoặc online</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Tư vấn mẫu và phong cách phù hợp</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Chọn vải và màu sắc theo yêu cầu</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Theo dõi tiến độ và nhận đồ tận nơi</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="w-full px-6 py-3 bg-white text-[#1B4332] rounded-full font-semibold hover:bg-[#F3F4F6] transition-all duration-300 shadow-lg hover:shadow-xl text-[13px] md:text-[14px]"
                  onClick={() => navigate("/customer/order")}
                >
                  Đặt lịch tư vấn tại tiệm
                </button>
                <button
                  className="w-full px-6 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-all duration-300 text-[13px] md:text-[14px]"
                  onClick={() =>
                    navigate("/customer/order", {
                      state: { source: "online-request" },
                    })
                  }
                >
                  Gửi yêu cầu may online
                </button>
              </div>

              <p className="mt-4 text-[11px] text-center text-[#D1FAE5]">
                Phản hồi trong vòng <span className="font-semibold">24 giờ</span>
              </p>
            </div>

            {/* Card 2: Mua vải */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="heading-font text-[22px] md:text-[24px] mb-2">
                  Mua vải
                </h3>
                <p className="text-[13px] md:text-[14px] text-[#E5E7EB] mb-4">
                  Mua vải chất lượng cao với nhiều loại, màu sắc đa dạng cho dự án may đo của bạn
                </p>
              </div>

              <div className="space-y-3 mb-6 text-[12px] md:text-[13px]">
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Hơn 100+ loại vải cao cấp</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Nhiều màu sắc và hoa văn đa dạng</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Giá cả minh bạch, bán theo mét</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D1FAE5] mt-1">✓</span>
                  <span className="text-[#E5E7EB]">Giao hàng tận nơi hoặc nhận tại cửa hàng</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="w-full px-6 py-3 bg-white text-[#1B4332] rounded-full font-semibold hover:bg-[#F3F4F6] transition-all duration-300 shadow-lg hover:shadow-xl text-[13px] md:text-[14px]"
                  onClick={() => navigate("/fabrics")}
                >
                  Xem danh sách vải
                </button>
                <button
                  className="w-full px-6 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-all duration-300 text-[13px] md:text-[14px]"
                  onClick={() => navigate("/cart")}
                >
                  Xem giỏ hàng
                </button>
              </div>

              <p className="mt-4 text-[11px] text-center text-[#D1FAE5]">
                Miễn phí vận chuyển cho đơn hàng <span className="font-semibold">trên 500.000₫</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contact"
        className="bg-[#111827] text-white py-10 text-[12px]"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div className="md:col-span-2">
              <h3 className="heading-font text-[16px] mb-2">
                My Hiền • Fashion Design Studio
              </h3>
              <p className="text-[#9CA3AF] max-w-md">
                Tiệm may đo tập trung vào cảm giác mặc thật sự thoải mái,
                vừa vặn với cuộc sống hằng ngày của bạn. Mỗi sản phẩm đều được
                theo dõi hồ sơ số đo để lần sau may nhanh hơn, chuẩn hơn.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Địa chỉ atelier
              </h4>
              <p className="text-[#9CA3AF]">
                123 Nguyễn Thị Minh Khai, Q.1
                <br />
                TP. Hồ Chí Minh
                <br />
                (Đặt lịch trước khi ghé để được tư vấn kỹ hơn)
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Liên hệ
              </h4>
              <p className="text-[#9CA3AF]">
                Email: dvkh@camfashion.vn
                <br />
                Hotline: 0901 134 256
                <br />
                Giờ mở cửa: 07:00 - 23:00
              </p>
            </div>
          </div>
          <div className="border-t border-[#1F2937] pt-4 flex justify-between items-center text-[#6B7280] text-[11px]">
            <span>© 2025 My Hiền Fashion Design Studio. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#">Chính sách bảo mật</a>
              <a href="#">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerHomePage;
