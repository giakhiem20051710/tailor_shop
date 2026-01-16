import api from './api/httpClient';

/**
 * Tailor Service - API Client for Tailor Dashboard
 */
const tailorService = {
    /**
     * Get tailor dashboard statistics
     */
    getStats: async () => {
        const response = await api.get('/tailor/stats');
        return response.data;
    },

    /**
     * Get unassigned orders (pool for tailors to claim)
     */
    getUnassignedOrders: async (params = {}) => {
        const response = await api.get('/tailor/orders/unassigned', { params });
        return response.data;
    },

    /**
     * Get orders assigned to current tailor
     */
    getMyOrders: async (params = {}) => {
        const response = await api.get('/tailor/orders', { params });
        return response.data;
    },

    /**
     * Get order detail
     */
    getOrderDetail: async (id) => {
        const response = await api.get(`/tailor/orders/${id}`);
        return response.data;
    },

    /**
     * Accept/claim an unassigned order
     */
    acceptOrder: async (id) => {
        const response = await api.post(`/tailor/orders/${id}/accept`);
        return response.data;
    },

    /**
     * Update order status
     */
    updateOrderStatus: async (id, newStatus, note = null) => {
        const params = { newStatus };
        if (note) params.note = note;
        const response = await api.put(`/tailor/orders/${id}/status`, null, { params });
        return response.data;
    }
};

export default tailorService;
