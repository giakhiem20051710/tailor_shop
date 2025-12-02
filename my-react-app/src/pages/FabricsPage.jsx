import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import {
  getFabricHolds,
  addFabricHold,
  addFabricVisit,
} from "../utils/fabricHoldStorage.js";

const baseFabrics = [
  {
    key: "lua-taffeta",
    name: "Lụa Tơ Tằm Taffeta Thượng Hạng",
    desc: "Bề mặt bóng nhẹ, đứng phom, phù hợp áo dài cưới & đầm dạ hội cao cấp.",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900&auto=format&fit=crop&q=80",
    price: "Từ 380.000 đ/m",
    unit: "đ/m",
    tag: "Lụa · Party / Cưới",
    sold: 128,
    gallery: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1557825835-70d97c4aa06a?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=900&auto=format&fit=crop&q=80",
    ],
    videoUrl: "https://www.youtube.com/embed/jxDzihwVApM",
    properties: {
      stretch: "Nhẹ",
      thickness: "Trung bình",
      drape: "Rủ nhiều",
    },
    specs: {
      composition: "100% tơ tằm dệt taffeta",
      width: "Khổ 1m5",
      weight: "Khoảng 120–140 gsm",
    },
    rating: 4.9,
    suggestions: {
      should: "Áo dài cưới, đầm dạ hội, váy maxi sang trọng.",
      avoid: "Không phù hợp quần tây hoặc trang phục cần co giãn nhiều.",
    },
    reviews: [
      {
        name: "Chị Lan (Q.7)",
        comment: "Vải lên áo dài cưới rất sang, chụp hình bắt sáng đẹp.",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "linen-mem",
    name: "Linen Mềm Chống Nhăn Everyday",
    desc: "Chất liệu thoáng mát, ít nhăn, hợp đầm & set đồ hằng ngày.",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&auto=format&fit=crop&q=80",
    price: "Từ 260.000 đ/m",
    unit: "đ/m",
    tag: "Linen · Everyday",
    sold: 214,
    gallery: [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80",
    ],
    videoUrl: "https://www.youtube.com/embed/2nyIspLy5Ts",
    properties: {
      stretch: "Không co giãn",
      thickness: "Mỏng – trung bình",
      drape: "Rủ vừa",
    },
    specs: {
      composition: "Linen pha cotton",
      width: "Khổ 1m4",
      weight: "Khoảng 150–170 gsm",
    },
    rating: 4.7,
    suggestions: {
      should: "Đầm suông, áo sơ mi, quần short, set đồ mùa hè.",
      avoid: "Không nên may vest cấu trúc hoặc đầm dạ hội cần độ bóng.",
    },
    reviews: [
      {
        name: "Bạn Huyền (Q.1)",
        comment: "Mặc mát, ít nhăn hơn linen thường, hợp đi làm.",
        image:
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "cashmere-suit",
    name: "Cashmere Suiting Cho Vest",
    desc: "Độ rủ đẹp, giữ phom, phù hợp vest công sở & vest cưới.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80",
    price: "Từ 520.000 đ/m",
    unit: "đ/m",
    tag: "Cashmere · Office",
    sold: 86,
    gallery: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80",
    ],
    videoUrl: "https://www.youtube.com/embed/jxDzihwVApM",
    properties: {
      stretch: "Nhẹ",
      thickness: "Trung bình – dày",
      drape: "Đứng phom",
    },
    specs: {
      composition: "Wool cashmere pha poly",
      width: "Khổ 1m5",
      weight: "Khoảng 240–260 gsm",
    },
    rating: 4.8,
    suggestions: {
      should: "Vest, blazer, quần tây cao cấp.",
      avoid: "Không may váy maxi hoặc áo dài cần độ rủ nhiều.",
    },
    reviews: [
      {
        name: "Anh Minh (Thủ Đức)",
        comment: "Vest lên form đẹp, ít nhăn, mặc mát hơn mong đợi.",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "satin-matte",
    name: "Satin Lì Ít Bóng Minimal",
    desc: "Không quá bóng, lên hình đẹp, hợp đầm tối giản & áo dài hiện đại.",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80",
    price: "Từ 340.000 đ/m",
    unit: "đ/m",
    tag: "Satin · Minimal",
    sold: 172,
    gallery: [
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&auto=format&fit=crop&q=80",
    ],
    videoUrl: "https://www.youtube.com/embed/2nyIspLy5Ts",
    properties: {
      stretch: "Không co giãn",
      thickness: "Mỏng – trung bình",
      drape: "Rủ nhẹ",
    },
    specs: {
      composition: "Poly satin xử lý lì bề mặt",
      width: "Khổ 1m5",
      weight: "Khoảng 140–160 gsm",
    },
    rating: 4.6,
    suggestions: {
      should: "Đầm slip dress, áo hai dây, áo dài hiện đại.",
      avoid: "Không nên may quần tây công sở hoặc đồ cần độ đứng.",
    },
    reviews: [
      {
        name: "Chị Trâm (Q.3)",
        comment: "Đầm slip dress ít nhăn, chụp ảnh studio rất đẹp.",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80&sat=-10",
      },
    ],
  },
];

const extraFabricImages = [
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&sat=-40",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&hue=20",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511381939415-c1c26e52e796?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format&fit=crop&q=80&sat=-20",
  "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=900&auto=format&fit=crop&q=80&sat=-30",
  "https://images.unsplash.com/photo-1509043759401-136742328bb3?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557825835-70d97c4aa06a?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&sat=30",
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop&q=80&sat=-10",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop&q=80&hue=10",
  "https://images.unsplash.com/photo-1616401784845-180882ba9ba4?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600093463592-9f61807aef11?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1616401784845-180882ba9ba4?w=900&auto=format&fit=crop&q=80&sat=-20",
  "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=900&auto=format&fit=crop&q=80&hue=15",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format&fit=crop&q=80&hue=-10",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&auto=format&fit=crop&q=80&sat=-15",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&auto=format&fit=crop&q=80&sat=-25",
  "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&auto=format&fit=crop&q=80&sat=-5",
  "https://images.unsplash.com/photo-1509043759401-136742328bb3?w=900&auto=format&fit=crop&q=80&sat=-35",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80&sat=-30",
  "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=900&auto=format&fit=crop&q=80&sat=10",
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557825835-70d97c4aa06a?w=900&auto=format&fit=crop&q=80&sat=-15",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=900&auto=format&fit=crop&q=80&sat=10",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80&sat=-15",
  "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=900&auto=format&fit=crop&q=80&sat=5",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&sat=-45",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&auto=format&fit=crop&q=80&sat=15",
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop&q=80&sat=-35",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format&fit=crop&q=80&sat=20",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&auto=format&fit=crop&q=80&sat=15",
  "https://images.unsplash.com/photo-1600093463592-9f61807aef11?w=900&auto=format&fit=crop&q=80&sat=10",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&sat=-20",
  "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80&sat=-10",
  "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=900&auto=format&fit=crop&q=80&sat=-20",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&auto=format&fit=crop&q=80&sat=-25",
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop&q=80&sat=-5",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=900&auto=format&fit=crop&q=80&sat=-20",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80&sat=25",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&auto=format&fit=crop&q=80&sat=-30",
];

export const fabrics = [
  ...baseFabrics,
  ...extraFabricImages.map((url, index) => ({
    key: `fabric-${index + 1}`,
    name: `Cuộn vải studio ${index + 1}`,
    desc:
      index % 3 === 0
        ? "Vải dệt mịn, phù hợp may áo sơ mi hoặc đầm nhẹ."
        : index % 3 === 1
        ? "Bề mặt có texture nhẹ, hợp vest, áo khoác mỏng."
        : "Chất liệu mềm, rủ, phù hợp đầm maxi & áo dài hiện đại.",
    image: url,
    gallery: [url],
    price:
      index % 3 === 0
        ? "Từ 220.000 đ/m"
        : index % 3 === 1
        ? "Từ 320.000 đ/m"
        : "Từ 420.000 đ/m",
    unit: "đ/m",
    tag:
      index % 3 === 0
        ? "Cotton / Poplin"
        : index % 3 === 1
        ? "Suiting / Twill"
        : "Lụa / Chiffon",
    sold: (index + 3) * 7,
    rating: index % 2 === 0 ? 4.6 : 4.8,
  })),
];

export default function FabricsPage() {
  const [heldKeys, setHeldKeys] = useState([]);
  const [visitKeys, setVisitKeys] = useState([]);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;
  const navigate = useNavigate();

  useEffect(() => {
    const holds = getFabricHolds();
    setHeldKeys(holds.filter((h) => h.type === "hold").map((h) => h.key));
    setVisitKeys(holds.filter((h) => h.type === "visit").map((h) => h.key));
  }, []);

  useEffect(() => {
    const section = document.getElementById("fabrics-grid-section");
    if (section) {
      const headerHeight = 190;
      const targetTop = section.offsetTop - headerHeight;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [currentPage]);

  const totalPages = Math.ceil(fabrics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFabrics = fabrics.slice(startIndex, endIndex);

  const handleHold = (fabric) => {
    const updated = addFabricHold(fabric);
    if (updated) {
      setHeldKeys(updated.filter((h) => h.type === "hold").map((h) => h.key));
      setVisitKeys(updated.filter((h) => h.type === "visit").map((h) => h.key));
      setMessage(`Đã đặt giữ cuộn vải “${fabric.name}”. Nhân viên sẽ liên hệ xác nhận.`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleVisit = (fabric, extra) => {
    const updated = addFabricVisit(fabric, extra);
    if (updated) {
      setHeldKeys(updated.filter((h) => h.type === "hold").map((h) => h.key));
      setVisitKeys(updated.filter((h) => h.type === "visit").map((h) => h.key));
      setMessage(
        `Đã ghi nhận yêu cầu hẹn xem vải “${fabric.name}”. Nhân viên sẽ gọi lại để chốt lịch.`
      );
      setTimeout(() => setMessage(""), 3000);
    }
  };
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/fabrics" />

      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-8">
          <header className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#9CA3AF]">
              Vải may đo chọn lọc
            </p>
            <h1 className="heading-font text-[28px] md:text-[32px] text-[#111827]">
              Chất liệu vải đang có sẵn tại tiệm
            </h1>
            <p className="text-[13px] text-[#6B7280]">
              Xem nhanh những chất liệu chủ lực để bạn hình dung trước phom dáng
              & cảm giác bề mặt vải trước khi đến tiệm.
            </p>
          </header>

          {message && (
            <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] px-4 py-3 rounded-2xl shadow-sm">
              {message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6B7280]">
            <span>
              {totalPages > 1 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {startIndex + 1}-{Math.min(endIndex, fabrics.length)}
                  </span>{" "}
                  trên tổng số{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {fabrics.length}
                  </span>{" "}
                  cuộn vải đang có (Trang {currentPage}/{totalPages})
                </>
              ) : (
                <>
                  Đang có{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {fabrics.length}
                  </span>{" "}
                  cuộn vải mẫu tại tiệm.
                </>
              )}
            </span>
          </div>

          <section
            id="fabrics-grid-section"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedFabrics.map((fabric) => {
              const isHeld = heldKeys.includes(fabric.key);
              const hasVisit = visitKeys.includes(fabric.key);
              return (
              <article
                key={fabric.key}
                className="bg-white rounded-[26px] border border-[#E4D8C3] overflow-hidden shadow-[0_10px_26px_rgba(148,114,80,0.18)] hover:shadow-[0_16px_40px_rgba(148,114,80,0.26)] hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => navigate(`/fabrics/${fabric.key}`)}
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={fabric.image}
                    alt={fabric.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <div className="absolute top-3 left-4">
                    <span className="inline-flex text-[10px] uppercase tracking-[0.22em] text-white/80">
                      {fabric.tag}
                    </span>
                    <p className="heading-font text-[18px] text-white">
                      {fabric.name}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <p className="text-[13px] text-[#4B5563]">{fabric.desc}</p>
                  <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                    <div>
                      <p className="uppercase tracking-[0.2em] text-[10px] text-[#9CA3AF]">
                        Giá tham khảo
                      </p>
                      <p className="text-[18px] font-semibold text-[#1B4332]">
                        {fabric.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#9CA3AF]">
                        Đã bán{" "}
                        <span className="font-semibold text-[#1B4332]">
                          {fabric.sold || 0}
                        </span>
                      </p>
                      {fabric.rating && (
                        <p className="text-[11px] text-[#F59E0B]">
                          ★ {fabric.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/fabrics/${fabric.key}`);
                      }}
                      disabled={hasVisit}
                      className={`flex-1 px-4 py-2.5 rounded-full text-[12px] font-semibold transition ${
                        hasVisit
                          ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
                          : "bg-[#1B4332] text-white hover:bg-[#133021]"
                      }`}
                    >
                      {hasVisit ? "Đã gửi yêu cầu hẹn xem vải" : "Hẹn xem vải tại tiệm"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
        handleHold(fabric);
                      }}
                      disabled={isHeld}
                      className={`flex-1 px-4 py-2.5 rounded-full border-2 text-[12px] font-semibold transition ${
                        isHeld
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 cursor-default"
                          : "border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white"
                      }`}
                    >
                      {isHeld ? "Đã đặt giữ cuộn vải này" : "Đặt giữ cuộn vải này"}
                    </button>
                  </div>
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
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                  currentPage === 1
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
                          className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all ${
                            currentPage === page
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
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                  currentPage === totalPages
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
              src={gallery[activeImageIndex]}
              alt={fabric.name}
              className="w-full h-full object-cover"
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
                      className={`w-11 h-11 rounded-lg overflow-hidden border ${
                        activeImageIndex === idx
                          ? "border-[#1B4332]"
                          : "border-transparent"
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
                      src={review.image}
                      alt={review.name}
                      className="w-full h-full object-cover"
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
                className={`flex-1 px-4 py-2.5 rounded-full text-[12px] font-semibold transition ${
                  hasVisit
                    ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
                    : "bg-[#1B4332] text-white hover:bg-[#133021]"
                }`}
              >
                {hasVisit ? "Đã gửi yêu cầu hẹn xem vải" : "Hẹn xem vải tại tiệm"}
              </button>
              <button
                onClick={() => onHold(fabric)}
                disabled={isHeld}
                className={`flex-1 px-4 py-2.5 rounded-full border-2 text-[12px] font-semibold transition ${
                  isHeld
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
    </div>
  );
}

