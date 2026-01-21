const STORAGE_KEY = "tailorShopWorkingSlots";

export const getWorkingSlots = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading working slots:", error);
    return [];
  }
};

export const saveWorkingSlots = (slots) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    return true;
  } catch (error) {
    console.error("Error saving working slots:", error);
    return false;
  }
};

export const addWorkingSlot = (slot) => {
  const slots = getWorkingSlots();
  const nextId =
    slots.reduce((max, s) => (s.id && s.id > max ? s.id : max), 0) + 1;
  const payload = {
    id: nextId,
    status: "available",
    capacity: 1,
    bookedCount: 0,
    ...slot,
  };
  slots.push(payload);
  saveWorkingSlots(slots);
  return payload;
};

export const updateWorkingSlot = (id, updates) => {
  const slots = getWorkingSlots();
  const index = slots.findIndex((s) => s.id === id);
  if (index === -1) return null;
  slots[index] = {
    ...slots[index],
    ...updates,
  };
  saveWorkingSlots(slots);
  return slots[index];
};


