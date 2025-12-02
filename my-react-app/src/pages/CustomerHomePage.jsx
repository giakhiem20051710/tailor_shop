import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStyle, setActiveStyle] = useState("wedding");
  const heroRef = useRef(null);

  const heroImages = [
    "https://images.unsplash.com/photo-1594938291221-94f18cbb566b?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601925260368-ae2f83d34b08?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop&q=80",
  ];

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

  const collections = [
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
  ];

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

  const newArrivals = [
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
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased overflow-x-hidden">
      {/* HEADER */}
      <Header currentPage="/customer-home" />


      {/* HERO */}
      <section
  id="top"
  ref={heroRef}
  className="relative min-h-[480px] md:min-h-[560px] flex items-center pt-[170px] md:pt-[190px] pb-16 md:pb-18 overflow-hidden"
>
        {/* Light background blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-56 h-56 md:w-72 md:h-72 bg-[#E0B973]/18 rounded-full blur-3xl transition-all duration-500"
            style={{
              left: `${mousePosition.x * 0.08}px`,
              top: `${mousePosition.y * 0.08}px`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left text */}
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center text-[10px] tracking-[0.25em] uppercase text-[#1B4332] font-semibold bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-[#E0B973]/40">
                Bespoke Tailoring Studio
              </span>

              <h1 className="heading-font text-[26px] leading-snug md:text-[30px] lg:text-[32px] text-[#111827]">
                Trang phục may đo
                <br />
                <span className="text-[#1B4332]">
                  vừa vặn & tự nhiên với bạn
                </span>
              </h1>

              <p className="text-[13px] md:text-[14px] text-[#4B5563] leading-relaxed max-w-md">
                Không chỉ là “đồ đẹp để chụp hình”, Lavi Tailor ưu tiên cảm giác
                thoải mái khi mặc – từ lúc di chuyển, ngồi làm việc, đến lúc
                cười nói với bạn bè.
              </p>

              {/* Small trust line */}
              <p className="text-[11px] text-[#6B7280]">
                Hơn{" "}
                <span className="font-semibold text-[#1B4332]">
                  3.000+
                </span>{" "}
                bộ đồ đã hoàn thiện,{" "}
                <span className="font-semibold text-[#1B4332]">
                  1.500+
                </span>{" "}
                khách hàng quay lại.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button className="px-5 py-2.5 text-[13px] bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-colors">
                  Xem các mẫu được đặt nhiều
                </button>
                <button className="px-5 py-2.5 text-[13px] border border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-colors">
                  Tìm hiểu quy trình đặt may
                </button>
              </div>
            </div>

            {/* Right: main hero image */}
            <div className="lg:col-span-7">
              <div className="relative h-[250px] sm:h-[300px] md:h-[340px] lg:h-[380px] rounded-3xl overflow-hidden shadow-xl bg-gray-200">
                {heroImages.map((img, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === currentImageIndex
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
                <div className="absolute bottom-4 left-4 bg-white/92 backdrop-blur px-4 py-3 rounded-2xl shadow-md text-[11px] md:text-[12px] max-w-[230px]">
                  <div className="heading-font text-[13px] text-[#111827]">
                    Áo dài & Vest may đo
                  </div>
                  <div className="text-[#6B7280]">
                    Form gọn gàng, dễ di chuyển, không “gồng mình” để đẹp.
                  </div>
                </div>

                {/* Counter */}
                <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1">
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

      {/* NEW ARRIVALS – HÀNG MỚI VỀ */}
      <section
        id="new-arrivals"
        className="bg-white border-y border-[#E5E7EB] py-12"
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
                className="bg-[#F9FAFB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-40 md:h-44 w-full overflow-hidden bg-gray-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
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
                  <div className="mt-2 text-[13px] font-semibold text-[#1B4332]">
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
        className="bg-[#F5F3EF] border-b border-[#E5E7EB] py-10"
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
                className={`px-4 py-2 text-[12px] rounded-full border transition-colors ${
                  activeStyle === c.key
                    ? "bg-[#1B4332] text-white border-[#1B4332]"
                    : "bg-white text-[#374151] border-[#D1D5DB] hover:border-[#1B4332]"
                }`}
              >
                {c.tag}
              </button>
            ))}
          </div>

          {/* Active style card */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl overflow-hidden bg-gray-200 h-[220px] md:h-[260px]">
              <img
                src={activeCollection.image}
                alt={activeCollection.name}
                className="w-full h-full object-cover object-center"
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
              Một vài dòng sản phẩm tại Lavi
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5 text-[13px]">
            {collections.map((c, index) => (
              <div
                key={index}
                className="bg-[#F9FAFB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
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
              Đặt may tại Lavi diễn ra ra sao?
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

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1B4332] text-white">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 text-center">
          <h2 className="heading-font text-[20px] md:text-[24px] mb-3">
            Bạn đang chuẩn bị cho dịp gì?
          </h2>
          <p className="text-[13px] md:text-[14px] text-[#E5E7EB] mb-6">
            Cưới hỏi, lễ kỷ niệm, buổi thuyết trình quan trọng hay đơn giản là
            muốn có bộ đồ vừa vặn hơn cho mỗi ngày?
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-[13px]">
            <button className="px-5 py-2.5 bg-white text-[#1B4332] rounded-full font-medium hover:bg-[#F3F4F6] transition-colors">
              Đặt lịch tư vấn tại tiệm
            </button>
            <button className="px-5 py-2.5 border border-white rounded-full hover:bg-white/10 transition-colors">
              Gửi yêu cầu may online
            </button>
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

export default CustomerHomePage;
