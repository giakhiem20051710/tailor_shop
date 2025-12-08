import defaultStyles from "../data/styles";

const STORAGE_KEY = "tailorShopStyles";

export const getStyles = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStyles;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return defaultStyles;
  } catch (error) {
    console.error("Error loading styles:", error);
    return defaultStyles;
  }
};

export const saveStyles = (styles) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
    return true;
  } catch (error) {
    console.error("Error saving styles:", error);
    return false;
  }
};


