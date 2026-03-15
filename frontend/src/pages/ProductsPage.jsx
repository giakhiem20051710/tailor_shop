import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import Header from "../components/Header.jsx";
import ProductSchema from "../components/schema/ProductSchema.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { getStyles as getAdminStyles } from "../utils/styleStorage.js";
import {
  productConfigurationService,
  imageAssetService,
  productService,
  favoriteService,
  authService,
} from "../services/index.js";

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

import QuickViewModal from "../components/QuickViewModal.jsx";

import StylistChatbot from "../components/StylistChatbot.jsx";

const ProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useRef(true);

  const [favoriteLookup, setFavoriteLookup] = useState({});
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);

  // State cho data từ backend
  const [templates, setTemplates] = useState([]);
  const [imageAssets, setImageAssets] = useState([]);
  const [backendProductsList, setBackendProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick View & Chatbot State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Load data từ backend
  useEffect(() => {
    loadBackendData();
    loadFavoriteProducts();
  }, []);

  // Load favorite products from API
  const loadFavoriteProducts = async () => {
    if (!authService.isAuthenticated?.()) {
      setFavoriteProductIds([]);
      setFavoriteLookup({});
      return;
    }

    try {
      const response = await favoriteService.listByType("PRODUCT", { page: 0, size: 200 });
      const data = response?.responseData ?? response?.data?.responseData ?? response?.data ?? response;
      const items = data?.content ?? data?.data ?? [];
      const ids = Array.isArray(items) ? items.map(f => f.itemId).filter(id => id != null) : [];
      setFavoriteProductIds(ids);

      // Build lookup map from product keys
      const lookup = {};
      items.forEach(item => {
        if (item.itemKey) {
          lookup[item.itemKey] = true;
        }
      });
      setFavoriteLookup(lookup);
    } catch (error) {
      console.error("Error loading favorite products:", error);
      setFavoriteProductIds([]);
      setFavoriteLookup({});
    }
  };

  const loadBackendData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load image assets làm PRIMARY data source (239 dòng trong DB)
      try {
        const imagesResponse = await imageAssetService.filter({
          page: 0,
          size: 500, // Tăng size để load hết 239 dòng
        });
        const imagesData = imageAssetService.parseResponse(imagesResponse);
        const imagesList = imagesData?.content || imagesData?.data || (Array.isArray(imagesData) ? imagesData : []);
        setImageAssets(imagesList);
        console.log('✅ Loaded image assets (PRIMARY):', imagesList.length);

        if (imagesList.length > 0) {
          console.log('📋 Sample image asset:', {
            id: imagesList[0].id,
            url: imagesList[0].url?.substring(0, 50),
            category: imagesList[0].category,
            type: imagesList[0].type,
            gender: imagesList[0].gender,
          });
        }
      } catch (imagesErr) {
        console.error('❌ Could not load image assets:', imagesErr);
        setError('Không thể tải dữ liệu sản phẩm từ server');
      }

      // Load products từ API /api/v1/products (optional, for additional data)
      try {
        const productsResponse = await productService.list({}, { page: 0, size: 500 });
        const productsData = productService.parseResponse(productsResponse);
        const productsList = productsData?.content || productsData?.data || (Array.isArray(productsData) ? productsData : []);
        setBackendProductsList(productsList);
        console.log('✅ Loaded products (secondary):', productsList.length);
      } catch (productsErr) {
        console.warn('⚠️ Could not load products API (optional):', productsErr);
      }
    } catch (err) {
      console.error('❌ Error loading backend data:', err);
      setError(err.message || 'Không thể tải dữ liệu từ server');
    } finally {
      setLoading(false);
    }
  };

  // Scroll Restore Effect
  useEffect(() => {
    if (!loading && imageAssets.length > 0) {
      const savedScroll = sessionStorage.getItem("scrollPosition_products");
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'auto' });
        }, 100);
      }
    }
  }, [loading, imageAssets.length]);

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

  // Map imageAssets trực tiếp thành products (dùng AI fields)
  const backendProducts = useMemo(() => {
    if (!imageAssets || imageAssets.length === 0) return [];

    return imageAssets.map((asset, index) => {
      // Map type từ backend sang frontend category
      const typeToCategory = {
        // Áo dài
        "ao_dai": "ao-dai",
        "ao_dai_cuoi": "ao-dai",
        "ao_dai_tet": "ao-dai",
        "ao_dai_hoc_sinh": "ao-dai",
        "ao_dai_cach_tan": "ao-dai",
        // Vest / Suit
        "vest": "vest",
        "bo_vest": "vest",
        "blazer": "vest",
        "blazer_oversize": "vest",
        "blazer_crop": "vest",
        "pantsuit": "vest",
        // Đầm / Váy
        "vay_dam": "dam",
        "dam_da_hoi": "dam",
        "dam_cocktail": "dam",
        "dam_cuoi": "dam",
        "dam_phu_dau": "dam",
        "dam_du_tiec": "dam",
        "dam_cong_so": "dam",
        "dam_maxi": "dam",
        "dam_midi": "dam",
        "dam_mini": "dam",
        "dam_wrap": "dam",
        "dam_slip": "dam",
        "chan_vay": "dam",
        "vay_a": "dam",
        "vay_xoe": "dam",
        "vay_midi": "dam",
        "vay_maxi": "dam",
        // Default: everyday
      };
      const frontendCategory = typeToCategory[asset.type] || "everyday";

      // Map occasion từ AI sang frontend filter
      const occasionMap = {
        "wedding": "wedding",
        "work": "office",
        "party": "party",
        "formal": "party",
        "daily": "daily",
        "casual": "daily",
        "date": "party",
        "photoshoot": "party",
      };
      const occasion = occasionMap[asset.occasion] || "daily";

      // Tạo label type dựa vào fashionCategories (nếu cần)
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
      const typeLabel = typeLabels[asset.type] || asset.type?.replace(/_/g, " ") || "Sản phẩm";

      return {
        key: `image-${asset.id}`,
        name: typeLabel,
        desc: asset.description || "Sản phẩm may đo chất lượng cao",
        price: "Liên hệ", // ImageAsset không có price
        tag: typeLabel,
        image: asset.url || asset.thumbnailUrl || FALLBACK_PRODUCT_IMAGE,
        thumbnailUrl: asset.thumbnailUrl,
        largeUrl: asset.largeUrl,
        occasion: occasion,
        category: frontendCategory,
        budget: "mid", // Default budget
        type: "collection",
        // Thông tin AI
        imageAssetId: asset.id,
        aiType: asset.type,
        aiOccasion: asset.occasion,
        aiSeason: asset.season,
        styleCategory: asset.styleCategory,
        silhouette: asset.silhouette,
        lengthInfo: asset.lengthInfo,
        materials: asset.materials,
        colors: asset.colors,
        occasions: asset.occasions,
        customerStyles: asset.customerStyles,
        accessories: asset.accessories,
        tailoringTime: asset.tailoringTime,
        fittingCount: asset.fittingCount,
        warranty: asset.warranty,
        lining: asset.lining,
        careInstructions: asset.careInstructions,
        confidence: asset.confidence,
        gender: asset.gender,
        tags: asset.tags,
      };
    });
  }, [imageAssets]);

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

  // ƯU TIÊN image_assets (239 dòng trong DB), fallback sang products API
  const allProducts = useMemo(() => {
    // Nếu có image_assets, dùng backendProducts (từ image_assets)
    if (backendProducts && backendProducts.length > 0) {
      console.log('📦 Using image_assets (PRIMARY):', backendProducts.length);
      return backendProducts;
    }

    // Fallback: dùng products API nếu không có image_assets
    if (mappedBackendProducts && mappedBackendProducts.length > 0) {
      console.log('📦 Fallback to products API:', mappedBackendProducts.length);
      return mappedBackendProducts;
    }

    return [];
  }, [backendProducts, mappedBackendProducts]);

  // ====== FILTER STATE ======
  // ====== FILTER STATE (Synced with URL) ======
  const [needFilter, setNeedFilter] = useState(() => searchParams.get("occasion") || "all");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get("category") || "all");
  const [budgetFilter, setBudgetFilter] = useState(() => searchParams.get("budget") || "all");
  const [genderFilter, setGenderFilter] = useState(() => searchParams.get("gender") || "all");
  const [seasonFilter, setSeasonFilter] = useState(() => searchParams.get("season") || "all");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get("page") || "1", 10));

  // Sync URL -> state so searching from header works even when already on /products
  useEffect(() => {
    const nextNeedFilter = searchParams.get("occasion") || "all";
    const nextCategoryFilter = searchParams.get("category") || "all";
    const nextBudgetFilter = searchParams.get("budget") || "all";
    const nextGenderFilter = searchParams.get("gender") || "all";
    const nextSeasonFilter = searchParams.get("season") || "all";
    const nextSearch = searchParams.get("search") || "";
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    setNeedFilter((prev) => (prev === nextNeedFilter ? prev : nextNeedFilter));
    setCategoryFilter((prev) => (prev === nextCategoryFilter ? prev : nextCategoryFilter));
    setBudgetFilter((prev) => (prev === nextBudgetFilter ? prev : nextBudgetFilter));
    setGenderFilter((prev) => (prev === nextGenderFilter ? prev : nextGenderFilter));
    setSeasonFilter((prev) => (prev === nextSeasonFilter ? prev : nextSeasonFilter));
    setSearch((prev) => (prev === nextSearch ? prev : nextSearch));
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [searchParams]);

  // Sync State -> URL
  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    const params = {};
    if (needFilter !== "all") params.occasion = needFilter;
    if (categoryFilter !== "all") params.category = categoryFilter;
    if (budgetFilter !== "all") params.budget = budgetFilter;
    if (genderFilter !== "all") params.gender = genderFilter;
    if (seasonFilter !== "all") params.season = seasonFilter;
    if (search) params.search = search;
    if (currentPage > 1) params.page = currentPage.toString();
    const nextQueryString = new URLSearchParams(params).toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      setSearchParams(params, { replace: true });
    }
  }, [
    needFilter,
    categoryFilter,
    budgetFilter,
    genderFilter,
    seasonFilter,
    search,
    currentPage,
    searchParams,
    setSearchParams,
  ]);

  const itemsPerPage = 20;

  // ====== UI STATE ======
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Mobile Filter Drawer State

  // Lock body scroll when filter drawer is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterOpen]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (needFilter !== "all" && p.occasion !== needFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (budgetFilter !== "all" && p.budget !== budgetFilter) return false;

      // Gender filter
      if (genderFilter !== "all") {
        const productGender = (p.gender || "").toLowerCase();
        if (productGender !== genderFilter) return false;
      }

      // Season filter
      if (seasonFilter !== "all") {
        const productSeason = (p.season || "").toLowerCase();
        if (seasonFilter === "spring-summer" && !productSeason.includes("spring") && !productSeason.includes("summer")) return false;
        if (seasonFilter === "fall-winter" && !productSeason.includes("fall") && !productSeason.includes("winter") && !productSeason.includes("autumn")) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        // Handle materials/colors as potential arrays
        const materialsStr = Array.isArray(p.materials) ? p.materials.join(" ") : (p.materials || "");
        const colorsStr = Array.isArray(p.colors) ? p.colors.join(" ") : (p.colors || "");
        const text =
          (p.name || "").toLowerCase() +
          " " +
          (p.desc || p.description || "").toLowerCase() +
          " " +
          (p.tag || "").toLowerCase() +
          " " +
          materialsStr.toLowerCase() +
          " " +
          colorsStr.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allProducts, needFilter, categoryFilter, budgetFilter, genderFilter, seasonFilter, search]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    if (isFirstRender.current) return;
    setCurrentPage(1);
  }, [needFilter, categoryFilter, budgetFilter, genderFilter, seasonFilter, search]);

  // Scroll đến phần grid sản phẩm khi chuyển trang
  useEffect(() => {
    if (isFirstRender.current) return;
    const productsSection = document.getElementById("products-grid-section");
    if (productsSection) {
      const headerHeight = 190; // Chiều cao header
      const targetPosition = productsSection.offsetTop - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  }, [currentPage]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleFavoriteToggle = async (event, product, productKey) => {
    event.stopPropagation();
    if (!productKey) return;

    const isLoggedIn = authService.isAuthenticated?.();
    if (!isLoggedIn) {
      // Show error or redirect to login
      return;
    }

    // Try to get itemId from various possible fields
    const itemId = product?.id ?? product?.productId ?? product?.templateId ?? null;

    // Debug: log product structure
    if (!itemId) {
      console.log("[ProductsPage] Product structure:", product);
      console.log("[ProductsPage] Available fields:", Object.keys(product || {}));
    }

    // If no itemId, cannot add to favorites (backend requires it)
    if (!itemId && !isFavorite) {
      console.warn("[ProductsPage] Cannot add favorite: product has no ID", product);
      // Could show error message to user here
      return;
    }

    const isFavorite = favoriteLookup[productKey] || (itemId && favoriteProductIds.includes(itemId));

    // Optimistic update for instant UI feedback
    const newLookup = { ...favoriteLookup };
    const newIds = [...favoriteProductIds];

    if (isFavorite) {
      delete newLookup[productKey];
      if (itemId) {
        const index = newIds.indexOf(itemId);
        if (index > -1) newIds.splice(index, 1);
      }
    } else {
      newLookup[productKey] = true;
      if (itemId && !newIds.includes(itemId)) {
        newIds.push(itemId);
      }
    }

    setFavoriteLookup(newLookup);
    setFavoriteProductIds(newIds);

    // Sync with backend
    try {
      if (isFavorite) {
        // Remove from favorites
        console.log("[ProductsPage] Removing favorite:", { itemId, productKey });
        if (itemId) {
          await favoriteService.remove("PRODUCT", itemId);
        } else {
          await favoriteService.removeByKey(productKey);
        }
        console.log("[ProductsPage] Successfully removed favorite");
      } else {
        // Add to favorites - itemId is required by backend
        if (!itemId) {
          console.error("[ProductsPage] Cannot add favorite: itemId is required but not found", product);
          // Revert optimistic update
          setFavoriteLookup(favoriteLookup);
          setFavoriteProductIds(favoriteProductIds);
          return;
        }

        const favoriteData = {
          itemType: "PRODUCT",
          itemId: itemId,
          itemKey: productKey,
        };
        console.log("[ProductsPage] Adding favorite:", favoriteData);
        const response = await favoriteService.add(favoriteData);
        console.log("[ProductsPage] Add favorite response:", response);
      }

      // Reload favorites to sync with backend
      loadFavoriteProducts();
    } catch (err) {
      console.error("[ProductsPage] Failed to sync favorite with backend:", err);
      console.error("[ProductsPage] Error details:", {
        message: err?.message,
        status: err?.status,
        response: err?.response,
        data: err?.data
      });
      // Revert optimistic update on error
      setFavoriteLookup(favoriteLookup);
      setFavoriteProductIds(favoriteProductIds);
    }
  };

  const handleCardClick = (product, index) => {
    sessionStorage.setItem("scrollPosition_products", window.scrollY.toString());
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

      {/* MOBILE FILTER BUTTON (Sticky Bottom) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="bg-[#1B4332] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium hover:bg-[#153427] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Bộ lọc ({search || (needFilter !== 'all' || categoryFilter !== 'all' || budgetFilter !== 'all' || genderFilter !== 'all' || seasonFilter !== 'all') ? '1' : '0'})
        </button>
      </div>

      {/* MOBILE FILTER DRAWER OVERLAY */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer Content */}
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-slide-right">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1B4332]">Bộ Lọc</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-8">
                {/* SEARCH */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* GENDER */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">👥 Giới tính</h3>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: 'male', label: 'Nam' }, { id: 'female', label: 'Nữ' }, { id: 'unisex', label: 'Unisex' }].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setGenderFilter(genderFilter === opt.id ? 'all' : opt.id)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${genderFilter === opt.id ? "bg-[#1B4332] text-white border-[#1B4332]" : "bg-white text-gray-600 border-gray-200"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OCCASION */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">✨ Dịp sử dụng</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'wedding', label: 'Cưới hỏi & Lễ' },
                      { id: 'office', label: 'Công sở' },
                      { id: 'party', label: 'Dự tiệc' },
                      { id: 'daily', label: 'Hằng ngày' }
                    ].map((opt) => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${needFilter === opt.id ? "bg-[#1B4332]/5 border-[#1B4332]" : "bg-white border-gray-200"
                        }`}>
                        <input
                          type="radio"
                          name="mobile_occasion"
                          checked={needFilter === opt.id}
                          onChange={() => setNeedFilter(opt.id === needFilter ? 'all' : opt.id)}
                          className="w-4 h-4 text-[#1B4332] focus:ring-[#1B4332] border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">📂 Dòng sản phẩm</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ao-dai', label: 'Áo Dài' },
                      { id: 'vest', label: 'Vest / Suit' },
                      { id: 'dam', label: 'Đầm / Váy' },
                      { id: 'everyday', label: 'Everyday' }
                    ].map((opt) => (
                      <label key={opt.id} className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-center text-sm transition-all ${categoryFilter === opt.id ? "bg-[#1B4332] text-white border-[#1B4332]" : "bg-white text-gray-600 border-gray-200"
                        }`}>
                        <input
                          type="radio"
                          name="mobile_category"
                          checked={categoryFilter === opt.id}
                          onChange={() => setCategoryFilter(opt.id === categoryFilter ? 'all' : opt.id)}
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNeedFilter('all');
                    setCategoryFilter('all');
                    setBudgetFilter('all');
                    setGenderFilter('all');
                    setSeasonFilter('all');
                    setSearch('');
                  }}
                  className="flex-1 py-3 text-gray-600 font-medium hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-[2] bg-[#1B4332] text-white py-3 rounded-lg font-bold hover:bg-[#153427] transition-all"
                >
                  Xem {filteredProducts.length} SP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="pt-[150px] md:pt-[170px] pb-16">
        <div className="w-full max-w-[98%] mx-auto px-4">

          {/* ========== COMPACT HERO BANNER ========== */}
          <div className="mb-6 relative overflow-hidden rounded-xl">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D5A47] to-[#1B4332]" />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            {/* Golden Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            {/* Content Container - More Compact */}
            <div className="relative z-10 px-5 md:px-8 py-6 md:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                {/* LEFT: Text Content */}
                <div className="flex-1 max-w-xl">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                    <span className="text-[#D4AF37] text-[9px] font-bold tracking-[0.15em] uppercase">Mỹ Hiền Tailor · Exclusive Collection</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-2xl md:text-3xl font-light text-white leading-tight mb-2">
                    Bộ sưu tập
                    <span className="block font-semibold bg-gradient-to-r from-[#D4AF37] via-[#F4E4BC] to-[#D4AF37] bg-clip-text text-transparent">
                      Thiết kế may đo
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-white/70 text-sm font-light leading-relaxed mb-4 hidden md:block">
                    Khám phá những mẫu áo dài, vest và đầm dạ hội được thiết kế tinh xảo.
                  </p>

                  {/* Stats Row */}
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xl font-light text-[#D4AF37]">{filteredProducts.length}+</p>
                      <p className="text-white/50 text-[9px] tracking-widest uppercase">Thiết kế</p>
                    </div>
                    <div>
                      <p className="text-xl font-light text-white">100%</p>
                      <p className="text-white/50 text-[9px] tracking-widest uppercase">Thủ công</p>
                    </div>
                    <div>
                      <p className="text-xl font-light text-white">15+</p>
                      <p className="text-white/50 text-[9px] tracking-widest uppercase">Năm KN</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Feature Badges - Staggered Animation & Descending Width */}
                <div className="hidden lg:flex flex-col gap-2 items-end">
                  {/* AI Stylist - Widest, appears first */}
                  <div
                    onClick={() => setIsChatbotOpen(true)}
                    className="group flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer animate-fade-in-right"
                    style={{ animationDelay: '0s', minWidth: '180px' }}
                  >
                    <span className="w-7 h-7 rounded-md bg-gradient-to-br from-[#D4AF37] to-[#B49126] flex items-center justify-center text-sm shadow-md">✨</span>
                    <span className="text-white text-sm font-medium group-hover:text-[#D4AF37] transition-colors">AI Stylist</span>
                  </div>

                  {/* Premium Fabric - Medium, appears 1s later */}
                  <div
                    className="group flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all animate-fade-in-right"
                    style={{ animationDelay: '1s', minWidth: '160px' }}
                  >
                    <span className="w-6 h-6 rounded bg-gray-800 border border-white/10 flex items-center justify-center text-xs">🧵</span>
                    <span className="text-white text-xs font-medium group-hover:text-[#D4AF37] transition-colors">Chất liệu cao cấp</span>
                  </div>

                  {/* Perfect Fit - Smallest, appears 2s later */}
                  <div
                    className="group flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all animate-fade-in-right"
                    style={{ animationDelay: '2s', minWidth: '140px' }}
                  >
                    <span className="w-5 h-5 rounded bg-gray-800 border border-white/10 flex items-center justify-center text-[10px]">✂️</span>
                    <span className="text-white text-[11px] font-medium group-hover:text-[#D4AF37] transition-colors">May đo chuẩn xác</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ========== LEFT SIDEBAR FILTERS ========== */}
            <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">

                {/* Header with Clear All */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="font-bold text-[#1B4332] text-sm uppercase tracking-wider">Bộ lọc</h2>
                  <button
                    onClick={() => {
                      setNeedFilter("all");
                      setCategoryFilter("all");
                      setBudgetFilter("all");
                      setGenderFilter("all");
                      setSeasonFilter("all");
                      setSearch("");
                    }}
                    className="text-xs text-gray-400 hover:text-[#D4AF37] transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>

                {/* Search Box */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Tìm kiếm</h3>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all pl-9"
                      placeholder="Tên, chất liệu, màu sắc..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Gender Filter - NEW */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Giới tính</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "Tất cả", icon: "👥" },
                      { id: "male", label: "Nam", icon: "👔" },
                      { id: "female", label: "Nữ", icon: "👗" },
                      { id: "unisex", label: "Unisex", icon: "✨" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setGenderFilter(opt.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${genderFilter === opt.id
                          ? "bg-[#1B4332] text-white border-[#1B4332] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#1B4332]"
                          }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion Filter */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Dịp sử dụng</h3>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: "all", label: "Tất cả", icon: "✨" },
                      { id: "wedding", label: "Cưới hỏi / Lễ", icon: "💍" },
                      { id: "office", label: "Công sở", icon: "💼" },
                      { id: "party", label: "Tiệc & Sự kiện", icon: "🥂" },
                      { id: "daily", label: "Hằng ngày", icon: "☀️" }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer group py-1">
                        <input
                          type="radio"
                          name="occasion"
                          checked={needFilter === opt.id}
                          onChange={() => setNeedFilter(opt.id)}
                          className="w-4 h-4 text-[#1B4332] focus:ring-[#1B4332] border-gray-300"
                        />
                        <span className="text-sm">{opt.icon}</span>
                        <span className={`text-sm ${needFilter === opt.id ? "text-[#1B4332] font-medium" : "text-gray-600 group-hover:text-[#1B4332]"}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Dòng sản phẩm</h3>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: "all", label: "Tất cả" },
                      { id: "ao-dai", label: "Áo dài" },
                      { id: "vest", label: "Vest & Suit" },
                      { id: "dam", label: "Đầm & Váy" },
                      { id: "everyday", label: "Everyday Wear" }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer group py-1">
                        <input
                          type="radio"
                          name="category"
                          checked={categoryFilter === opt.id}
                          onChange={() => setCategoryFilter(opt.id)}
                          className="w-4 h-4 text-[#1B4332] focus:ring-[#1B4332] border-gray-300"
                        />
                        <span className={`text-sm ${categoryFilter === opt.id ? "text-[#1B4332] font-medium" : "text-gray-600 group-hover:text-[#1B4332]"}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Season Filter - NEW */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Mùa phù hợp</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "Tất cả", icon: "🌈" },
                      { id: "spring-summer", label: "Xuân/Hè", icon: "🌸" },
                      { id: "fall-winter", label: "Thu/Đông", icon: "🍂" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSeasonFilter(opt.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${seasonFilter === opt.id
                          ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]"
                          }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Filter */}
                <div>
                  <h3 className="font-semibold text-[#1B4332] text-xs uppercase tracking-wider mb-2">Ngân sách</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "Tất cả" },
                      { id: "low", label: "< 2M" },
                      { id: "mid", label: "2M - 3.5M" },
                      { id: "high", label: "> 3.5M" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setBudgetFilter(opt.id)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-all ${budgetFilter === opt.id
                          ? "bg-[#1B4332] text-white border-[#1B4332]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#1B4332]"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(needFilter !== "all" || categoryFilter !== "all" || budgetFilter !== "all" || genderFilter !== "all" || seasonFilter !== "all" || search) && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Bộ lọc đang áp dụng:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {genderFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#1B4332]/10 text-[#1B4332] px-2 py-1 rounded">
                          {genderFilter === "male" ? "Nam" : genderFilter === "female" ? "Nữ" : "Unisex"}
                          <button onClick={() => setGenderFilter("all")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                      {needFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#1B4332]/10 text-[#1B4332] px-2 py-1 rounded">
                          {needFilter}
                          <button onClick={() => setNeedFilter("all")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                      {categoryFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#1B4332]/10 text-[#1B4332] px-2 py-1 rounded">
                          {categoryFilter}
                          <button onClick={() => setCategoryFilter("all")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                      {seasonFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded">
                          {seasonFilter === "spring-summer" ? "Xuân/Hè" : "Thu/Đông"}
                          <button onClick={() => setSeasonFilter("all")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                      {budgetFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#1B4332]/10 text-[#1B4332] px-2 py-1 rounded">
                          {budgetFilter === "low" ? "< 2M" : budgetFilter === "mid" ? "2M-3.5M" : "> 3.5M"}
                          <button onClick={() => setBudgetFilter("all")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                      {search && (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          "{search}"
                          <button onClick={() => setSearch("")} className="hover:text-red-500">×</button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT MAIN GRID */}
            <main className="flex-1 w-full">

              {/* Results Summary & Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">
                  Hiển thị <span className="font-bold text-[#1B4332]">{filteredProducts.length}</span> kết quả
                  {search && <span> cho từ khóa "<span className="font-medium text-black">{search}</span>"</span>}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sắp xếp:</span>
                  <select className="text-sm border-none bg-transparent font-medium text-[#1B4332] focus:ring-0 cursor-pointer">
                    <option>Mới nhất</option>
                    <option>Giá thấp đến cao</option>
                    <option>Giá cao đến thấp</option>
                  </select>
                </div>
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
                <section id="products-grid-section" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedProducts.map((product, index) => {
                    const productKey = getProductKey(product) || `p-${index}`;
                    const productId = product?.id ?? product?.productId ?? product?.templateId;
                    const isFavorite = !!favoriteLookup[productKey] ||
                      (productId && favoriteProductIds.includes(productId));

                    // Các trường hiển thị cho style mới (Minimalist Catalogue)
                    const displayCategory = product.styleCategory || product.category || "Template";
                    const displayType = product.name || product.type || "Unknown";
                    const displayGender = product.gender ? (product.gender === "male" ? "Male" : product.gender === "female" ? "Female" : "Unisex") : "Unisex";
                    // Tags: ưu tiên tags array, fallback tag string
                    const displayTags = Array.isArray(product.tags) ? product.tags.join(", ") : (product.tag || "");

                    return (
                      <article
                        key={productKey}
                        className="group relative flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 hover:shadow-md transition-all duration-300"
                      >
                        {/* Checkbox (Mock UI) */}


                        {/* IMAGE AREA */}
                        <div
                          className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden cursor-pointer"
                          onClick={() => handleCardClick(product, index)}
                        >
                          <img
                            src={product.image || FALLBACK_PRODUCT_IMAGE}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            onError={handleImageError}
                          />

                          {/* Favorite Button (Minimal) */}
                          <button
                            onClick={(e) => handleFavoriteToggle(e, product, productKey)}
                            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${isFavorite
                              ? "bg-rose-50/90 text-rose-500"
                              : "bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900"
                              }`}
                            title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                          >
                            <span className="text-[14px] leading-none block">
                              {isFavorite ? "❤" : "♡"}
                            </span>
                          </button>

                          {/* Hover Overlay: "View Detail" hint */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                          {/* Quick View Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewProduct(product);
                            }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-white/90 backdrop-blur-sm text-[#1B4332] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded shadow-lg hover:bg-[#1B4332] hover:text-white z-20 flex items-center gap-2 whitespace-nowrap"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Xem nhanh
                          </button>
                        </div>

                        {/* INFO AREA - Premium Brand Style */}
                        <div
                          className="p-4 cursor-pointer bg-white"
                          onClick={() => handleCardClick(product, index)}
                        >
                          {/* Category Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider">
                              {displayCategory}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {displayGender === "Male" ? "Nam" : displayGender === "Female" ? "Nữ" : "Unisex"}
                            </span>
                          </div>

                          {/* Product Name */}
                          <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#1B4332] transition-colors mb-2">
                            {displayType}
                          </h3>

                          {/* Tags as subtle text */}
                          {displayTags && (
                            <p className="text-[10px] text-gray-400 truncate" title={displayTags}>
                              {displayTags}
                            </p>
                          )}

                          {/* Price Row */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm font-semibold text-[#1B4332]">
                              {product.price || "Liên hệ báo giá"}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              May đo
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </main>
          </div>

          {/* PHÂN TRANG */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${currentPage === 1
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
                        className={`w-10 h-10 rounded-full text-[13px] font-medium transition-all ${currentPage === page
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
      </div>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* AI STYLIST CHATBOT */}
      <StylistChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        products={filteredProducts.length > 0 ? filteredProducts : allProducts}
      />

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
      className={`px-3 py-1.5 rounded-full text-[11px] border transition-colors ${active
        ? "bg-[#1B4332] text-white border-[#1B4332] shadow-sm"
        : "bg-[#F8F4EC] text-[#374151] border-[#E4D8C3] hover:border-[#1B4332]"
        }`}
    >
      {children}
    </button>
  );
}

export default ProductsPage;
