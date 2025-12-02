import { getCurrentUser } from "./authStorage";

const STORAGE_KEY = "tailorShopFabricHolds";

export const getFabricHolds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading fabric holds:", error);
    return [];
  }
};

const saveFabricHolds = (holds) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holds));
    return true;
  } catch (error) {
    console.error("Error saving fabric holds:", error);
    return false;
  }
};

const buildBasePayload = (fabric, type) => {
  const user = getCurrentUser();
  return {
    key: fabric.key,
    name: fabric.name,
    image: fabric.image,
    price: fabric.price,
    tag: fabric.tag,
    type, // "hold" | "visit"
    createdAt: new Date().toISOString(),
    customerId: user?.username || null,
    customerName: user?.name || user?.username || "Khách lẻ",
    customerPhone: user?.phone || "",
  };
};

export const addFabricHold = (fabric) => {
  if (!fabric?.key) return null;
  const holds = getFabricHolds();
  const exists = holds.some(
    (item) => item.key === fabric.key && item.type === "hold"
  );
  if (exists) return holds;

  const newHold = buildBasePayload(fabric, "hold");
  const updated = [newHold, ...holds];
  saveFabricHolds(updated);
  return updated;
};

export const addFabricVisit = (fabric, extra = {}) => {
  if (!fabric?.key) return null;
  const holds = getFabricHolds();
  const exists = holds.some(
    (item) => item.key === fabric.key && item.type === "visit"
  );
  if (exists) return holds;

  const newVisit = {
    ...buildBasePayload(fabric, "visit"),
    visitDate: extra.visitDate || null,
    visitTime: extra.visitTime || null,
  };
  const updated = [newVisit, ...holds];
  saveFabricHolds(updated);
  return updated;
};

export const getFabricVisits = () =>
  getFabricHolds().filter((h) => h.type === "visit");

export const getFabricHoldOnly = () =>
  getFabricHolds().filter((h) => h.type === "hold");


