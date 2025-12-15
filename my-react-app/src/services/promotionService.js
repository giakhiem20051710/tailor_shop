/**
 * Promotion Service
 * Handles promotion-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class PromotionService {
  /**
   * List promotions
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated promotions
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.PROMOTION.LIST}?${queryString}`
      : API_ENDPOINTS.PROMOTION.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * List active public promotions
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated promotions
   */
  async listActivePublic(pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.PROMOTION.ACTIVE}?${queryString}`
      : API_ENDPOINTS.PROMOTION.ACTIVE;
    return httpClient.get(endpoint);
  }

  /**
   * Get promotion detail by ID
   * @param {number} id - Promotion ID
   * @returns {Promise<Object>} Promotion detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.PROMOTION.DETAIL(id));
  }

  /**
   * Get promotion detail by code
   * @param {string} code - Promotion code
   * @returns {Promise<Object>} Promotion detail
   */
  async getDetailByCode(code) {
    return httpClient.get(API_ENDPOINTS.PROMOTION.BY_CODE(code));
  }

  /**
   * Apply promo code
   * @param {Object} applyData - { code, items }
   * @returns {Promise<Object>} Apply response with discount
   */
  async applyPromoCode(applyData) {
    return httpClient.post(API_ENDPOINTS.PROMOTION.APPLY, applyData);
  }

  /**
   * Get promotion suggestions
   * @param {Object} suggestionData - { items }
   * @returns {Promise<Array>} List of suggestions
   */
  async getSuggestions(suggestionData) {
    const queryString = new URLSearchParams(suggestionData).toString();
    const endpoint = `${API_ENDPOINTS.PROMOTION.SUGGESTIONS}?${queryString}`;
    return httpClient.get(endpoint);
  }

  /**
   * Get available promotions for cart
   * @param {Object} cartData - { items }
   * @returns {Promise<Array>} List of available promotions
   */
  async getAvailableForCart(cartData) {
    const queryString = new URLSearchParams(cartData).toString();
    const endpoint = `${API_ENDPOINTS.PROMOTION.AVAILABLE_FOR_CART}?${queryString}`;
    return httpClient.get(endpoint);
  }

  /**
   * Auto apply best promotion
   * @param {Object} cartData - { items }
   * @returns {Promise<Object>} Apply response
   */
  async autoApplyBestPromo(cartData) {
    return httpClient.post(API_ENDPOINTS.PROMOTION.AUTO_APPLY, cartData);
  }

  /**
   * List promotion usages
   * @param {number} id - Promotion ID
   * @param {Object} filters - { userId? }
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated usages
   */
  async listUsages(id, filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.PROMOTION.USAGES(id)}?${queryString}`
      : API_ENDPOINTS.PROMOTION.USAGES(id);
    return httpClient.get(endpoint);
  }

  /**
   * List my promotion usages
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated usages
   */
  async listMyUsages(pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.PROMOTION.MY_USAGES}?${queryString}`
      : API_ENDPOINTS.PROMOTION.MY_USAGES;
    return httpClient.get(endpoint);
  }

  // Admin/Staff methods
  /**
   * Create promotion (admin/staff only)
   * @param {Object} promotionData - Promotion data
   * @returns {Promise<Object>} Created promotion
   */
  async create(promotionData) {
    return httpClient.post(API_ENDPOINTS.PROMOTION.CREATE, promotionData);
  }

  /**
   * Update promotion (admin/staff only)
   * @param {number} id - Promotion ID
   * @param {Object} promotionData - Promotion data
   * @returns {Promise<Object>} Updated promotion
   */
  async update(id, promotionData) {
    return httpClient.put(API_ENDPOINTS.PROMOTION.UPDATE(id), promotionData);
  }

  /**
   * Delete promotion (admin/staff only)
   * @param {number} id - Promotion ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.PROMOTION.DELETE(id));
  }

  /**
   * Activate promotion (admin/staff only)
   * @param {number} id - Promotion ID
   * @returns {Promise<Object>} Response
   */
  async activate(id) {
    return httpClient.patch(API_ENDPOINTS.PROMOTION.ACTIVATE(id));
  }

  /**
   * Deactivate promotion (admin/staff only)
   * @param {number} id - Promotion ID
   * @returns {Promise<Object>} Response
   */
  async deactivate(id) {
    return httpClient.patch(API_ENDPOINTS.PROMOTION.DEACTIVATE(id));
  }
}

export default new PromotionService();

