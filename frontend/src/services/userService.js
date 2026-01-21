/**
 * User Service
 * Handles user-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class UserService {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    return httpClient.get(API_ENDPOINTS.USER.PROFILE);
  }

  /**
   * Update current user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    return httpClient.put(API_ENDPOINTS.USER.PROFILE, profileData);
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} User data
   */
  async getById(id) {
    return httpClient.get(API_ENDPOINTS.USER.BY_ID(id));
  }

  /**
   * List users with pagination
   * @param {Object} params - Query parameters (page, size, sort, etc.)
   * @returns {Promise<Object>} Paginated users
   */
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.USER.LIST}?${queryString}`
      : API_ENDPOINTS.USER.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * List customers
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated customers
   */
  async listCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.USER.CUSTOMERS}?${queryString}`
      : API_ENDPOINTS.USER.CUSTOMERS;
    return httpClient.get(endpoint);
  }

  /**
   * List tailors
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated tailors
   */
  async listTailors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.USER.TAILORS}?${queryString}`
      : API_ENDPOINTS.USER.TAILORS;
    return httpClient.get(endpoint);
  }

  /**
   * Create user (admin/staff only)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    return httpClient.post(API_ENDPOINTS.USER.LIST, userData);
  }

  /**
   * Update user (admin/staff only)
   * @param {number} id - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated user
   */
  async update(id, userData) {
    return httpClient.put(API_ENDPOINTS.USER.BY_ID(id), userData);
  }

  /**
   * Delete user (admin/staff only)
   * @param {number} id - User ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.USER.BY_ID(id));
  }
}

export default new UserService();

