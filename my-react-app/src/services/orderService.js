/**
 * Order Service
 * Handles order-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class OrderService {
  /**
   * List orders with filters
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated orders
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.ORDER.LIST}?${queryString}`
      : API_ENDPOINTS.ORDER.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get order detail
   * @param {number} id - Order ID
   * @returns {Promise<Object>} Order detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.ORDER.DETAIL(id));
  }

  /**
   * Create order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async create(orderData) {
    return httpClient.post(API_ENDPOINTS.ORDER.CREATE, orderData);
  }

  /**
   * Create order via 3-step wizard (FE giữ state, submit 1 lần)
   * @param {Object} wizardData - {contact, product, measurement, customerId?, tailorId?}
   * @returns {Promise<Object>} Created order
   */
  async createWizard(wizardData) {
    return httpClient.post(API_ENDPOINTS.ORDER.CREATE_WIZARD, wizardData);
  }

  /**
   * Create order with files
   * @param {Object} orderData - Order data
   * @param {File[]} files - Attachment files
   * @returns {Promise<Object>} Created order
   */
  async createWithFiles(orderData, files = []) {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));
    files.forEach(file => formData.append('files', file));

    return httpClient.post(API_ENDPOINTS.ORDER.CREATE, formData, {
      headers: {}, // Let browser set Content-Type with boundary
    });
  }

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {Object} statusData - Status data
   * @returns {Promise<Object>} Updated order
   */
  async updateStatus(id, statusData) {
    return httpClient.patch(API_ENDPOINTS.ORDER.UPDATE_STATUS(id), statusData);
  }

  /**
   * Get order tracking
   * @param {number} id - Order ID
   * @returns {Promise<Object>} Order tracking info
   */
  async getTracking(id) {
    return httpClient.get(API_ENDPOINTS.ORDER.TRACKING(id));
  }

  /**
   * Upload order attachment
   * @param {number} id - Order ID
   * @param {File} file - Attachment file
   * @returns {Promise<Object>} Updated order
   */
  async uploadAttachment(id, file) {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.post(API_ENDPOINTS.ORDER.UPLOAD_ATTACHMENT(id), formData, {
      headers: {}, // Let browser set Content-Type with boundary
    });
  }
}

export default new OrderService();

