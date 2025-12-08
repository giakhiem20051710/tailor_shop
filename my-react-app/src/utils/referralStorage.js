const STORAGE_KEY = "tailorShopReferrals";
const normalizeCode = (code = "") => code.toString().trim().toUpperCase();

const loadReferrals = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error loading referral storage:", error);
    return {};
  }
};

const saveReferrals = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving referral storage:", error);
    return false;
  }
};

const normalizeBaseCode = (seed = "") =>
  seed
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

const randomSuffix = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return suffix;
};

const generateReferralCode = (seed, existingCodes) => {
  const base = normalizeBaseCode(seed) || "MYHI";
  let attempt = `${base}-${randomSuffix()}`;
  let guard = 0;
  while (existingCodes.has(attempt) && guard < 50) {
    attempt = `${base}-${randomSuffix()}`;
    guard += 1;
  }
  return attempt;
};

export const getOrCreateReferralProfile = (customerId, seedName = "") => {
  if (!customerId) return null;
  const storage = loadReferrals();
  if (storage[customerId]) {
    return storage[customerId];
  }

  const existingCodes = new Set(
    Object.values(storage).map((profile) => profile.code)
  );
  const code = generateReferralCode(seedName || customerId, existingCodes);
  const profile = {
    code,
    createdAt: new Date().toISOString(),
    totalReferrals: 0,
    successfulReferrals: 0,
    rewardHistory: [],
    note: "Chia sẻ mã này cho bạn bè để nhận ưu đãi.",
    lastUpdated: null,
  };
  storage[customerId] = profile;
  saveReferrals(storage);
  return profile;
};

export const updateReferralProfile = (customerId, updates = {}) => {
  if (!customerId) return null;
  const storage = loadReferrals();
  const existing = storage[customerId] || getOrCreateReferralProfile(customerId);
  const updated = {
    ...existing,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  storage[customerId] = updated;
  saveReferrals(storage);
  return updated;
};

export const appendReferralReward = (customerId, entry) => {
  if (!customerId || !entry) return null;
  const storage = loadReferrals();
  const profile = storage[customerId] || getOrCreateReferralProfile(customerId);
  const rewardHistory = [...(profile.rewardHistory || [])];
  rewardHistory.unshift({
    ...entry,
    id: `${Date.now()}-${rewardHistory.length}`,
  });
  const updated = {
    ...profile,
    rewardHistory: rewardHistory.slice(0, 20),
    lastUpdated: new Date().toISOString(),
  };
  storage[customerId] = updated;
  saveReferrals(storage);
  return updated;
};

export const getReferralByCode = (code) => {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const storage = loadReferrals();
  const entry = Object.entries(storage).find(
    ([, profile]) => normalizeCode(profile.code) === normalized
  );
  if (!entry) return null;
  return { customerId: entry[0], profile: entry[1] };
};

export const recordReferralOnOrderCreated = ({
  code,
  orderId,
  referredName,
}) => {
  if (!code || !orderId) return null;
  const match = getReferralByCode(code);
  if (!match) return null;
  const storage = loadReferrals();
  const profile = storage[match.customerId];
  const history = [...(profile.rewardHistory || [])];
  history.unshift({
    id: `${Date.now()}-${orderId}`,
    orderId,
    referredName,
    status: "pending",
    note: "Đơn đang chờ hoàn tất để tặng voucher",
    createdAt: new Date().toISOString(),
  });
  storage[match.customerId] = {
    ...profile,
    totalReferrals: (profile.totalReferrals || 0) + 1,
    rewardHistory: history.slice(0, 20),
    lastUpdated: new Date().toISOString(),
  };
  saveReferrals(storage);
  return {
    referrerId: match.customerId,
    code: profile.code,
  };
};

export const recordReferralCompletion = ({ code, orderId }) => {
  if (!code || !orderId) return null;
  const match = getReferralByCode(code);
  if (!match) return null;
  const storage = loadReferrals();
  const profile = storage[match.customerId];
  const history = (profile.rewardHistory || []).map((entry) => {
    if (entry.orderId === orderId) {
      return {
        ...entry,
        status: "success",
        note: "Đã cấp voucher 10% cho cả hai bên",
        completedAt: new Date().toISOString(),
      };
    }
    return entry;
  });

  storage[match.customerId] = {
    ...profile,
    successfulReferrals: (profile.successfulReferrals || 0) + 1,
    rewardHistory: history,
    lastUpdated: new Date().toISOString(),
  };
  saveReferrals(storage);
  return storage[match.customerId];
};

