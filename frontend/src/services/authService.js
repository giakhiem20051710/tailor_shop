/**
 * Auth Service
 * Handles authentication-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class AuthService {
  /**
   * Login
   * @param {Object} credentials - { phoneOrEmail, password }
   * @returns {Promise<Object>} Login response with token
   */
  async login(credentials) {
    const response = await httpClient.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { includeAuth: false }
    );
    
    // Store token if provided (support wrapped responses)
    const responseData = response?.data ?? response?.responseData ?? response;
    const tokenPayload = responseData?.data ?? responseData;
    const token = tokenPayload?.accessToken || tokenPayload?.token;
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return response;
  }

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    return httpClient.post(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      { includeAuth: false }
    );
  }

  /**
   * Forgot password
   * @param {string} email - User email
   * @returns {Promise<Object>} Response
   */
  async forgotPassword(email) {
    return httpClient.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      { includeAuth: false }
    );
  }

  /**
   * Reset password
   * @param {Object} resetData - { token, newPassword }
   * @returns {Promise<Object>} Response
   */
  async resetPassword(resetData) {
    return httpClient.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      resetData,
      { includeAuth: false }
    );
  }

  /**
   * Logout (clear token)
   */
  logout() {
    localStorage.removeItem('token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();

