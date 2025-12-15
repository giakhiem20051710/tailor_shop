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
   * Update review (owner only)
   * @param {number} id - Review ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Updated review
   */
  async update(id, reviewData) {
    return httpClient.put(API_ENDPOINTS.REVIEW.UPDATE(id), reviewData);
  }

  /**
   * Delete review (owner only)
   * @param {number} id - Review ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.REVIEW.DELETE(id));
  }

  /**
   * Reply to review (shop reply, staff/admin only)
   * @param {number} id - Review ID
   * @param {Object} replyData - Reply data
   * @returns {Promise<Object>} Updated review
   */
  async reply(id, replyData) {
    return httpClient.post(API_ENDPOINTS.REVIEW.REPLY(id), replyData);
  }

  /**
   * Vote helpful
   * @param {number} id - Review ID
   * @returns {Promise<Object>} Response
   */
  async voteHelpful(id) {
    return httpClient.post(API_ENDPOINTS.REVIEW.VOTE_HELPFUL(id));
  }

  /**
   * Unvote helpful
   * @param {number} id - Review ID
   * @returns {Promise<Object>} Response
   */
  async unvoteHelpful(id) {
    return httpClient.delete(API_ENDPOINTS.REVIEW.VOTE_HELPFUL(id));
  }

  /**
   * Moderate review (admin only)
   * @param {number} id - Review ID
   * @param {string} action - APPROVE, REJECT, HIDE
   * @param {string} note - Optional note
   * @returns {Promise<Object>} Updated review
   */
  async moderate(id, action, note = null) {
    const params = new URLSearchParams({ action });
    if (note) params.append('note', note);
    return httpClient.patch(`${API_ENDPOINTS.REVIEW.MODERATE(id)}?${params}`);
  }

  /**
   * Get review statistics
   * @param {Object} params - { productId?, orderId?, type? }
   * @returns {Promise<Object>} Review statistics
   */
  async getStatistics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.REVIEW.STATISTICS}?${queryString}`
      : API_ENDPOINTS.REVIEW.STATISTICS;
    return httpClient.get(endpoint);
  }

  /**
   * Check if user has reviewed product
   * @param {number} productId - Product ID
   * @returns {Promise<boolean>} Has reviewed
   */
  async hasReviewedProduct(productId) {
    const response = await httpClient.get(API_ENDPOINTS.REVIEW.CHECK_PRODUCT(productId));
    return response.data || false;
  }

  /**
   * Check if user has reviewed order
   * @param {number} orderId - Order ID
   * @returns {Promise<boolean>} Has reviewed
   */
  async hasReviewedOrder(orderId) {
    const response = await httpClient.get(API_ENDPOINTS.REVIEW.CHECK_ORDER(orderId));
    return response.data || false;
  }
}

export default new ReviewService();

