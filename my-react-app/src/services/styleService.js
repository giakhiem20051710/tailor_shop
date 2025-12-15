/**
 * Style Service
 * Handles style-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class StyleService {
  /**
   * List styles with filters
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated styles
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.STYLE.LIST}?${queryString}`
      : API_ENDPOINTS.STYLE.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get style detail
   * @param {number} id - Style ID
   * @returns {Promise<Object>} Style detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.STYLE.DETAIL(id));
  }

  /**
   * Create style (admin/staff only)
   * @param {Object} styleData - Style data
   * @returns {Promise<Object>} Created style
   */
  async create(styleData) {
    return httpClient.post(API_ENDPOINTS.STYLE.LIST, styleData);
  }

  /**
   * Update style (admin/staff only)
   * @param {number} id - Style ID
   * @param {Object} styleData - Style data
   * @returns {Promise<Object>} Updated style
   */
  async update(id, styleData) {
    return httpClient.put(API_ENDPOINTS.STYLE.DETAIL(id), styleData);
  }

  /**
   * Delete style (admin/staff only)
   * @param {number} id - Style ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.STYLE.DETAIL(id));
  }
}

export default new StyleService();

