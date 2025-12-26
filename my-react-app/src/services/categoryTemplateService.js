import httpClient from './api/httpClient';
import { API_ENDPOINTS } from './api/apiConfig';

/**
 * Service for managing Category Templates (Dynamic Defaults)
 */
const categoryTemplateService = {
    /**
     * Get all templates
     * @returns {Promise<Array>} List of templates
     */
    getAll: async () => {
        try {
            const response = await httpClient.get(API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES);
            return response.data;
        } catch (error) {
            console.error('Error fetching category templates:', error);
            throw error;
        }
    },

    /**
     * Get template by ID
     * @param {number} id 
     */
    getById: async (id) => {
        try {
            const response = await httpClient.get(`${API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching template by ID:', error);
            throw error;
        }
    },

    /**
     * Get template by Category Code
     * @param {string} code 
     */
    getByCode: async (code) => {
        try {
            // Endpoint: /api/v1/product-configurations/templates/code/{code}
            const response = await httpClient.get(`${API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES}/code/${code}`);
            return response.data;
        } catch (error) {
            // Don't throw if not found, just return null so UI can handle gracefully
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error('Error fetching template by code:', error);
            throw error;
        }
    },

    /**
     * Update template
     * @param {number} id 
     * @param {object} data 
     */
    update: async (id, data) => {
        try {
            const response = await httpClient.put(`${API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    /**
     * Create template
     * @param {object} data 
     */
    create: async (data) => {
        try {
            const response = await httpClient.post(API_ENDPOINTS.PRODUCT_CONFIGURATION.TEMPLATES, data);
            return response.data;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }
};

export default categoryTemplateService;
