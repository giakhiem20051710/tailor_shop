import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './apiConfig.js';

class CustomerApi {
    /**
     * Get customers list with pagination
     * @param {Object} params - { page, size, sort }
     */
    async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_ENDPOINTS.USER.CUSTOMERS}${queryString ? `?${queryString}` : ''}`;
        return httpClient.get(url);
    }

    /**
     * Get customer by ID
     * @param {String|Number} id 
     */
    async getCustomerById(id) {
        return httpClient.get(API_ENDPOINTS.USER.BY_ID(id));
    }

    /**
     * Get customer by phone
     * @param {String} phone 
     */
    async getCustomerByPhone(phone) {
        return httpClient.get(`${API_ENDPOINTS.USER.CUSTOMERS}/by-phone?phone=${phone}`);
    }

    /**
     * Create new customer (User)
     * @param {Object} data 
     */
    async createCustomer(data) {
        return httpClient.post(API_ENDPOINTS.USER.LIST, data);
    }
}

export default new CustomerApi();
