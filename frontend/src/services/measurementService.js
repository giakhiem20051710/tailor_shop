/**
 * Measurement Service
 * Handles measurement-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class MeasurementService {
  /**
   * List measurements
   * @param {Object} filters - { customerId?, orderId? }
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated measurements
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.MEASUREMENT.LIST}?${queryString}`
      : API_ENDPOINTS.MEASUREMENT.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get measurement detail
   * @param {number} id - Measurement ID
   * @returns {Promise<Object>} Measurement detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.MEASUREMENT.DETAIL(id));
  }

  /**
   * Create measurement (admin/staff/tailor only)
   * @param {Object} measurementData - Measurement data
   * @returns {Promise<Object>} Created measurement
   */
  async create(measurementData) {
    return httpClient.post(API_ENDPOINTS.MEASUREMENT.CREATE, measurementData);
  }

  /**
   * Update measurement (admin/staff/tailor only)
   * @param {number} id - Measurement ID
   * @param {Object} measurementData - Measurement data
   * @returns {Promise<Object>} Updated measurement
   */
  async update(id, measurementData) {
    return httpClient.put(API_ENDPOINTS.MEASUREMENT.UPDATE(id), measurementData);
  }

  /**
   * Get measurement history
   * @param {number} id - Customer ID
   * @returns {Promise<Array>} Measurement history
   */
  async getHistory(id) {
    return httpClient.get(API_ENDPOINTS.MEASUREMENT.HISTORY(id));
  }

  /**
   * Get latest measurement
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} Latest measurement
   */
  async getLatest(id) {
    return httpClient.get(API_ENDPOINTS.MEASUREMENT.LATEST(id));
  }
}

export default new MeasurementService();

