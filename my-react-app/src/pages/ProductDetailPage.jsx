import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header.jsx";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../utils/favoriteStorage.js";

const ProductDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state?.product || {
    name: "Sản phẩm may đo",
    desc: "Mô tả sản phẩm",
    price: "0 ₫",
    tag: "Bộ sưu tập",
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
    type: "newArrival",
  };

  const [selectedImage, setSelectedImage] = useState(0);
  const productKey =
    product.key ||
    product.slug ||
    (product.name
      ? product.name
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : "product-detail");
  const [isFavoriteProduct, setIsFavoriteProduct] = useState(() =>
    isFavorite(productKey)
  );

  // ====== GALLERY ======
  const productImages = [
    product.image,
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601925260368-ae2f83d34b08?w=900&auto=format&fit=crop&q=80",
  ];

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

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      {/* HEADER chung với toàn site */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
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
                  {product.price}
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
                <img
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
                    <img
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
                  <InfoChip label="Thời gian may" value="7–14 ngày" />
                  <InfoChip label="Số lần thử đồ" value="1–2 lần" />
                  <InfoChip label="Bảo hành" value="Chỉnh sửa miễn phí 1 lần" />
                </div>
              </div>

              {/* CHI TIẾT MAY ĐO */}
              <div className="bg-[#FFF7ED] rounded-2xl border border-[#FED7AA] p-5 md:p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#92400E] mb-2">
                  Chi tiết may đo
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px] text-[#4B5563] mb-3">
                  <DetailRow label="Form dáng" value="Ôm nhẹ, tôn eo" />
                  <DetailRow label="Độ dài" value="Qua gối / maxi tùy chọn" />
                  <DetailRow
                    label="Chất liệu gợi ý"
                    value="Lụa, satin, crepe cao cấp"
                  />
                  <DetailRow label="Lót trong" value="Có, chống hằn & thoáng" />
                  <DetailRow
                    label="Màu sắc"
                    value="Tùy chọn theo bảng màu tại tiệm"
                  />
                  <DetailRow
                    label="Phụ kiện"
                    value="Có thể phối thêm belt, hoa cài, khăn choàng"
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
                    <ul className="list-disc list-inside space-y-1">
                      <li>Cưới hỏi, lễ kỷ niệm, tiệc tối</li>
                      <li>Chụp ảnh kỷ niệm, pre-wedding</li>
                      <li>Sự kiện cần sự chỉn chu, thanh lịch</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Phong cách khách hàng</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Thích sự nữ tính, mềm mại nhưng không sến</li>
                      <li>Muốn tôn dáng nhưng vẫn di chuyển thoải mái</li>
                      <li>Cần trang phục “đẹp ngoài đời & đẹp trên hình”</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[12px] text-[#4B5563]">
                  <p className="font-medium mb-1">Gợi ý bảo quản</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh.</li>
                    <li>Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt.</li>
                    <li>
                      Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn.
                    </li>
                  </ul>
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
                <button className="flex-1 px-6 py-3.5 text-[14px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
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
        </div>
      </main>

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
