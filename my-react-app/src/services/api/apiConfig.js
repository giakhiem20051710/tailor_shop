/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // User
  USER: {
    PROFILE: '/users/me',
    BY_ID: (id) => `/users/${id}`,
    LIST: '/users',
    CUSTOMERS: '/users/customers',
    TAILORS: '/users/tailors',
  },
  // Product
  PRODUCT: {
    LIST: '/products',
    DETAIL: (key) => `/products/${key}`,
  },
  // Style
  STYLE: {
    LIST: '/styles',
    DETAIL: (id) => `/styles/${id}`,
  },
  // Order
  ORDER: {
    LIST: '/orders',
    DETAIL: (id) => `/orders/${id}`,
    CREATE: '/orders',
    CREATE_WIZARD: '/orders/wizard',
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    TRACKING: (id) => `/orders/${id}/tracking`,
    UPLOAD_ATTACHMENT: (id) => `/orders/${id}/attachments`,
  },
  // Appointment
  APPOINTMENT: {
    LIST: '/appointments',
    DETAIL: (id) => `/appointments/${id}`,
    CREATE: '/appointments',
    UPDATE: (id) => `/appointments/${id}`,
    UPDATE_STATUS: (id) => `/appointments/${id}/status`,
    DELETE: (id) => `/appointments/${id}`,
    SCHEDULE: '/appointments/schedule',
    AVAILABLE_SLOTS: '/appointments/available-slots',
    WORKING_SLOTS: '/appointments/working-slots',
    WORKING_SLOT_DETAIL: (id) => `/appointments/working-slots/${id}`,
    BULK_WORKING_SLOTS: '/appointments/working-slots/bulk',
    RESET_WORKING_HOURS: (staffId) => `/appointments/working-slots/${staffId}/reset`,
    WORKING_HOURS: (staffId) => `/appointments/working-slots/${staffId}/hours`,
    CLOSE_DATES: '/appointments/working-slots/close-dates',
  },
  // Invoice
  INVOICE: {
    LIST: '/invoices',
    DETAIL: (id) => `/invoices/${id}`,
    CREATE: '/invoices',
    VOID: (id) => `/invoices/${id}/void`,
    PAYMENT: '/invoices/payments',
    PAYMENT_CALLBACK: '/invoices/payments/callback',
  },
  // Promotion
  PROMOTION: {
    LIST: '/promotions',
    ACTIVE: '/promotions/active',
    DETAIL: (id) => `/promotions/${id}`,
    BY_CODE: (code) => `/promotions/code/${code}`,
    CREATE: '/promotions',
    UPDATE: (id) => `/promotions/${id}`,
    DELETE: (id) => `/promotions/${id}`,
    ACTIVATE: (id) => `/promotions/${id}/activate`,
    DEACTIVATE: (id) => `/promotions/${id}/deactivate`,
    APPLY: '/promotions/apply',
    USAGES: (id) => `/promotions/${id}/usages`,
    MY_USAGES: '/promotions/my-usages',
    SUGGESTIONS: '/promotions/suggestions',
    AVAILABLE_FOR_CART: '/promotions/available-for-cart',
    AUTO_APPLY: '/promotions/auto-apply',
  },
  // Review
  REVIEW: {
    LIST: '/reviews',
    DETAIL: (id) => `/reviews/${id}`,
    PRODUCT_REVIEW: (productId) => `/reviews/products/${productId}`,
    ORDER_REVIEW: (orderId) => `/reviews/orders/${orderId}`,
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
    REPLY: (id) => `/reviews/${id}/reply`,
    VOTE_HELPFUL: (id) => `/reviews/${id}/helpful`,
    MODERATE: (id) => `/reviews/${id}/moderate`,
    STATISTICS: '/reviews/statistics',
    CHECK_PRODUCT: (productId) => `/reviews/products/${productId}/check`,
    CHECK_ORDER: (orderId) => `/reviews/orders/${orderId}/check`,
  },
  // Fabric
  FABRIC: {
    LIST: '/fabrics',
    DETAIL: (id) => `/fabrics/${id}`,
    BY_CODE: (code) => `/fabrics/code/${code}`,
    BY_SLUG: (slug) => `/fabrics/slug/${slug}`,
    CREATE: '/fabrics',
    UPDATE: (id) => `/fabrics/${id}`,
    DELETE: (id) => `/fabrics/${id}`,
    INVENTORY: (id) => `/fabrics/${id}/inventory`,
    HOLD_REQUESTS: '/fabrics/hold-requests',
    HOLD_REQUEST_DETAIL: (id) => `/fabrics/hold-requests/${id}`,
    HOLD_REQUEST_STATUS: (id) => `/fabrics/hold-requests/${id}/status`,
    APPLY_PROMO: '/fabrics/apply-promo',
  },
  // Fabric Order
  FABRIC_ORDER: {
    CHECKOUT: '/fabric-orders/checkout',
    LIST: '/fabric-orders',
    DETAIL: (id) => `/fabric-orders/${id}`,
    CANCEL: (id) => `/fabric-orders/${id}`,
    PAYMENT: '/fabric-orders/payment',
  },
  // Cart
  CART: {
    ADD: '/cart',
    GET: '/cart',
    UPDATE: (id) => `/cart/${id}`,
    REMOVE: (id) => `/cart/${id}`,
    CLEAR: '/cart',
  },
  // Favorite
  FAVORITE: {
    LIST: '/favorites',
    BY_TYPE: (type) => `/favorites/type/${type}`,
    ADD: '/favorites',
    REMOVE: (type, id) => `/favorites/${type}/${id}`,
    REMOVE_BY_KEY: (key) => `/favorites/key/${key}`,
    CHECK: (type, id) => `/favorites/check/${type}/${id}`,
    CHECK_BY_KEY: '/favorites/check',
  },
  // Measurement
  MEASUREMENT: {
    LIST: '/measurements',
    DETAIL: (id) => `/measurements/${id}`,
    CREATE: '/measurements',
    UPDATE: (id) => `/measurements/${id}`,
    HISTORY: (id) => `/measurements/${id}/history`,
    LATEST: (id) => `/measurements/${id}/latest`,
  },
};

