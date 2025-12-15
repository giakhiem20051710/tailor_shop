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

  // Working Slots
  /**
   * List working slots
   * @param {Object} filters - { staffId?, date? }
   * @param {Object} pagination - Pagination
   * @returns {Promise<Object>} Paginated working slots
   */
  async listWorkingSlots(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.APPOINTMENT.WORKING_SLOTS}?${queryString}`
      : API_ENDPOINTS.APPOINTMENT.WORKING_SLOTS;
    return httpClient.get(endpoint);
  }

  /**
   * Get working slot detail
   * @param {number} id - Working slot ID
   * @returns {Promise<Object>} Working slot detail
   */
  async getWorkingSlot(id) {
    return httpClient.get(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id));
  }

  /**
   * Create working slot
   * @param {Object} slotData - Working slot data
   * @returns {Promise<Object>} Created working slot
   */
  async createWorkingSlot(slotData) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.WORKING_SLOTS, slotData);
  }

  /**
   * Update working slot
   * @param {number} id - Working slot ID
   * @param {Object} slotData - Working slot data
   * @returns {Promise<Object>} Updated working slot
   */
  async updateWorkingSlot(id, slotData) {
    return httpClient.put(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id), slotData);
  }

  /**
   * Delete working slot
   * @param {number} id - Working slot ID
   * @returns {Promise<Object>} Response
   */
  async deleteWorkingSlot(id) {
    return httpClient.delete(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id));
  }

  /**
   * Create bulk working slots
   * @param {Object} bulkData - Bulk working slots data
   * @returns {Promise<Array>} Created working slots
   */
  async createBulkWorkingSlots(bulkData) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.BULK_WORKING_SLOTS, bulkData);
  }

  /**
   * Reset to default working hours
   * @param {number} staffId - Staff ID
   * @returns {Promise<Object>} Response
   */
  async resetToDefaultWorkingHours(staffId) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.RESET_WORKING_HOURS(staffId));
  }

  /**
   * Get working hours
   * @param {number} staffId - Staff ID
   * @returns {Promise<Object>} Working hours
   */
  async getWorkingHours(staffId) {
    return httpClient.get(API_ENDPOINTS.APPOINTMENT.WORKING_HOURS(staffId));
  }

  /**
   * Close dates
   * @param {Object} closeData - Close dates data
   * @returns {Promise<Array>} Closed working slots
   */
  async closeDates(closeData) {
    return httpClient.post(API_ENDPOINTS.APPOINTMENT.CLOSE_DATES, closeData);
  }
}

export default new AppointmentService();

