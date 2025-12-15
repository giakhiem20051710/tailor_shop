/**
 * Fabric Service
 * Handles fabric-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class FabricService {
  /**
   * List fabrics with filters
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated fabrics
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FABRIC.LIST}?${queryString}`
      : API_ENDPOINTS.FABRIC.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get fabric detail by ID
   * @param {number} id - Fabric ID
   * @returns {Promise<Object>} Fabric detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.FABRIC.DETAIL(id));
  }

  /**
   * Get fabric detail by code
   * @param {string} code - Fabric code
   * @returns {Promise<Object>} Fabric detail
   */
  async getDetailByCode(code) {
    return httpClient.get(API_ENDPOINTS.FABRIC.BY_CODE(code));
  }

  /**
   * Get fabric detail by slug
   * @param {string} slug - Fabric slug
   * @returns {Promise<Object>} Fabric detail
   */
  async getDetailBySlug(slug) {
    return httpClient.get(API_ENDPOINTS.FABRIC.BY_SLUG(slug));
  }

  /**
   * Create fabric (admin/staff only)
   * @param {Object} fabricData - Fabric data
   * @returns {Promise<Object>} Created fabric
   */
  async create(fabricData) {
    return httpClient.post(API_ENDPOINTS.FABRIC.CREATE, fabricData);
  }

  /**
   * Update fabric (admin/staff only)
   * @param {number} id - Fabric ID
   * @param {Object} fabricData - Fabric data
   * @returns {Promise<Object>} Updated fabric
   */
  async update(id, fabricData) {
    return httpClient.put(API_ENDPOINTS.FABRIC.UPDATE(id), fabricData);
  }

  /**
   * Delete fabric (admin/staff only)
   * @param {number} id - Fabric ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.FABRIC.DELETE(id));
  }

  /**
   * Get fabric inventory (admin/staff only)
   * @param {number} id - Fabric ID
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated inventory
   */
  async getInventory(id, pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FABRIC.INVENTORY(id)}?${queryString}`
      : API_ENDPOINTS.FABRIC.INVENTORY(id);
    return httpClient.get(endpoint);
  }

  /**
   * Update fabric inventory (admin/staff only)
   * @param {number} id - Fabric ID
   * @param {Object} inventoryData - Inventory data
   * @returns {Promise<Object>} Updated inventory
   */
  async updateInventory(id, inventoryData) {
    return httpClient.put(API_ENDPOINTS.FABRIC.INVENTORY(id), inventoryData);
  }

  /**
   * Create hold/visit request (customer only)
   * @param {Object} requestData - Hold request data
   * @returns {Promise<Object>} Created request
   */
  async createHoldRequest(requestData) {
    return httpClient.post(API_ENDPOINTS.FABRIC.HOLD_REQUESTS, requestData);
  }

  /**
   * List hold/visit requests
   * @param {Object} filters - { fabricId?, userId? }
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated requests
   */
  async listHoldRequests(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FABRIC.HOLD_REQUESTS}?${queryString}`
      : API_ENDPOINTS.FABRIC.HOLD_REQUESTS;
    return httpClient.get(endpoint);
  }

  /**
   * Get hold request detail
   * @param {number} id - Request ID
   * @returns {Promise<Object>} Request detail
   */
  async getHoldRequestDetail(id) {
    return httpClient.get(API_ENDPOINTS.FABRIC.HOLD_REQUEST_DETAIL(id));
  }

  /**
   * Update hold request status (staff/admin only)
   * @param {number} id - Request ID
   * @param {Object} statusData - Status data
   * @returns {Promise<Object>} Updated request
   */
  async updateHoldRequestStatus(id, statusData) {
    return httpClient.patch(API_ENDPOINTS.FABRIC.HOLD_REQUEST_STATUS(id), statusData);
  }

  /**
   * Cancel hold request (customer only)
   * @param {number} id - Request ID
   * @returns {Promise<Object>} Response
   */
  async cancelHoldRequest(id) {
    return httpClient.delete(API_ENDPOINTS.FABRIC.HOLD_REQUEST_DETAIL(id));
  }

  /**
   * Apply promo code for fabric purchase
   * @param {Object} promoData - Promo code data
   * @returns {Promise<Object>} Order response with discount
   */
  async applyPromoCode(promoData) {
    return httpClient.post(API_ENDPOINTS.FABRIC.APPLY_PROMO, promoData);
  }
}

export default new FabricService();

