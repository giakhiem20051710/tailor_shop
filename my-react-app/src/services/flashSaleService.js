import api from './api/httpClient';

/**
 * Flash Sale Service - API Client
 */
const flashSaleService = {
    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get active flash sales
     */
    getActiveSales: async () => {
        const response = await api.get('/flash-sales/active');
        return response.data;
    },

    /**
     * Get upcoming flash sales
     */
    getUpcomingSales: async () => {
        const response = await api.get('/flash-sales/upcoming');
        return response.data;
    },

    /**
     * Get featured flash sales
     */
    getFeaturedSales: async () => {
        const response = await api.get('/flash-sales/featured');
        return response.data;
    },

    /**
     * Get flash sale detail
     */
    getDetail: async (id) => {
        const response = await api.get(`/flash-sales/${id}`);
        return response.data;
    },

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * List all flash sales (admin)
     */
    listAll: async (params = {}) => {
        const response = await api.get('/flash-sales', { params });
        return response.data;
    },

    /**
     * Create flash sale (admin)
     */
    create: async (data) => {
        const response = await api.post('/flash-sales', data);
        return response.data;
    },

    /**
     * Update flash sale (admin)
     */
    update: async (id, data) => {
        const response = await api.put(`/flash-sales/${id}`, data);
        return response.data;
    },

    /**
     * Cancel flash sale (admin)
     */
    cancel: async (id) => {
        const response = await api.post(`/flash-sales/${id}/cancel`);
        return response.data;
    },

    // ==================== CUSTOMER ENDPOINTS ====================

    /**
     * Purchase flash sale item
     */
    purchase: async (flashSaleId, data) => {
        const response = await api.post(`/flash-sales/${flashSaleId}/purchase`, data);
        return response.data;
    },

    /**
     * Get my orders for a flash sale
     */
    getMyOrdersForSale: async (flashSaleId) => {
        const response = await api.get(`/flash-sales/${flashSaleId}/my-orders`);
        return response.data;
    },

    /**
     * Get all my flash sale orders
     */
    getAllMyOrders: async (params = {}) => {
        const response = await api.get('/flash-sales/my-orders', { params });
        return response.data;
    },

    /**
     * Get order detail
     */
    getOrderDetail: async (orderId) => {
        const response = await api.get(`/flash-sales/orders/${orderId}`);
        return response.data;
    },

    /**
     * Cancel order
     */
    cancelOrder: async (orderId) => {
        const response = await api.post(`/flash-sales/orders/${orderId}/cancel`);
        return response.data;
    },

    /**
     * Confirm payment
     */
    confirmPayment: async (orderId, paymentMethod) => {
        const response = await api.post(`/flash-sales/orders/${orderId}/confirm-payment`, null, {
            params: { paymentMethod }
        });
        return response.data;
    }
};

export default flashSaleService;
