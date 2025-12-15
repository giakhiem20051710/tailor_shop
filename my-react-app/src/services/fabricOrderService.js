/**
 * Fabric Order Service
 * Handles fabric order-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class FabricOrderService {
  /**
   * Checkout from cart
   * @param {Object} checkoutData - { cartItemIds, shippingAddress, promoCode? }
   * @returns {Promise<Object>} Order response
   */
  async checkout(checkoutData) {
    return httpClient.post(API_ENDPOINTS.FABRIC_ORDER.CHECKOUT, checkoutData);
  }

  /**
   * List my orders
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated orders
   */
  async listMyOrders(pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FABRIC_ORDER.LIST}?${queryString}`
      : API_ENDPOINTS.FABRIC_ORDER.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get order detail
   * @param {number} id - Order ID
   * @returns {Promise<Object>} Order detail
   */
  async getOrderDetail(id) {
    return httpClient.get(API_ENDPOINTS.FABRIC_ORDER.DETAIL(id));
  }

  /**
   * Cancel order
   * @param {number} id - Order ID
   * @returns {Promise<Object>} Response
   */
  async cancelOrder(id) {
    return httpClient.delete(API_ENDPOINTS.FABRIC_ORDER.CANCEL(id));
  }

  /**
   * Process payment
   * @param {Object} paymentData - { orderId, paymentMethod, amount }
   * @returns {Promise<Object>} Payment response
   */
  async processPayment(paymentData) {
    return httpClient.post(API_ENDPOINTS.FABRIC_ORDER.PAYMENT, paymentData);
  }
}

export default new FabricOrderService();

