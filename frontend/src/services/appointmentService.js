/**
 * Appointment Service
 * Handles appointment-related API calls
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class AppointmentService {
  /**
   * List appointments
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated appointments
   */
  async list(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.APPOINTMENT.LIST}?${queryString}`
      : API_ENDPOINTS.APPOINTMENT.LIST;
    return httpClient.get(endpoint);
  }

  /**
   * Get appointment detail
   * @param {number} id - Appointment ID
   * @returns {Promise<Object>} Appointment detail
   */
  async getDetail(id) {
    return httpClient.get(API_ENDPOINTS.APPOINTMENT.DETAIL(id));
  }

  /**
   * Create appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async create(appointmentData) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.CREATE, appointmentData);
  }

  /**
   * Create appointment by customer (for fabric visit, etc. - orderId is optional)
   * @param {Object} appointmentData - Appointment data { workingSlotId, type, orderId?, notes? }
   * @returns {Promise<Object>} Created appointment
   */
  async createByCustomer(appointmentData) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.CREATE_BY_CUSTOMER, appointmentData);
  }

  /**
   * Update appointment
   * @param {number} id - Appointment ID
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Updated appointment
   */
  async update(id, appointmentData) {
    return httpClient.put(API_ENDPOINTS.APPOINTMENT.UPDATE(id), appointmentData);
  }

  /**
   * Update appointment status
   * @param {number} id - Appointment ID
   * @param {Object} statusData - Status data
   * @returns {Promise<Object>} Updated appointment
   */
  async updateStatus(id, statusData) {
    return httpClient.patch(API_ENDPOINTS.APPOINTMENT.UPDATE_STATUS(id), statusData);
  }

  /**
   * Delete appointment
   * @param {number} id - Appointment ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.APPOINTMENT.DELETE(id));
  }

  /**
   * Get schedule
   * @param {number} staffId - Staff ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {string} type - Appointment type (optional)
   * @returns {Promise<Array>} Schedule list
   */
  async getSchedule(staffId, date, type = null) {
    const params = { staffId, date };
    if (type) params.type = type;
    const queryString = new URLSearchParams(params).toString();
    return httpClient.get(`${API_ENDPOINTS.APPOINTMENT.SCHEDULE}?${queryString}`);
  }

  /**
   * Get available slots
   * @param {number} staffId - Staff ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {number} durationMinutes - Duration in minutes (optional)
   * @returns {Promise<Array>} Available slots
   */
  async getAvailableSlots(staffId, date, durationMinutes = null) {
    const params = { staffId, date };
    if (durationMinutes) params.duration = durationMinutes;
    const queryString = new URLSearchParams(params).toString();
    return httpClient.get(`${API_ENDPOINTS.APPOINTMENT.AVAILABLE_SLOTS}?${queryString}`);
  }

}

export default new AppointmentService();

