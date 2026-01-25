import httpClient from './api/httpClient.js';

/**
 * Points Service
 * Handles all points/xu related API calls
 */

// ==================== CONFIG ====================
export const POINTS_CONFIG = {
    // Tỷ lệ kiếm xu
    earn: {
        orderSpend: 50000,       // 1 xu / 50.000đ chi tiêu
        checkinDays: [10, 15, 20, 25, 30, 40, 100], // Xu theo ngày streak
        review: 20,              // Xu viết review
        referral: 100,           // Xu giới thiệu (khi bạn mua)
        birthday: 200,           // Xu sinh nhật
    },

    // Tỷ lệ tiêu xu
    spend: {
        valuePerPoint: 500,      // 1 xu = 500đ
        minPointsToRedeem: 50,   // Tối thiểu 50 xu mới dùng
        maxPercentOrder: 20,     // Max 20% đơn hàng
        minOrderValue: 500000,   // Đơn tối thiểu 500k
    },

    // Hạn sử dụng
    expiry: {
        months: 12,              // Hết hạn sau 12 tháng
        reminderDays: 30,        // Nhắc trước 30 ngày
    }
};

const pointsService = {
    // ==================== WALLET ====================

    /**
     * Get user's points wallet
     */
    getWallet: async () => {
        try {
            const response = await httpClient.get('/points/wallet');
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to get wallet:', error);
            throw error;
        }
    },

    /**
     * Get points transaction history
     */
    getTransactions: async (params = { page: 0, size: 20 }) => {
        try {
            const response = await httpClient.get('/points/transactions', { params });
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to get transactions:', error);
            throw error;
        }
    },

    // ==================== CHECK-IN ====================

    /**
     * Perform daily check-in
     */
    checkin: async () => {
        try {
            const response = await httpClient.post('/points/checkin');
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to check-in:', error);
            throw error;
        }
    },

    /**
     * Get check-in status and streak info
     */
    getCheckinStatus: async () => {
        try {
            const response = await httpClient.get('/points/checkin/status');
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to get check-in status:', error);
            throw error;
        }
    },

    /**
     * Get check-in history for calendar view
     */
    getCheckinHistory: async (month, year) => {
        try {
            const response = await httpClient.get('/points/checkin/history', {
                params: { month, year }
            });
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to get check-in history:', error);
            throw error;
        }
    },

    // ==================== REDEEM ====================

    /**
     * Calculate points discount for an order
     */
    calculateDiscount: (orderTotal, pointsToUse) => {
        const { spend } = POINTS_CONFIG;

        // Check minimum order value
        if (orderTotal < spend.minOrderValue) {
            return { canUse: false, reason: `Đơn hàng tối thiểu ${spend.minOrderValue.toLocaleString()}đ` };
        }

        // Check minimum points
        if (pointsToUse < spend.minPointsToRedeem) {
            return { canUse: false, reason: `Tối thiểu ${spend.minPointsToRedeem} xu để sử dụng` };
        }

        // Calculate max discount (20% of order)
        const maxDiscount = Math.floor(orderTotal * (spend.maxPercentOrder / 100));
        const maxPointsAllowed = Math.floor(maxDiscount / spend.valuePerPoint);

        // Actual points to use
        const actualPoints = Math.min(pointsToUse, maxPointsAllowed);
        const discountAmount = actualPoints * spend.valuePerPoint;

        return {
            canUse: true,
            pointsUsed: actualPoints,
            discountAmount,
            maxPointsAllowed,
            reason: actualPoints < pointsToUse
                ? `Tối đa ${maxPointsAllowed} xu (20% đơn hàng)`
                : null
        };
    },

    /**
     * Use points for order discount
     */
    redeemPoints: async (orderId, pointsAmount) => {
        try {
            const response = await httpClient.post('/points/redeem', {
                orderId,
                pointsAmount
            });
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Failed to redeem points:', error);
            throw error;
        }
    },

    // ==================== HELPERS ====================

    /**
     * Format points value to VND
     */
    pointsToVnd: (points) => {
        return points * POINTS_CONFIG.spend.valuePerPoint;
    },

    /**
     * Calculate points from order amount
     */
    calculatePointsFromOrder: (orderAmount) => {
        return Math.floor(orderAmount / POINTS_CONFIG.earn.orderSpend);
    },

    /**
     * Get check-in points for a specific day
     */
    getCheckinPoints: (streakDay) => {
        const days = POINTS_CONFIG.earn.checkinDays;
        const index = Math.min(streakDay - 1, days.length - 1);
        return days[index] || days[0];
    },

    /**
     * Format points display
     */
    formatPoints: (points) => {
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}k xu`;
        }
        return `${points} xu`;
    }
};

export default pointsService;
