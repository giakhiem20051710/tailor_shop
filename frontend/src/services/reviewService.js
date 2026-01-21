/**
 * Review Service
 * Handles review-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class ReviewService {
  /**
   * List reviews
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated reviews
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.REVIEW.LIST}?${queryString}`
      : API_ENDPOINTS.REVIEW.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get review detail
   * @param {number} id - Review ID
   * @returns {Promise<Object>} Review detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.REVIEW.DETAIL(id));
  }

  /**
   * Create product review (customer only)
   * @param {number} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  async createProductReview(productId, reviewData) {
    return httpClient.post(API_ENDPOINTS.REVIEW.PRODUCT_REVIEW(productId), reviewData);
  }

  /**
   * Create order review (customer only)
   * @param {number} orderId - Order ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  async createOrderReview(orderId, reviewData) {
    return httpClient.post(API_ENDPOINTS.REVIEW.ORDER_REVIEW(orderId), reviewData);
  }

  /**
   * Create image asset review (customer only)
   * @param {number} imageAssetId - Image Asset ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  async createImageAssetReview(imageAssetId, reviewData) {
    return httpClient.post(API_ENDPOINTS.REVIEW.IMAGE_ASSET_REVIEW(imageAssetId), reviewData);
  }

  /**
   * Update review (owner only)
   * @param {number} id - Review ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Updated review
   */
  async update(id, reviewData) {
    return httpClient.put(API_ENDPOINTS.REVIEW.UPDATE(id), reviewData);
  }

  // ... (keep delete, reply, votes, moderate as is)

  /**
   * Get review statistics
   * @param {Object} filters - Filter parameters (productId, etc)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `${API_ENDPOINTS.REVIEW.STATISTICS}?${queryString}`;
    return httpClient.get(endpoint);
  }

  /**
   * Check if user has reviewed product
   * @param {number} productId - Product ID
   * @returns {Promise<boolean>} Has reviewed
   */
  async hasReviewedProduct(productId) {
    const response = await httpClient.get(API_ENDPOINTS.REVIEW.CHECK_PRODUCT(productId));
    return this.parseResponse(response) || false;
  }

  /**
   * Check if user has reviewed order
   * @param {number} orderId - Order ID
   * @returns {Promise<boolean>} Has reviewed
   */
  async hasReviewedOrder(orderId) {
    const response = await httpClient.get(API_ENDPOINTS.REVIEW.CHECK_ORDER(orderId));
    return this.parseResponse(response) || false;
  }

  /**
   * Check if user has reviewed image asset
   * @param {number} imageAssetId - Image Asset ID
   * @returns {Promise<boolean>} Has reviewed
   */
  async hasReviewedImageAsset(imageAssetId) {
    const response = await httpClient.get(API_ENDPOINTS.REVIEW.CHECK_IMAGE_ASSET(imageAssetId));
    return this.parseResponse(response) || false;
  }

  /**
   * Parse response from backend (handle CommonResponse structure)
   * @param {Object} response - Response from API
   * @returns {*} Parsed data
   */
  parseResponse(response) {
    // Backend returns CommonResponse<T> with structure:
    // { requestTrace, responseDateTime, responseStatus, responseData }
    if (response?.responseData !== undefined) {
      return response.responseData;
    }
    // Fallback for other cases
    if (response?.data?.responseData !== undefined) {
      return response.data.responseData;
    }
    if (response?.data !== undefined) {
      return response.data;
    }
    return response;
  }
}

export default new ReviewService();

