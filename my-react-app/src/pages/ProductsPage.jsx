import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import ProductSchema from "../components/schema/ProductSchema.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { getStyles as getAdminStyles } from "../utils/styleStorage.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../utils/favoriteStorage.js";
import { productConfigurationService, imageAssetService, productService } from "../services/index.js";

const buildFavoriteLookup = () => {
  const favorites = getFavorites();
  return favorites.reduce((acc, item) => {
    if (item?.key) {
      acc[item.key] = true;
    }
    return acc;
  }, {});
};

const getProductKey = (product) => {
  if (product?.key) return product.key;
  if (product?.slug) return product.slug;
  if (product?.name) {
    return product.name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  return undefined;
};

// Fallback image khi không có ảnh từ backend - dùng SVG inline để tránh lỗi network
const FALLBACK_PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'%3E%3Crect fill='%23f3f4f6' width='800' height='1000'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const ProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [favoriteLookup, setFavoriteLookup] = useState(() =>
    buildFavoriteLookup()
  );
  
  // State cho data từ backend
  const [templates, setTemplates] = useState([]);
  const [imageAssets, setImageAssets] = useState([]);
  const [backendProductsList, setBackendProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data từ backend
  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products từ API /products (ưu tiên)
      try {
        const productsResponse = await productService.list({}, { page: 0, size: 100 });
        const productsData = productService.parseResponse(productsResponse);
        const productsList = productsData?.content || productsData?.data || (Array.isArray(productsData) ? productsData : []);
        setBackendProductsList(productsList);
        console.log("✅ Loaded products from /products API:", productsList.length);
      } catch (productsErr) {
        console.warn("⚠️ Could not load products from /products API:", productsErr);
        // Fallback: load templates nếu /products không có data
        const templatesResponse = await productConfigurationService.getTemplates();
        const templatesData = productConfigurationService.parseResponse(templatesResponse);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        console.log("✅ Loaded templates (fallback):", templatesData.length);
      }

      // Load image assets từ backend (category = "template")
      try {
        const imagesResponse = await imageAssetService.filter({
          category: "template",
          page: 0,
          size: 100, // Load nhiều ảnh
        });
        const imagesData = imageAssetService.parseResponse(imagesResponse);
        const imagesList = imagesData?.content || imagesData?.data || (Array.isArray(imagesData) ? imagesData : []);
        setImageAssets(imagesList);
        console.log("✅ Loaded image assets:", imagesList.length);
      } catch (imagesErr) {
        console.warn("⚠️ Could not load image assets:", imagesErr);
      }
    } catch (err) {
      console.error("❌ Error loading backend data:", err);
      setError(err.message || "Không thể tải dữ liệu từ server");
    } finally {
      setLoading(false);
    }
  };

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearch(decodeURIComponent(searchParam));
    }
  }, [location.search]);

  // ====== HANDLERS ======
  const handleImageError = (event) => {
    // Ngăn chặn vòng lặp vô hạn nếu fallback cũng lỗi
    // Vì FALLBACK_PRODUCT_IMAGE là data URI nên không thể lỗi, nhưng vẫn check để an toàn
    if (event.currentTarget.dataset.fallbackUsed === 'true' || 
        event.currentTarget.src.startsWith('data:')) {
      // Nếu đã dùng fallback rồi mà vẫn lỗi, ẩn ảnh
      event.currentTarget.style.display = 'none';
      return;
    }
    
    // Đánh dấu đã dùng fallback
    event.currentTarget.dataset.fallbackUsed = 'true';
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
  };

  // Map products từ API /products thành format frontend
  const mappedBackendProducts = useMemo(() => {
    if (!backendProductsList || backendProductsList.length === 0) return [];

    return backendProductsList.map((product, index) => {
      // Lấy image từ product (ưu tiên media[0].url)
      let imageUrl = null;
      
      // Ưu tiên: media[0].url (nếu có)
      if (product.media && Array.isArray(product.media) && product.media.length > 0) {
        imageUrl = product.media[0].url || product.media[0].imageUrl;
      }
      
      // Fallback: các trường khác
      if (!imageUrl) {
        imageUrl = product.imageUrl || product.image || product.baseImage;
      }
      
      // Nếu không có image, tìm trong imageAssets
      if (!imageUrl) {
        const matchingImage = imageAssets.find(img => 
          img.productTemplateId === product.templateId || 
          img.productTemplateId === product.id
        );
        if (matchingImage?.url) {
          imageUrl = matchingImage.url;
        }
      }
      
      // Cuối cùng: dùng fallback nếu vẫn không có
      if (!imageUrl) {
        imageUrl = FALLBACK_PRODUCT_IMAGE;
      }

      // Map category từ backend sang frontend
      const categoryMap = {
        "ao-dai": "ao-dai",
        "ao_so_mi": "everyday",
        "quan_tay": "everyday",
        "vest": "vest",
        "dam": "dam",
        "vay_dam": "dam",
      };
      const productCategory = product.category || product.type || "";
      const frontendCategory = categoryMap[productCategory] || categoryMap[productCategory?.toLowerCase()] || "everyday";

      // Map category sang occasion
      const occasionMap = {
        "ao-dai": "wedding",
        "vest": "office",
        "dam": "party",
        "everyday": "daily",
      };
      const occasion = occasionMap[frontendCategory] || "daily";

      // Map category sang budget (dựa trên price nếu có)
      const priceValue = product.price || product.basePrice || product.finalPrice || 0;
      const budget = priceValue > 3000000 
        ? "high" 
        : priceValue > 2000000 
        ? "mid" 
        : "low";

      return {
        key: product.key || product.slug || `product-${product.id}`,
        name: product.name || product.title || "Sản phẩm",
        desc: product.description || product.desc || "Sản phẩm may đo chất lượng cao",
        price: priceValue 
          ? `${Number(priceValue).toLocaleString("vi-VN")} ₫`
          : "Liên hệ",
        tag: product.category || product.type || product.tag || "Sản phẩm",
        image: imageUrl,
        occasion: occasion,
        category: frontendCategory,
        budget: budget,
        type: product.type || "collection",
        productId: product.id,
        templateId: product.templateId,
      };
    });
  }, [backendProductsList, imageAssets]);

  // Map templates từ backend thành products (fallback nếu không có products)
  const backendProducts = useMemo(() => {
    // Ưu tiên dùng products từ API /products
    if (mappedBackendProducts.length > 0) {
      return mappedBackendProducts;
    }

    // Fallback: dùng templates nếu không có products
    if (!templates || templates.length === 0) return [];

    return templates.map((template, index) => {
      // Ưu tiên: 1) template.baseImage, 2) image asset có productTemplateId match, 3) image asset có type match, 4) fallback
      let imageUrl = template.baseImage || FALLBACK_PRODUCT_IMAGE;
      
      if (!template.baseImage && imageAssets.length > 0) {
        // Tìm image asset có productTemplateId match
        const exactMatch = imageAssets.find(img => img.productTemplateId === template.id);
        if (exactMatch?.url) {
          imageUrl = exactMatch.url;
        } else {
          // Tìm image asset có type/category match
          const categoryMatch = imageAssets.find(img => {
            if (!img.type || !template.category) return false;
            const imgType = img.type.toLowerCase();
            const templateCategory = template.category.toLowerCase();
            return imgType.includes(templateCategory) || templateCategory.includes(imgType);
          });
          if (categoryMatch?.url) {
            imageUrl = categoryMatch.url;
          } else {
            // Fallback: dùng image theo index để phân bổ đều
            const fallbackImage = imageAssets[index % imageAssets.length];
            if (fallbackImage?.url) {
              imageUrl = fallbackImage.url;
            }
          }
        }
      }

      // Map category từ backend sang frontend
      const categoryMap = {
        "ao-dai": "ao-dai",
        "ao_so_mi": "everyday",
        "quan_tay": "everyday",
        "vest": "vest",
        "dam": "dam",
        "vay_dam": "dam",
      };
      const frontendCategory = categoryMap[template.category] || "everyday";

      // Map category sang occasion
      const occasionMap = {
        "ao-dai": "wedding",
        "vest": "office",
        "dam": "party",
        "everyday": "daily",
      };
      const occasion = occasionMap[frontendCategory] || "daily";

      // Map category sang budget (dựa trên price nếu có)
      const budget = template.basePrice && Number(template.basePrice) > 3000000 
        ? "high" 
        : template.basePrice && Number(template.basePrice) > 2000000 
        ? "mid" 
        : "low";

      return {
        key: template.slug || `template-${template.id}`,
        name: template.name,
        desc: template.description || "Sản phẩm may đo chất lượng cao",
        price: template.basePrice 
          ? `${Number(template.basePrice).toLocaleString("vi-VN")} ₫`
          : "Liên hệ",
        tag: template.category || "Sản phẩm",
        image: imageUrl,
        occasion: occasion,
        category: frontendCategory,
        budget: budget,
        type: "collection",
        templateId: template.id, // Lưu templateId để dùng sau
      };
    });
  }, [templates, imageAssets, mappedBackendProducts]);

  // Schema products cho SEO (chỉ dùng backend products)
  const schemaProducts = useMemo(() => {
    return backendProducts.map((product) => ({
      name: product.name,
      desc: product.desc || product.description,
      image: product.image,
      price: product.price,
      key: product.key,
      category: product.category || product.tag,
    }));
  }, [backendProducts]);

  usePageMeta({
    title: "Bộ sưu tập áo dài, vest, đầm may đo | My Hiền Tailor",
    description:
      "Khám phá áo dài cưới, vest công sở, đầm dạ hội và trang phục hằng ngày được may đo riêng cho bạn tại My Hiền Tailor.",
  });

  // Chỉ dùng products từ backend
  const allProducts = useMemo(() => {
    return backendProducts;
  }, [backendProducts]);

  // ====== FILTER STATE ======
  const [needFilter, setNeedFilter] = useState("all"); // all | wedding | office | party | daily
  const [categoryFilter, setCategoryFilter] = useState("all"); // all | ao-dai | vest | dam | everyday
  const [budgetFilter, setBudgetFilter] = useState("all"); // all | low | mid | high
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (needFilter !== "all" && p.occasion !== needFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (budgetFilter !== "all" && p.budget !== budgetFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const text =
          (p.name || "").toLowerCase() +
          " " +
          (p.desc || p.description || "").toLowerCase() +
          " " +
          (p.tag || "").toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allProducts, needFilter, categoryFilter, budgetFilter, search]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [needFilter, categoryFilter, budgetFilter, search]);

  useEffect(() => {
    refreshFavoriteLookup();
  }, []);

  // Scroll đến phần grid sản phẩm khi chuyển trang
  useEffect(() => {
    const productsSection = document.getElementById("products-grid-section");
    if (productsSection) {
      const headerHeight = 190; // Chiều cao header
      const targetPosition = productsSection.offsetTop - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  }, [currentPage]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const refreshFavoriteLookup = () => {
    setFavoriteLookup(buildFavoriteLookup());
  };

  const handleFavoriteToggle = (event, product, productKey) => {
    event.stopPropagation();
    if (!productKey) return;
    if (favoriteLookup[productKey]) {
      removeFavorite(productKey);
    } else {
      addFavorite({ ...product, key: productKey });
    }
    refreshFavoriteLookup();
  };

  const handleCardClick = (product, index) => {
    const slug = getProductKey(product) || `p-${index}`;
    navigate(`/product/${slug}`, { state: { product: { ...product, key: slug } } });
  };

  const getFilterSummary = () => {
    const parts = [];

    switch (needFilter) {
      case "wedding":
        parts.push("Dịp cưới hỏi / lễ");
        break;
      case "office":
        parts.push("Đi làm, gặp khách");
        break;
      case "party":
        parts.push("Tiệc, sân khấu, sự kiện");
        break;
      case "daily":
        parts.push("Mặc hằng ngày");
        break;
      default:
        parts.push("Nhiều dịp khác nhau");
    }

    switch (categoryFilter) {
      case "ao-dai":
        parts.push("áo dài & trang phục truyền thống");
        break;
      case "vest":
        parts.push("vest, suit & sơ mi");
        break;
      case "dam":
        parts.push("đầm, váy dạ hội");
        break;
      case "everyday":
        parts.push("set đồ hằng ngày");
        break;
      default:
        parts.push("nhiều dòng sản phẩm");
    }

    switch (budgetFilter) {
      case "low":
        parts.push("ngân sách dưới ~2 triệu/bộ");
        break;
      case "mid":
        parts.push("ngân sách khoảng 2–3.5 triệu/bộ");
        break;
      case "high":
        parts.push("ưu tiên form & chất liệu cao cấp");
        break;
      default:
        parts.push("ngân sách linh hoạt");
    }

    return parts.join(" · ");
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <ProductSchema items={schemaProducts} />
      <Header currentPage="/products" />

      {/* MAIN CONTENT */}
      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-9">
          {/* HERO + FILTER – LUXURY SÁNG, MÀU THƯƠNG HIỆU */}
          <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-tr from-[#FFF7E6] via-[#FDF8F0] to-[#E8F2EA] text-[#122023] shadow-[0_18px_40px_rgba(148,114,80,0.28)] border border-[#F1E1C8]">
            {/* vệt sáng vàng nhạt + xanh nhạt */}
            <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#F2C979]/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-[-3rem] h-72 w-72 rounded-full bg-[#A7D9C3]/25 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)] items-stretch px-6 py-7 md:px-10 md:py-9">
              {/* LEFT: TEXT */}
              <div className="space-y-4">
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#8C6B3F]">
                  Lavi Tailor · Curated Looks
                </p>
                <h1 className="heading-font text-[26px] md:text-[30px] leading-snug text-[#1B4332]">
                  Bộ sưu tập may đo của My Hiền Tailor
                  <span className="block text-[#111827]">
                    áo dài · vest · đầm chuẩn dáng & đúng dịp của bạn
                  </span>
                </h1>
                <p className="text-[13px] md:text-[14px] text-[#4B5563] max-w-xl">
                  Bộ lọc được thiết kế như một stylist cá nhân – giúp bạn thu
                  hẹp lựa chọn theo dịp, dòng sản phẩm và ngân sách, nhưng vẫn
                  giữ lại cảm giác khám phá một lookbook cao cấp.
                </p>

                <div className="mt-4 rounded-2xl bg-white/80 border border-[#E4D8C3] px-4 py-3 text-[12px] text-[#374151] shadow-sm">
                  <p className="font-medium text-[#1B4332] mb-1">
                    Gợi ý hiện tại:
                  </p>
                  <p>{getFilterSummary()}</p>
                </div>
              </div>

              {/* RIGHT: FILTER CARD NỀN SÁNG */}
              <div className="relative">
                <div className="h-full w-full rounded-[24px] bg-white/92 backdrop-blur border border-[#E4D8C3] px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3 shadow-[0_10px_30px_rgba(148,114,80,0.18)]">
                  <div>
                    <p className="text-[11px] tracking-[0.25em] uppercase text-[#9CA3AF]">
                      Bộ lọc theo nhu cầu
                    </p>
                    <p className="heading-font text-[17px] mt-1 text-[#111827]">
                      Cho Lavi biết bạn đang chuẩn bị điều gì.
                    </p>
                  </div>

                  {/* Need */}
                  <FilterGroup title="Dịp sử dụng">
                    <FilterChip
                      active={needFilter === "all"}
                      onClick={() => setNeedFilter("all")}
                    >
                      🌿 Tất cả
                    </FilterChip>
                    <FilterChip
                      active={needFilter === "wedding"}
                      onClick={() => setNeedFilter("wedding")}
                    >
                      💍 Cưới hỏi
                    </FilterChip>
                    <FilterChip
                      active={needFilter === "office"}
                      onClick={() => setNeedFilter("office")}
                    >
                      💼 Đi làm
                    </FilterChip>
                    <FilterChip
                      active={needFilter === "party"}
                      onClick={() => setNeedFilter("party")}
                    >
                      🎉 Tiệc / sân khấu
                    </FilterChip>
                    <FilterChip
                      active={needFilter === "daily"}
                      onClick={() => setNeedFilter("daily")}
                    >
                      ☕ Hằng ngày
                    </FilterChip>
                  </FilterGroup>

                  {/* Category */}
                  <FilterGroup title="Dòng sản phẩm">
                    <FilterChip
                      active={categoryFilter === "all"}
                      onClick={() => setCategoryFilter("all")}
                    >
                      Tất cả
                    </FilterChip>
                    <FilterChip
                      active={categoryFilter === "ao-dai"}
                      onClick={() => setCategoryFilter("ao-dai")}
                    >
                      Áo dài
                    </FilterChip>
                    <FilterChip
                      active={categoryFilter === "vest"}
                      onClick={() => setCategoryFilter("vest")}
                    >
                      Vest / suit
                    </FilterChip>
                    <FilterChip
                      active={categoryFilter === "dam"}
                      onClick={() => setCategoryFilter("dam")}
                    >
                      Đầm, váy
                    </FilterChip>
                    <FilterChip
                      active={categoryFilter === "everyday"}
                      onClick={() => setCategoryFilter("everyday")}
                    >
                      Everyday set
                    </FilterChip>
                  </FilterGroup>

                  {/* Budget */}
                  <FilterGroup title="Ngân sách mỗi bộ đồ">
                    <FilterChip
                      active={budgetFilter === "all"}
                      onClick={() => setBudgetFilter("all")}
                    >
                      Linh hoạt
                    </FilterChip>
                    <FilterChip
                      active={budgetFilter === "low"}
                      onClick={() => setBudgetFilter("low")}
                    >
                      Dưới ~2 triệu
                    </FilterChip>
                    <FilterChip
                      active={budgetFilter === "mid"}
                      onClick={() => setBudgetFilter("mid")}
                    >
                      2–3.5 triệu
                    </FilterChip>
                    <FilterChip
                      active={budgetFilter === "high"}
                      onClick={() => setBudgetFilter("high")}
                    >
                      Cao cấp hơn
                    </FilterChip>
                  </FilterGroup>

                  {/* Search */}
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] text-[#9CA3AF]">
                      Hoặc gõ nhanh tên / mô tả:
                    </p>
                    <div className="flex items-center gap-2 bg-[#F8F4EC] rounded-full px-3 border border-[#E4D8C3]">
                      <span className="text-xs">🔍</span>
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ví dụ: áo dài lụa, vest nâu, đầm satin…"
                        className="flex-1 bg-transparent outline-none border-0 text-[12px] placeholder:text-[#9CA3AF] py-1.5 text-[#111827]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KẾT QUẢ */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6B7280] mt-1">
            <span>
              {totalPages > 1 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {filteredProducts.length}
                  </span>{" "}
                  thiết kế (Trang {currentPage}/{totalPages})
                </>
              ) : (
                <>
                  Tìm thấy{" "}
                  <span className="font-semibold text-[#1B4332]">
                    {filteredProducts.length}
                  </span>{" "}
                  thiết kế phù hợp với tiêu chí hiện tại.
                </>
              )}
            </span>
            <span className="hidden md:inline">
              Tip: thử đổi dịp hoặc ngân sách để xem thêm những form gợi ý mới.
            </span>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div>
              <p className="mt-4 text-[#6B7280]">Đang tải sản phẩm...</p>
            </div>
          )}

          {/* ERROR STATE */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadBackendData}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* GRID SẢN PHẨM */}
          {!loading && (
          <section id="products-grid-section" className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {paginatedProducts.map((product, index) => {
              const productKey = getProductKey(product) || `p-${index}`;
              const isFavorite = !!favoriteLookup[productKey];

              return (
                <article
                  key={productKey}
                  className="group cursor-pointer rounded-[26px] bg-[#FDFBF7] border border-[#E4D8C3] shadow-[0_10px_30px_rgba(148,114,80,0.14)] hover:shadow-[0_18px_40px_rgba(148,114,80,0.3)] transition-shadow overflow-hidden flex flex-col"
                  onClick={() => handleCardClick(product, index)}
                >
                {/* IMAGE */}
                  <div className="relative h-56 md:h-60 w-full overflow-hidden">
                  <img
                    src={product.image || FALLBACK_PRODUCT_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

                  {product.type === "newArrival" && (
                    <div className="absolute top-3 left-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black shadow-sm">
                      New Season
                    </div>
                  )}

                  <div className="absolute top-3 left-3 mt-8 rounded-full bg-white/86 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#374151] border border-[#E5E7EB]/80 shadow-sm">
                    {product.type === "collection" ? "Signature" : "Limited"}
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => handleFavoriteToggle(e, product, productKey)}
                      aria-pressed={isFavorite}
                      title={
                        isFavorite
                          ? "Bỏ khỏi danh sách yêu thích"
                          : "Thêm vào danh sách yêu thích"
                      }
                      className={`w-9 h-9 rounded-full border flex items-center justify-center text-[15px] shadow-sm backdrop-blur-sm transition-all duration-200 ${
                        isFavorite
                          ? "bg-rose-50/95 text-rose-600 border-rose-200 scale-105"
                          : "bg-white/85 text-[#111827] border-white/80 hover:bg-white hover:scale-105"
                      }`}
                    >
                      <span className="translate-y-[0.5px]">
                        {isFavorite ? "❤" : "♡"}
                      </span>
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#E5E7EB]/90">
                      {product.tag}
                    </p>
                    <p className="heading-font text-[15px] leading-tight">
                      {product.name}
                    </p>
                  </div>
                </div>

                {/* BODY */}
                <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
                  <p className="text-[12px] text-[#6B7280] flex-1 mb-3 line-clamp-3">
                    {product.desc || product.description}
                  </p>

                  <div className="border-t border-[#E5D9C6] pt-3 flex items-center justify-between mb-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#9CA3AF]">
                        Giá tham khảo
                      </p>
                      <p className="text-[14px] font-semibold text-[#1B4332]">
                        {product.price}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">
                      {product.occasion === "wedding"
                        ? "Cho ngày trọng đại"
                        : product.occasion === "office"
                        ? "Phù hợp đi làm"
                        : product.occasion === "party"
                        ? "Dành cho tiệc & sân khấu"
                        : "Thoải mái mỗi ngày"}
                    </span>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/3d-preview/${productKey}`);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2.5 text-[11px] font-medium text-white shadow-sm hover:from-blue-600 hover:to-purple-600 hover:shadow-md transition-all duration-300"
                      title="Xem trước 3D"
                    >
                      <span>🎨</span>
                      <span>3D</span>
                    </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(product, index);
                    }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1B4332] px-4 py-2.5 text-[12px] font-medium text-white shadow-sm hover:bg-[#133021] hover:shadow-md transition-all duration-300 group/btn"
                  >
                    <span>👁️</span>
                      <span>Chi tiết</span>
                    <span className="opacity-0 translate-x-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                      →
                    </span>
                  </button>
                  </div>
                </div>
                </article>
              );
            })}
          </section>
          )}

          {/* PHÂN TRANG */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Hiển thị trang đầu, cuối, trang hiện tại và các trang xung quanh
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full text-[13px] font-medium transition-all ${
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
                      <span key={page} className="text-[#9CA3AF] px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
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

/* ====== SUB COMPONENTS – FILTER CARD SÁNG ====== */

function FilterGroup({ title, children }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] text-[#6B7280] mb-1">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] border transition-colors ${
        active
          ? "bg-[#1B4332] text-white border-[#1B4332] shadow-sm"
          : "bg-[#F8F4EC] text-[#374151] border-[#E4D8C3] hover:border-[#1B4332]"
      }`}
    >
      {children}
    </button>
  );
}

export default ProductsPage;
