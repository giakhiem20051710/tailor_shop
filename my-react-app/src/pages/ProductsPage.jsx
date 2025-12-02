import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../utils/favoriteStorage.js";

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

const femaleFashionImages = {
  aoDaiRed:
    "https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=1200",
  aoDaiWhite:
    "https://images.pexels.com/photos/2567372/pexels-photo-2567372.jpeg?auto=compress&cs=tinysrgb&w=1200",
  aoDaiPastel:
    "https://images.pexels.com/photos/229690/pexels-photo-229690.jpeg?auto=compress&cs=tinysrgb&w=1200",
  aoDaiNavy:
    "https://images.pexels.com/photos/6311683/pexels-photo-6311683.jpeg?auto=compress&cs=tinysrgb&w=1200",
  glamRed:
    "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=1200",
  glamPink:
    "https://images.pexels.com/photos/1906810/pexels-photo-1906810.jpeg?auto=compress&cs=tinysrgb&w=1200",
  glamGold:
    "https://images.pexels.com/photos/6311679/pexels-photo-6311679.jpeg?auto=compress&cs=tinysrgb&w=1200",
  emeraldDress:
    "https://images.pexels.com/photos/6311677/pexels-photo-6311677.jpeg?auto=compress&cs=tinysrgb&w=1200",
  lavenderDress:
    "https://images.pexels.com/photos/6311678/pexels-photo-6311678.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pastelGreen:
    "https://images.pexels.com/photos/6311673/pexels-photo-6311673.jpeg?auto=compress&cs=tinysrgb&w=1200",
  modernVest:
    "https://images.pexels.com/photos/6311697/pexels-photo-6311697.jpeg?auto=compress&cs=tinysrgb&w=1200",
  whiteSuit:
    "https://images.pexels.com/photos/6311702/pexels-photo-6311702.jpeg?auto=compress&cs=tinysrgb&w=1200",
  officeDenim:
    "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=1200",
  denimJacket:
    "https://images.pexels.com/photos/2983463/pexels-photo-2983463.jpeg?auto=compress&cs=tinysrgb&w=1200",
  tailorStudio:
    "https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=1200",
  beigeSuit:
    "https://images.pexels.com/photos/6311696/pexels-photo-6311696.jpeg?auto=compress&cs=tinysrgb&w=1200",
  showroomRack:
    "https://images.pexels.com/photos/6311671/pexels-photo-6311671.jpeg?auto=compress&cs=tinysrgb&w=1200",
  casualSet:
    "https://images.pexels.com/photos/6311668/pexels-photo-6311668.jpeg?auto=compress&cs=tinysrgb&w=1200",
  whiteShirt:
    "https://images.pexels.com/photos/6311669/pexels-photo-6311669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  blackPants:
    "https://images.pexels.com/photos/6311665/pexels-photo-6311665.jpeg?auto=compress&cs=tinysrgb&w=1200",
  midiSkirt:
    "https://images.pexels.com/photos/6311672/pexels-photo-6311672.jpeg?auto=compress&cs=tinysrgb&w=1200",
  lightJacket:
    "https://images.pexels.com/photos/6311660/pexels-photo-6311660.jpeg?auto=compress&cs=tinysrgb&w=1200",
  casualRack:
    "https://images.pexels.com/photos/6311670/pexels-photo-6311670.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

const FALLBACK_PRODUCT_IMAGE = femaleFashionImages.aoDaiRed;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [favoriteLookup, setFavoriteLookup] = useState(() =>
    buildFavoriteLookup()
  );

  // ====== DATA GỐC ======
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
  };

  const collections = [
    {
      key: "wedding",
      name: "Wedding Collection",
      description: "Áo dài & vest cưới tối giản, dễ chụp hình, dễ di chuyển.",
      image: femaleFashionImages.aoDaiRed,
      price: "Từ 2.500.000 ₫",
      tag: "Cưới hỏi",
      occasion: "wedding",
      category: "ao-dai",
      budget: "mid",
      type: "collection",
    },
    {
      key: "office",
      name: "Office Edit",
      description: "Vest công sở & sơ mi may đo cho người đi làm mỗi ngày.",
      image: femaleFashionImages.modernVest,
      price: "Từ 1.800.000 ₫",
      tag: "Công sở",
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "collection",
    },
    {
      key: "evening",
      name: "Evening Line",
      description: "Đầm dạ hội, váy tiệc nhẹ nhàng nhưng vẫn nổi bật.",
      image: femaleFashionImages.glamGold,
      price: "Từ 3.200.000 ₫",
      tag: "Dạ hội",
      occasion: "party",
      category: "dam",
      budget: "high",
      type: "collection",
    },
    {
      key: "daily",
      name: "Everyday Fit",
      description: "Quần, váy, áo may đo mặc hằng ngày – ít nhăn, dễ phối.",
      image: femaleFashionImages.casualSet,
      price: "Từ 800.000 ₫",
      tag: "Hằng ngày",
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "collection",
    },
  ];

  const newArrivals = [
    {
      key: "ao-dai-lua-kem",
      name: "Áo dài lụa tông kem",
      desc: "Form suông nhẹ, tay lửng, hợp chụp ảnh cưới & lễ hỏi.",
      price: "2.750.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.aoDaiPastel,
      occasion: "wedding",
      category: "ao-dai",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "vest-nau-cafe",
      name: "Vest nâu café slim-fit",
      desc: "Vest 2 khuy, màu nâu trầm, hợp anh gầy hoặc trung bình.",
      price: "3.150.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.whiteSuit,
      occasion: "office",
      category: "vest",
      budget: "high",
      type: "newArrival",
    },
    {
      key: "dam-satin-co-vuong",
      name: "Đầm satin cổ vuông",
      desc: "Dáng midi, tôn vai & cổ, hợp đi tiệc hoặc dạ hội nhẹ.",
      price: "2.280.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.glamRed,
      occasion: "party",
      category: "dam",
      budget: "mid",
      type: "newArrival",
    },
  ];

  // Thêm 100 sản phẩm với hình ảnh thật
  const additionalProducts = [
    // Áo dài - Wedding
    {
      key: "ao-dai-do-truyen-thong",
      name: "Áo dài đỏ truyền thống",
      desc: "Áo dài đỏ cổ điển, form chuẩn, phù hợp lễ cưới truyền thống.",
      price: "3.200.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.aoDaiRed,
      occasion: "wedding",
      category: "ao-dai",
      budget: "high",
      type: "collection",
    },
    {
      key: "ao-dai-trang-hien-dai",
      name: "Áo dài trắng hiện đại",
      desc: "Thiết kế tối giản, form suông, hợp chụp ảnh cưới ngoài trời.",
      price: "2.800.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.aoDaiWhite,
      occasion: "wedding",
      category: "ao-dai",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "ao-dai-xanh-navy",
      name: "Áo dài xanh navy",
      desc: "Màu xanh navy sang trọng, form ôm nhẹ, tôn dáng.",
      price: "2.950.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.aoDaiNavy,
      occasion: "wedding",
      category: "ao-dai",
      budget: "mid",
      type: "collection",
    },
    {
      key: "ao-dai-hong-pastel",
      name: "Áo dài hồng pastel",
      desc: "Màu hồng pastel nhẹ nhàng, form suông, hợp lễ hỏi.",
      price: "2.600.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.aoDaiPastel,
      occasion: "wedding",
      category: "ao-dai",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "ao-dai-vang-ong",
      name: "Áo dài vàng ống",
      desc: "Màu vàng ống truyền thống, form chuẩn, sang trọng.",
      price: "3.100.000 ₫",
      tag: "Áo dài",
      image: femaleFashionImages.glamGold,
      occasion: "wedding",
      category: "ao-dai",
      budget: "high",
      type: "collection",
    },
    // Vest - Office
    {
      key: "vest-xam-chuot",
      name: "Vest xám chuột",
      desc: "Vest xám chuột 2 khuy, form slim-fit, chuyên nghiệp.",
      price: "2.400.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.modernVest,
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "collection",
    },
    {
      key: "vest-den-kinh-dien",
      name: "Vest đen kinh điển",
      desc: "Vest đen 2 khuy, form classic, phù hợp mọi dịp công sở.",
      price: "2.500.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.tailorStudio,
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "collection",
    },
    {
      key: "vest-xanh-royal",
      name: "Vest xanh royal",
      desc: "Vest xanh royal nổi bật, form modern, tự tin trong công việc.",
      price: "2.850.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.beigeSuit,
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "vest-xanh-la-cay",
      name: "Vest xanh lá cây",
      desc: "Vest xanh lá cây độc đáo, form slim, phong cách hiện đại.",
      price: "2.700.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.officeDenim,
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "vest-kem-beige",
      name: "Vest kem beige",
      desc: "Vest màu kem beige nhẹ nhàng, form relaxed, thoải mái.",
      price: "2.350.000 ₫",
      tag: "Vest công sở",
      image: femaleFashionImages.whiteSuit,
      occasion: "office",
      category: "vest",
      budget: "mid",
      type: "collection",
    },
    // Đầm - Party
    {
      key: "dam-do-dam-hoi",
      name: "Đầm đỏ dạ hội",
      desc: "Đầm đỏ dạ hội dài, form body, nổi bật trên sân khấu.",
      price: "3.500.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.glamRed,
      occasion: "party",
      category: "dam",
      budget: "high",
      type: "collection",
    },
    {
      key: "dam-den-co-tim",
      name: "Đầm đen cổ tim",
      desc: "Đầm đen cổ tim, dáng midi, thanh lịch và quyến rũ.",
      price: "2.900.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.glamPink,
      occasion: "party",
      category: "dam",
      budget: "mid",
      type: "collection",
    },
    {
      key: "dam-xanh-ngoc",
      name: "Đầm xanh ngọc",
      desc: "Đầm xanh ngọc dáng A-line, nhẹ nhàng, hợp tiệc nhẹ.",
      price: "2.650.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.emeraldDress,
      occasion: "party",
      category: "dam",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "dam-tim-lavender",
      name: "Đầm tím lavender",
      desc: "Đầm tím lavender form suông, màu sắc dịu dàng.",
      price: "2.550.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.lavenderDress,
      occasion: "party",
      category: "dam",
      budget: "mid",
      type: "newArrival",
    },
    {
      key: "dam-hong-pha-le",
      name: "Đầm hồng pha lê",
      desc: "Đầm hồng pha lê lấp lánh, form body, sang trọng.",
      price: "3.800.000 ₫",
      tag: "Đầm tiệc",
      image: femaleFashionImages.glamGold,
      occasion: "party",
      category: "dam",
      budget: "high",
      type: "collection",
    },
    // Everyday
    {
      key: "set-quan-ao-hang-ngay",
      name: "Set quần áo hằng ngày",
      desc: "Set quần áo thoải mái, dễ phối, mặc đi làm hoặc đi chơi.",
      price: "1.200.000 ₫",
      tag: "Set đồ",
      image: femaleFashionImages.casualSet,
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "collection",
    },
    {
      key: "ao-so-mi-trang",
      name: "Áo sơ mi trắng",
      desc: "Áo sơ mi trắng form vừa, chất liệu cotton, dễ phối.",
      price: "850.000 ₫",
      tag: "Áo sơ mi",
      image: femaleFashionImages.whiteShirt,
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "newArrival",
    },
    {
      key: "quan-tay-den",
      name: "Quần tây đen",
      desc: "Quần tây đen form slim, chất liệu tốt, không nhăn.",
      price: "950.000 ₫",
      tag: "Quần tây",
      image: femaleFashionImages.blackPants,
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "collection",
    },
    {
      key: "chan-vay-den",
      name: "Chân váy đen",
      desc: "Chân váy đen dài đến gối, form A-line, dễ phối.",
      price: "780.000 ₫",
      tag: "Chân váy",
      image: femaleFashionImages.midiSkirt,
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "newArrival",
    },
    {
      key: "ao-khoac-nhe",
      name: "Áo khoác nhẹ",
      desc: "Áo khoác nhẹ form oversize, chất liệu mềm, thoải mái.",
      price: "1.100.000 ₫",
      tag: "Áo khoác",
      image: femaleFashionImages.lightJacket,
      occasion: "daily",
      category: "everyday",
      budget: "low",
      type: "collection",
    },
  ];

  // Tạo thêm sản phẩm để đủ 100 sản phẩm với hình ảnh thật theo concept nữ
  const generateMoreProducts = () => {
    const baseProducts = [...collections, ...newArrivals, ...additionalProducts];
    const moreProducts = [];
    
    const images = Object.values(femaleFashionImages);
    
    const productNames = [
      // Áo dài
      "Áo dài lụa tơ tằm", "Áo dài nhung đỏ", "Áo dài gấm vàng", "Áo dài lụa xanh",
      "Áo dài trắng tinh khôi", "Áo dài tím hoa cà", "Áo dài xanh lá", "Áo dài hồng phấn",
      "Áo dài đỏ thắm", "Áo dài vàng chanh", "Áo dài xanh dương", "Áo dài nâu đất",
      // Vest
      "Vest xám đậm", "Vest xanh navy", "Vest nâu đất", "Vest xám nhạt",
      "Vest đen classic", "Vest xanh rêu", "Vest beige", "Vest xanh mint",
      "Vest nâu cappuccino", "Vest xám bạc", "Vest xanh than", "Vest kem",
      // Đầm
      "Đầm dạ hội đỏ", "Đầm tiệc đen", "Đầm xanh ngọc", "Đầm tím lavender",
      "Đầm hồng phấn", "Đầm xanh navy", "Đầm trắng tinh khôi", "Đầm vàng chanh",
      "Đầm đỏ thắm", "Đầm xanh lá", "Đầm tím than", "Đầm beige",
      // Everyday
      "Áo sơ mi trắng", "Áo sơ mi xanh", "Quần tây đen", "Chân váy xám",
      "Set đồ công sở", "Áo khoác blazer", "Váy liền thân", "Quần ống rộng",
      "Áo thun cổ tròn", "Quần short", "Áo cardigan", "Chân váy chữ A",
    ];
    
    const descriptions = [
      "Form suông nhẹ, tay lửng, hợp chụp ảnh cưới & lễ hỏi.",
      "Vest 2 khuy, màu nâu trầm, hợp anh gầy hoặc trung bình.",
      "Dáng midi, tôn vai & cổ, hợp đi tiệc hoặc dạ hội nhẹ.",
      "Form ưu tiên sự thoải mái, ngồi lâu vẫn dễ chịu.",
      "Đường cắt tôn dáng, che nhẹ khuyết điểm ở eo / bụng.",
      "Chất vải ít nhăn, màu sắc và phom lên hình rất đẹp.",
      "Thiết kế tối giản, form chuẩn, phù hợp mọi dịp.",
      "Màu sắc sang trọng, chất liệu cao cấp, bền đẹp.",
      "Form body ôm nhẹ, tôn dáng, lên hình đẹp.",
      "Chất liệu mềm mại, thoáng mát, dễ chịu khi mặc.",
    ];
    
    const tags = ["Áo dài", "Vest công sở", "Đầm tiệc", "Set đồ", "Áo sơ mi", "Quần tây", "Chân váy", "Áo khoác"];
    const occasions = ["wedding", "office", "party", "daily"];
    const categories = ["ao-dai", "vest", "dam", "everyday"];
    const budgets = ["low", "mid", "high"];
    const types = ["collection", "newArrival"];
    const prices = [
      "1.500.000 ₫", "1.800.000 ₫", "2.000.000 ₫", "2.200.000 ₫", "2.500.000 ₫",
      "2.750.000 ₫", "3.000.000 ₫", "3.200.000 ₫", "3.500.000 ₫", "3.800.000 ₫", "4.000.000 ₫"
    ];
    
    const currentCount = baseProducts.length;
    const targetCount = 100;
    
    for (let i = currentCount; i < targetCount; i++) {
      const occasion = occasions[Math.floor(Math.random() * occasions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const budget = budgets[Math.floor(Math.random() * budgets.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const nameIndex = Math.floor(Math.random() * productNames.length);
      const name = productNames[nameIndex] + (i > currentCount + 20 ? ` - Mẫu ${i - currentCount + 1}` : "");
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      const price = prices[Math.floor(Math.random() * prices.length)];
      const imageIndex = i % images.length;
      const image = images[imageIndex];
      
      moreProducts.push({
        key: `product-${i + 1}`,
        name,
        desc,
        price,
        tag,
        image,
        occasion,
        category,
        budget,
        type,
      });
    }
    
    return moreProducts;
  };

  const allProducts = [...collections, ...newArrivals, ...additionalProducts, ...generateMoreProducts()];

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
                  Tìm thiết kế may đo
                  <span className="block text-[#111827]">
                    phù hợp đúng dịp & đúng “gu” của bạn.
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

          {/* GRID SẢN PHẨM */}
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
                    src={product.image}
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(product, index);
                    }}
                    className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1B4332] px-4 py-2.5 text-[12px] font-medium text-white shadow-sm hover:bg-[#133021] hover:shadow-md transition-all duration-300 group/btn"
                  >
                    <span>👁️</span>
                    <span>Xem chi tiết & tư vấn</span>
                    <span className="opacity-0 translate-x-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                      →
                    </span>
                  </button>
                </div>
                </article>
              );
            })}
          </section>

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
