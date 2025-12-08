// Utility functions for managing product reviews in localStorage

const STORAGE_KEY = "tailorShopReviews";

export const getReviews = () => {
  try {
    const reviews = localStorage.getItem(STORAGE_KEY);
    return reviews ? JSON.parse(reviews) : [];
  } catch (error) {
    console.error("Error loading reviews:", error);
    return [];
  }
};

export const saveReviews = (reviews) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    console.error("Error saving reviews:", error);
    return false;
  }
};

export const addReview = (reviewData) => {
  const reviews = getReviews();
  const newReview = {
    ...reviewData,
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  saveReviews(reviews);
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('reviewsUpdated', { detail: newReview }));
  
  return newReview;
};

export const getReviewByOrderId = (orderId) => {
  const reviews = getReviews();
  return reviews.find((review) => review.orderId === orderId);
};

export const getReviewsByOrderId = (orderId) => {
  const reviews = getReviews();
  return reviews.filter((review) => review.orderId === orderId);
};

export const getReviewsByFabricKey = (fabricKey) => {
  const reviews = getReviews();
  return reviews.filter((review) => 
    review.fabricKeys && Array.isArray(review.fabricKeys) && review.fabricKeys.includes(fabricKey)
  );
};

export const getReviewsByFabricKeys = (fabricKeys) => {
  if (!Array.isArray(fabricKeys) || fabricKeys.length === 0) return [];
  const reviews = getReviews();
  return reviews.filter((review) => 
    review.fabricKeys && Array.isArray(review.fabricKeys) && 
    review.fabricKeys.some(key => fabricKeys.includes(key))
  );
};

export const updateReview = (reviewId, updates) => {
  const reviews = getReviews();
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index !== -1) {
    reviews[index] = { ...reviews[index], ...updates, updatedAt: new Date().toISOString() };
    saveReviews(reviews);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('reviewsUpdated', { detail: reviews[index] }));
    
    return reviews[index];
  }
  return null;
};

export const deleteReview = (reviewId) => {
  const reviews = getReviews();
  const filtered = reviews.filter((r) => r.id !== reviewId);
  saveReviews(filtered);
  return filtered;
};

