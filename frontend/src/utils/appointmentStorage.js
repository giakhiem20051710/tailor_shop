const STORAGE_KEY = "tailorShopAppointments";

export const getAppointments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading appointments:", error);
    return [];
  }
};

export const saveAppointments = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("Error saving appointments:", error);
    return false;
  }
};

export const addAppointment = (appointment) => {
  const list = getAppointments();
  const nextId =
    list.reduce((max, a) => (a.id && a.id > max ? a.id : max), 0) + 1;
  const payload = {
    id: nextId,
    status: "pending",
    ...appointment,
    createdAt: new Date().toISOString(),
  };
  list.push(payload);
  saveAppointments(list);
  return payload;
};

export const updateAppointment = (id, updates) => {
  const list = getAppointments();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates };
  saveAppointments(list);
  return list[index];
};


