const STORAGE_KEY = "tailorShopFabricInventory";

const defaultFabrics = [
  {
    id: 1,
    code: "F-001",
    name: "Lụa tơ tằm studio 1",
    category: "Lụa",
    pricePerMeter: 380000,
    unit: "đ/m",
    quantity: 40,
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900&auto=format&fit=crop&q=80",
    status: "active",
  },
  {
    id: 2,
    code: "F-002",
    name: "Linen mềm everyday",
    category: "Linen",
    pricePerMeter: 260000,
    unit: "đ/m",
    quantity: 60,
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&auto=format&fit=crop&q=80",
    status: "active",
  },
];

export const getFabricInventory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFabrics;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return defaultFabrics;
  } catch (error) {
    console.error("Error loading fabric inventory:", error);
    return defaultFabrics;
  }
};

export const saveFabricInventory = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("Error saving fabric inventory:", error);
    return false;
  }
};


