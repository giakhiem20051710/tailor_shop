/**
 * Favorite Service
 * Handles favorite-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class FavoriteService {
  /**
   * List favorites
   * @param {Object} pagination - Pagination (page, size, sort)
   * @returns {Promise<Object>} Paginated favorites
   */
  async list(pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FAVORITE.LIST}?${queryString}`
      : API_ENDPOINTS.FAVORITE.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * List favorites by type
   * @param {string} itemType - PRODUCT, FABRIC, SERVICE
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated favorites
   */
  async listByType(itemType, pagination = {}) {
    const queryString = new URLSearchParams(pagination).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.FAVORITE.BY_TYPE(itemType)}?${queryString}`
      : API_ENDPOINTS.FAVORITE.BY_TYPE(itemType);
    return httpClient.get(endpoint);
  }

  /**
   * Add to favorites
   * @param {Object} favoriteData - { itemType, itemId, itemKey? }
   * @returns {Promise<Object>} Favorite response
   */
  async add(favoriteData) {
    return httpClient.post(API_ENDPOINTS.FAVORITE.ADD, favoriteData);
  }

  /**
   * Remove from favorites
   * @param {string} itemType - PRODUCT, FABRIC, SERVICE
   * @param {number} itemId - Item ID
   * @returns {Promise<Object>} Response
   */
  async remove(itemType, itemId) {
    return httpClient.delete(API_ENDPOINTS.FAVORITE.REMOVE(itemType, itemId));
  }

  /**
   * Remove from favorites by key (backward compatibility)
   * @param {string} itemKey - Item key
   * @returns {Promise<Object>} Response
   */
  async removeByKey(itemKey) {
    return httpClient.delete(API_ENDPOINTS.FAVORITE.REMOVE_BY_KEY(itemKey));
  }

  /**
   * Check if item is favorited
   * @param {string} itemType - PRODUCT, FABRIC, SERVICE
   * @param {number} itemId - Item ID
   * @returns {Promise<Object>} { isFavorite: boolean }
   */
  async check(itemType, itemId) {
    return httpClient.get(API_ENDPOINTS.FAVORITE.CHECK(itemType, itemId));
  }

  /**
   * Check if item is favorited by key (backward compatibility)
   * @param {string} itemKey - Item key
   * @returns {Promise<Object>} { isFavorite: boolean }
   */
  async checkByKey(itemKey) {
    const endpoint = `${API_ENDPOINTS.FAVORITE.CHECK_BY_KEY}?itemKey=${itemKey}`;
    return httpClient.get(endpoint);
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

export default new FavoriteService();

