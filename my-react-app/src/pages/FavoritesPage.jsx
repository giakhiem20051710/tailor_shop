import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { favoriteService, authService } from "../services";
import usePageMeta from "../hooks/usePageMeta";
import { showError } from "../components/NotificationToast.jsx";

const getSlug = (product, index = 0) => {
  if (product?.key) return product.key;
  if (product?.slug) return product.slug;
  if (product?.name) {
    return product.name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  return `fav-${index}`;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  usePageMeta({
    title: "Danh sách yêu thích | My Hiền Tailor",
    description:
      "Lưu lại các mẫu áo dài, vest, đầm may đo bạn đang cân nhắc để stylist My Hiền chuẩn bị sẵn chất liệu và phom dáng.",
  });

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteService.list({ page: 0, size: 100 });
      if (response.success && response.data) {
        setFavorites(response.data.content || []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      showError("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemType, itemId, itemKey) => {
    try {
      if (itemType && itemId) {
        await favoriteService.remove(itemType, itemId);
      } else if (itemKey) {
        await favoriteService.removeByKey(itemKey);
      }
      loadFavorites(); // Refresh
    } catch (error) {
      console.error("Error removing favorite:", error);
      showError("Không thể xóa khỏi danh sách yêu thích");
    }
  };

  const handleViewDetail = (product, index) => {
    const slug = getSlug(product, index);
    navigate(`/product/${slug}`, { state: { product: { ...product, key: slug } } });
  };

  const emptyState = !loading && favorites.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/favorites" />
        <main className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-6xl mx-auto px-5 lg:px-8 text-center py-20">
            <p className="text-[#6B7280]">Đang tải danh sách yêu thích...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/favorites" />
        <main className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="bg-white rounded-[28px] border border-dashed border-[#E5E7EB] p-10 text-center shadow-sm">
              <p className="text-4xl mb-4">🔒</p>
              <h2 className="text-[20px] font-semibold text-[#111827] mb-2">
                Vui lòng đăng nhập
              </h2>
              <p className="text-[13px] text-[#6B7280] mb-4">
                Bạn cần đăng nhập để xem danh sách yêu thích.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-full bg-[#1B4332] text-white text-[13px] font-medium hover:bg-[#14532d]"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/favorites" />

      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#9CA3AF]">
                Danh sách yêu thích
              </p>
              <h1 className="heading-font text-[28px] md:text-[32px] text-[#111827]">
                Danh sách mẫu may đo yêu thích tại My Hiền Tailor
              </h1>
              <p className="text-[13px] text-[#6B7280] max-w-2xl">
                Lưu lại các mẫu muốn thử để khi đến tiệm, stylist chuẩn bị sẵn
                chất liệu và phom dáng cho bạn.
              </p>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="px-5 py-3 rounded-full bg-[#111827] text-white text-[12px] font-semibold hover:bg-[#0B1324] transition"
            >
              Tiếp tục xem bộ sưu tập →
            </button>
          </header>

          {emptyState ? (
            <div className="bg-white rounded-[28px] border border-dashed border-[#E5E7EB] p-10 text-center shadow-sm">
              <p className="text-4xl mb-4">🤍</p>
              <h2 className="text-[20px] font-semibold text-[#111827] mb-2">
                Chưa có mẫu nào được lưu
              </h2>
              <p className="text-[13px] text-[#6B7280] mb-4">
                Hãy duyệt bộ sưu tập và bấm ❤️ tại những thiết kế bạn muốn thử.
              </p>
              <button
                onClick={() => navigate("/products")}
                className="px-6 py-3 rounded-full bg-[#1B4332] text-white text-[13px] font-medium hover:bg-[#14532d]"
              >
                Xem ngay các thiết kế nổi bật
              </button>
            </div>
          ) : (
            <section className="grid md:grid-cols-2 gap-6">
              {favorites.map((favorite, index) => {
                const product = favorite.product || favorite;
                const productKey = favorite.itemKey || product?.key || getSlug(product, index);
                
                return (
                  <article
                    key={favorite.id || index}
                    className="bg-white border border-[#E4D8C3] rounded-[26px] shadow-[0_12px_30px_rgba(148,114,80,0.18)] overflow-hidden flex flex-col hover:shadow-[0_18px_40px_rgba(148,114,80,0.26)] hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="relative h-60 w-full overflow-hidden">
                      <img
                        src={favorite.itemImage || product?.image || "https://via.placeholder.com/400"}
                        alt={favorite.itemName || product?.name || "Sản phẩm"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-4">
                        <span className="inline-flex text-[10px] uppercase tracking-[0.22em] text-white/80">
                          {favorite.itemType || "Sản phẩm"}
                        </span>
                        <p className="heading-font text-[18px] text-white">
                          {favorite.itemName || product?.name || "Sản phẩm"}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleRemove(favorite.itemType, favorite.itemId, favorite.itemKey)
                        }
                        className="absolute top-3 right-3 text-[11px] px-3 py-1.5 rounded-full bg-white/90 text-[#B91C1C] border border-[#FECACA] font-medium hover:bg-white shadow-sm"
                      >
                        ✕ Bỏ yêu thích
                      </button>
                    </div>

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      <p className="text-[13px] text-[#4B5563]">
                        {product?.desc || product?.description ||
                          "Thiết kế may đo theo dáng, chỉnh được chi tiết khi đến tiệm."}
                      </p>
                      <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                        <div>
                          <p className="uppercase tracking-[0.2em] text-[#9CA3AF] text-[10px]">
                            Giá tham khảo
                          </p>
                          <p className="text-[18px] font-semibold text-[#1B4332]">
                            {favorite.itemPrice 
                              ? new Intl.NumberFormat("vi-VN").format(favorite.itemPrice) + " ₫"
                              : product?.price || "Liên hệ"}
                          </p>
                        </div>
                        {favorite.itemRating && (
                          <span>⭐ {favorite.itemRating}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                        <button
                          onClick={() => {
                            if (favorite.itemType === 'PRODUCT') {
                              navigate(`/product/${productKey}`, { state: { product } });
                            } else if (favorite.itemType === 'FABRIC') {
                              navigate(`/fabrics/${favorite.itemId}`);
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-full bg-[#1B4332] text-white text-[12px] font-semibold hover:bg-[#133021] flex items-center justify-center gap-2"
                        >
                          <span>👁️</span>
                          <span>Xem chi tiết</span>
                        </button>
                        {favorite.itemType === 'PRODUCT' && (
                          <button
                            onClick={() =>
                              navigate("/customer/order", { state: { product } })
                            }
                            className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#1B4332] text-[#1B4332] text-[12px] font-semibold hover:bg-[#1B4332] hover:text-white transition"
                          >
                            Đặt may mẫu này
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

