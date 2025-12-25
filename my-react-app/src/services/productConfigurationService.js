/**
 * Product Configuration Service
 * Handles product configuration (Mix & Match) API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class ProductConfigurationService {
  /**
   * Tạo ProductConfiguration mới
   * @param {Object} configData - { templateId, fabricId, styleId? }
   * @returns {Promise<Object>} Created ProductConfiguration
   */
  async create(configData) {
    return httpClient.post(API_ENDPOINTS.PRODUCT_CONFIGURATION.CREATE, configData);
  }

  /**
   * Lấy ProductConfiguration theo ID
   * @param {number} id - ProductConfiguration ID
   * @returns {Promise<Object>} ProductConfiguration detail
   */
  async getById(id) {
    return httpClient.get(API_ENDPOINTS.PRODUCT_CONFIGURATION.DETAIL(id));
  }

  /**
   * Lấy danh sách templates
   * @returns {Promise<Object>} List of templates
   */
  async getTemplates() {
    return httpClient.get(API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES);
  }

  /**
   * Lấy danh sách fabrics theo template
   * @param {number} templateId - Template ID
   * @param {Object} pagination - { page, size }
   * @returns {Promise<Object>} Paginated fabrics
   */
  async getFabricsByTemplate(templateId, pagination = {}) {
    const { page = 0, size = 20 } = pagination;
    const endpoint = `${API_ENDPOINTS.PRODUCT_CONFIGURATION.FABRICS_BY_TEMPLATE(templateId)}?page=${page}&size=${size}`;
    return httpClient.get(endpoint);
  }

  /**
   * Lấy danh sách styles theo template
   * @param {number} templateId - Template ID
   * @param {Object} pagination - { page, size }
   * @returns {Promise<Object>} Paginated styles
   */
  async getStylesByTemplate(templateId, pagination = {}) {
    const { page = 0, size = 20 } = pagination;
    const endpoint = `${API_ENDPOINTS.PRODUCT_CONFIGURATION.STYLES_BY_TEMPLATE(templateId)}?page=${page}&size=${size}`;
    return httpClient.get(endpoint);
  }

  /**
   * Tính giá tự động
   * @param {number} templateId - Template ID
   * @param {number} fabricId - Fabric ID
   * @param {number} styleId - Style ID (optional)
   * @returns {Promise<Object>} Calculated price
   */
  async calculatePrice(templateId, fabricId, styleId = null) {
    const params = new URLSearchParams({
      templateId: templateId.toString(),
      fabricId: fabricId.toString(),
    });
    if (styleId) {
      params.append('styleId', styleId.toString());
    }
    return httpClient.get(`${API_ENDPOINTS.PRODUCT_CONFIGURATION.CALCULATE_PRICE}?${params.toString()}`);
  }

  /**
   * Parse response từ backend (xử lý CommonResponse structure)
   * @param {Object} response - Response từ API
   * @returns {*} Parsed data
   */
  parseResponse(response) {
    // Backend trả về CommonResponse<T> với structure:
    // { requestTrace, responseDateTime, responseStatus, responseData }
    if (response?.responseData !== undefined) {
      return response.responseData;
    }
    // Fallback cho các trường hợp khác
    if (response?.data?.responseData !== undefined) {
      return response.data.responseData;
    }
    if (response?.data !== undefined) {
      return response.data;
    }
    return response;
  }
}

export default new ProductConfigurationService();

