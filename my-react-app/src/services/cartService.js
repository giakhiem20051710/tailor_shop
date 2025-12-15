/**
 * Cart Service
 * Handles cart-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class CartService {
  /**
   * Add item to cart
   * @param {Object} itemData - { itemType, itemId, quantity }
   * @returns {Promise<Object>} Cart item response
   */
  async addToCart(itemData) {
    return httpClient.post(API_ENDPOINTS.CART.ADD, itemData);
  }

  /**
   * Get cart
   * @returns {Promise<Object>} Cart summary with items
   */
  async getCart() {
    return httpClient.get(API_ENDPOINTS.CART.GET);
  }

  /**
   * Update cart item quantity
   * @param {number} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Response
   */
  async updateCartItem(itemId, quantity) {
    const endpoint = `${API_ENDPOINTS.CART.UPDATE(itemId)}?quantity=${quantity}`;
    return httpClient.put(endpoint);
  }

  /**
   * Remove item from cart
   * @param {number} itemId - Cart item ID
   * @returns {Promise<Object>} Response
   */
  async removeFromCart(itemId) {
    return httpClient.delete(API_ENDPOINTS.CART.REMOVE(itemId));
  }

  /**
   * Clear entire cart
   * @returns {Promise<Object>} Response
   */
  async clearCart() {
    return httpClient.delete(API_ENDPOINTS.CART.CLEAR);
  }
}

export default new CartService();

