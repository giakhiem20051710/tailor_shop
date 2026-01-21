const STORAGE_KEY = "tailorShopFavoriteProducts";

const normalizeProduct = (product = {}) => {
  const key = product.key || product.id || product.slug || product.name;
  return {
    key,
    name: product.name || "Sản phẩm may đo",
    price: product.price || "Liên hệ",
    tag: product.tag || "Bộ sưu tập",
    image:
      product.image ||
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900&auto=format&fit=crop&q=80",
    desc: product.desc || product.description || "",
    occasion: product.occasion || "daily",
    category: product.category || "custom",
    type: product.type || "collection",
  };
};

const getFavorites = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading favorites:", error);
    return [];
  }
};

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error("Error saving favorites:", error);
    return false;
  }
};

const addFavorite = (product) => {
  const normalized = normalizeProduct(product);
  if (!normalized.key) return null;
  const favorites = getFavorites();
  if (favorites.some((item) => item.key === normalized.key)) {
    return favorites;
  }
  const updated = [normalized, ...favorites];
  saveFavorites(updated);
  return updated;
};

const removeFavorite = (productKey) => {
  const favorites = getFavorites();
  const updated = favorites.filter((item) => item.key !== productKey);
  saveFavorites(updated);
  return updated;
};

const toggleFavorite = (product) => {
  const normalized = normalizeProduct(product);
  if (!normalized.key) return getFavorites();
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.key === normalized.key);
  if (exists) {
    return removeFavorite(normalized.key);
  }
  return addFavorite(normalized);
};

const isFavorite = (productKey) => {
  if (!productKey) return false;
  const favorites = getFavorites();
  return favorites.some((item) => item.key === productKey);
};

export {
  getFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
};

