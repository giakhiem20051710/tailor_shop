/**
 * Services Index
 * Central export for all services
 * Chuẩn thực tế: Tách riêng từng service module theo domain
 */

export { default as authService } from './authService.js';
export { default as userService } from './userService.js';
export { default as productService } from './productService.js';
export { default as productConfigurationService } from './productConfigurationService.js';
export { default as styleService } from './styleService.js';
export { default as cartService } from './cartService.js';
export { default as favoriteService } from './favoriteService.js';
export { default as fabricService } from './fabricService.js';
export { default as fabricOrderService } from './fabricOrderService.js';
export { default as promotionService } from './promotionService.js';
export { default as orderService } from './orderService.js';
export { default as appointmentService } from './appointmentService.js';
export { default as invoiceService } from './invoiceService.js';
export { default as reviewService } from './reviewService.js';
export { default as measurementService } from './measurementService.js';
export { default as imageAssetService } from './imageAssetService.js';

// Export httpClient for advanced usage
export { default as httpClient } from './api/httpClient.js';
export { API_CONFIG, API_ENDPOINTS } from './api/apiConfig.js';

