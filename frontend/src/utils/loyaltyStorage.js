const STORAGE_KEY = "tailorShopLoyalty";

const loadStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error loading loyalty data:", error);
    return {};
  }
};

const saveStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving loyalty data:", error);
    return false;
  }
};

export const getLoyaltyProfile = (customerId) => {
  if (!customerId) {
    return {
      points: 0,
      totalSpent: 0,
      tier: "silver",
      history: [],
      lastUpdated: null,
    };
  }
  const storage = loadStorage();
  return (
    storage[customerId] || {
      points: 0,
      totalSpent: 0,
      tier: "silver",
      history: [],
      lastUpdated: null,
    }
  );
};

export const saveLoyaltyProfile = (customerId, updates = {}) => {
  if (!customerId) return false;
  const storage = loadStorage();
  const profile = storage[customerId] || {
    points: 0,
    totalSpent: 0,
    tier: "silver",
    history: [],
    lastUpdated: null,
  };

  const updatedProfile = {
    ...profile,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  storage[customerId] = updatedProfile;
  return saveStorage(storage);
};

export const appendLoyaltyHistory = (customerId, entry) => {
  if (!customerId || !entry) return false;
  const storage = loadStorage();
  const profile = storage[customerId] || {
    points: 0,
    totalSpent: 0,
    tier: "silver",
    history: [],
    lastUpdated: null,
  };

  const history = [...(profile.history || [])];
  history.unshift({
    ...entry,
    id: `${Date.now()}-${history.length}`,
  });
  const trimmedHistory = history.slice(0, 20);

  storage[customerId] = {
    ...profile,
    history: trimmedHistory,
    lastUpdated: new Date().toISOString(),
  };

  return saveStorage(storage);
};

