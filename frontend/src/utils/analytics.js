/**
 * Analytics Event Tracking System
 * Track user interactions and events for analytics
 */

// Mock analytics - In production, integrate with Google Analytics, Mixpanel, etc.
const analyticsEnabled = true;

export const trackEvent = (eventName, eventData = {}) => {
  if (!analyticsEnabled) return;

  const event = {
    name: eventName,
    data: eventData,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log("📊 Analytics Event:", event);
  }

  // In production, send to analytics service
  // Example: gtag('event', eventName, eventData);
  // Example: mixpanel.track(eventName, eventData);
  
  // Store events in localStorage for debugging
  try {
    const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
    events.push(event);
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }
    localStorage.setItem("analytics_events", JSON.stringify(events));
  } catch (e) {
    // Ignore storage errors
  }
};

// Predefined event types
export const events = {
  // Page views
  PAGE_VIEW: (pageName) => trackEvent("page_view", { page: pageName }),
  
  // Product interactions
  PRODUCT_VIEW: (productId, productName) => 
    trackEvent("product_view", { product_id: productId, product_name: productName }),
  PRODUCT_CLICK: (productId, productName) => 
    trackEvent("product_click", { product_id: productId, product_name: productName }),
  PRODUCT_FAVORITE: (productId, action) => 
    trackEvent("product_favorite", { product_id: productId, action }), // 'add' or 'remove'
  
  // Cart & Checkout
  ADD_TO_CART: (productId, productName, price) => 
    trackEvent("add_to_cart", { product_id: productId, product_name: productName, price }),
  REMOVE_FROM_CART: (productId) => 
    trackEvent("remove_from_cart", { product_id: productId }),
  CART_VIEW: () => trackEvent("cart_view"),
  CHECKOUT_START: (cartValue) => 
    trackEvent("checkout_start", { cart_value: cartValue }),
  CHECKOUT_COMPLETE: (orderId, orderValue) => 
    trackEvent("checkout_complete", { order_id: orderId, order_value: orderValue }),
  
  // Orders
  ORDER_CREATE: (orderId, orderType) => 
    trackEvent("order_create", { order_id: orderId, order_type: orderType }),
  ORDER_VIEW: (orderId) => 
    trackEvent("order_view", { order_id: orderId }),
  
  // Appointments
  APPOINTMENT_BOOK: (appointmentType, date, time) => 
    trackEvent("appointment_book", { type: appointmentType, date, time }),
  APPOINTMENT_CANCEL: (appointmentId) => 
    trackEvent("appointment_cancel", { appointment_id: appointmentId }),
  
  // Search
  SEARCH: (query, resultsCount) => 
    trackEvent("search", { query, results_count: resultsCount }),
  
  // User actions
  LOGIN: (method) => trackEvent("login", { method }),
  LOGOUT: () => trackEvent("logout"),
  REGISTER: () => trackEvent("register"),
  REFERRAL_CODE_USE: (code) => trackEvent("referral_code_use", { code }),
  
  // AI/AR Features
  AI_STYLE_SUGGESTION: (suggestionsCount) => 
    trackEvent("ai_style_suggestion", { suggestions_count: suggestionsCount }),
  VIRTUAL_TRY_ON: (productId) => 
    trackEvent("virtual_try_on", { product_id: productId }),
  PRODUCT_3D_VIEW: (productId) => 
    trackEvent("product_3d_view", { product_id: productId }),
  
  // Errors
  ERROR: (errorMessage, errorType) => 
    trackEvent("error", { message: errorMessage, type: errorType }),
};

// Track page views automatically
export const trackPageView = (pageName) => {
  events.PAGE_VIEW(pageName);
};

// Get analytics events (for admin dashboard)
export const getAnalyticsEvents = () => {
  try {
    return JSON.parse(localStorage.getItem("analytics_events") || "[]");
  } catch {
    return [];
  }
};

// Clear analytics events
export const clearAnalyticsEvents = () => {
  localStorage.removeItem("analytics_events");
};

