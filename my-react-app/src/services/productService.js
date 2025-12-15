/**
 * Product Service
 * Handles product-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class ProductService {
  /**
   * List products with filters
   * @param {Object} filters - Filter parameters (category, occasion, price range, etc.)
   * @param {Object} pagination - Pagination (page, size, sort)
   * @returns {Promise<Object>} Paginated products
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.PRODUCT.LIST}?${queryString}`
      : API_ENDPOINTS.PRODUCT.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get product detail by key
   * @param {string} key - Product key
   * @returns {Promise<Object>} Product detail
   */
  async getDetail(key) {
    return httpClient.get(API_ENDPOINTS.PRODUCT.DETAIL(key));
  }

  /**
   * Create product (admin/staff only)
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(productData) {
    return httpClient.post(API_ENDPOINTS.PRODUCT.LIST, productData);
  }

  /**
   * Update product (admin/staff only)
   * @param {string} key - Product key
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Updated product
   */
  async update(key, productData) {
    return httpClient.put(API_ENDPOINTS.PRODUCT.DETAIL(key), productData);
  }

  /**
   * Delete product (admin/staff only)
   * @param {string} key - Product key
   * @returns {Promise<Object>} Response
   */
  async delete(key) {
    return httpClient.delete(API_ENDPOINTS.PRODUCT.DETAIL(key));
  }
}

export default new ProductService();

