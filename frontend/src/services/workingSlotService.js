/**
 * Working Slot Service
 * Handles working slot-related API calls
 */

import httpClient from './api/httpClient';
import { API_ENDPOINTS } from './api/apiConfig';

class WorkingSlotService {
    /**
     * List working slots
     * @param {Object} filters - { staffId?, date? }
     * @param {Object} pagination - Pagination
     * @returns {Promise<Object>} Paginated working slots
     */
    async list(filters = {}, pagination = {}) {
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
    async getDetail(id) {
        return httpClient.get(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id));
    }

    /**
     * Create working slot
     * @param {Object} slotData - Working slot data
     * @returns {Promise<Object>} Created working slot
     */
    async create(slotData) {
        return httpClient.post(API_ENDPOINTS.APPOINTMENT.WORKING_SLOTS, slotData);
    }

    /**
     * Update working slot
     * @param {number} id - Working slot ID
     * @param {Object} slotData - Working slot data
     * @returns {Promise<Object>} Updated working slot
     */
    async update(id, slotData) {
        return httpClient.put(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id), slotData);
    }

    /**
     * Update working slot booked count (for customer booking)
     * @param {number} id - Working slot ID
     * @param {Object} bookData - { bookedCount, status? }
     * @returns {Promise<Object>} Updated working slot
     */
    async updateBookedCount(id, bookData) {
        return httpClient.patch(API_ENDPOINTS.APPOINTMENT.UPDATE_WORKING_SLOT_BOOK(id), bookData);
    }

    /**
     * Delete working slot
     * @param {number} id - Working slot ID
     * @returns {Promise<Object>} Response
     */
    async delete(id) {
        return httpClient.delete(API_ENDPOINTS.APPOINTMENT.WORKING_SLOT_DETAIL(id));
    }

    /**
     * Create bulk working slots
     * @param {Object} bulkData - Bulk working slots data
     * @returns {Promise<Array>} Created working slots
     */
    async createBulk(bulkData) {
        return httpClient.post(API_ENDPOINTS.APPOINTMENT.BULK_WORKING_SLOTS, bulkData);
    }

    /**
     * Reset to default working hours
     * @param {number} staffId - Staff ID
     * @returns {Promise<Object>} Response
     */
    async resetToDefault(staffId) {
        return httpClient.post(API_ENDPOINTS.APPOINTMENT.RESET_WORKING_HOURS(staffId));
    }

    /**
     * Get working hours
     * @param {number} staffId - Staff ID
     * @returns {Promise<Object>} Working hours
     */
    async getHours(staffId) {
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

export default new WorkingSlotService();
