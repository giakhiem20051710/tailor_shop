/**
 * Invoice Service
 * Handles invoice and payment-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class InvoiceService {
  /**
   * List invoices
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated invoices
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.INVOICE.LIST}?${queryString}`
      : API_ENDPOINTS.INVOICE.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get invoice detail
   * @param {number} id - Invoice ID
   * @returns {Promise<Object>} Invoice detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.INVOICE.DETAIL(id));
  }

  /**
   * Create invoice (admin/staff only)
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async create(invoiceData) {
    return httpClient.post(API_ENDPOINTS.INVOICE.CREATE, invoiceData);
  }

  /**
   * Void invoice (admin/staff only)
   * @param {number} id - Invoice ID
   * @returns {Promise<Object>} Response
   */
  async voidInvoice(id) {
    return httpClient.post(API_ENDPOINTS.INVOICE.VOID(id));
  }

  /**
   * Add payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment response
   */
  async addPayment(paymentData) {
    return httpClient.post(API_ENDPOINTS.INVOICE.PAYMENT, paymentData);
  }

  /**
   * Handle payment callback (public endpoint)
   * @param {Object} callbackData - Callback data
   * @returns {Promise<Object>} Payment response
   */
  async handleCallback(callbackData) {
    return httpClient.post(API_ENDPOINTS.INVOICE.PAYMENT_CALLBACK, callbackData, {
      includeAuth: false,
    });
  }

  /**
   * Get invoice by order ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Invoice or null if not found
   */
  async getByOrderId(orderId) {
    try {
      const response = await this.list({ orderId }, { page: 0, size: 1 });
      // Xử lý các cấu trúc response khác nhau
      const invoices = response?.data?.content || 
                      response?.content || 
                      response?.responseData?.content ||
                      response?.data || 
                      [];
      return Array.isArray(invoices) && invoices.length > 0 ? invoices[0] : null;
    } catch (error) {
      console.error("Error fetching invoice by orderId:", error);
      return null;
    }
  }
}

export default new InvoiceService();

