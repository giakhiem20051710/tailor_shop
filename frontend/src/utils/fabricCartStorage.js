const STORAGE_KEY = "tailorShopFabricCart";

export const getFabricCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading fabric cart:", error);
    return [];
  }
};

export const saveFabricCart = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("Error saving fabric cart:", error);
    return false;
  }
};

export const addToFabricCart = (fabric, quantity = 1) => {
  if (!fabric?.key) return [];
  const cart = getFabricCart();
  const index = cart.findIndex((item) => item.key === fabric.key);
  if (index >= 0) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      key: fabric.key,
      name: fabric.name,
      image: fabric.image,
      price: fabric.price,
      unit: fabric.unit || "đ/m",
      quantity,
    });
  }
  saveFabricCart(cart);
  return cart;
};

export const clearFabricCart = () => {
  saveFabricCart([]);
};

export const removeFromFabricCart = (fabricKey) => {
  const cart = getFabricCart();
  const filtered = cart.filter((item) => item.key !== fabricKey);
  saveFabricCart(filtered);
  return filtered;
};

export const updateFabricCartQuantity = (fabricKey, quantity) => {
  if (quantity <= 0) {
    return removeFromFabricCart(fabricKey);
  }
  const cart = getFabricCart();
  const index = cart.findIndex((item) => item.key === fabricKey);
  if (index >= 0) {
    cart[index].quantity = quantity;
    saveFabricCart(cart);
  }
  return cart;
};

export const getFabricCartTotal = () => {
  const cart = getFabricCart();
  let total = 0;
  cart.forEach((item) => {
    const priceMatch = item.price?.match(/[\d.]+/);
    if (priceMatch) {
      const priceValue = parseInt(priceMatch[0].replace(/\./g, ""), 10);
      total += priceValue * (item.quantity || 1);
    }
  });
  return total;
};


