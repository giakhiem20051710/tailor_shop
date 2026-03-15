import api from "./api/httpClient";

const BASE = "/notifications";

const notificationService = {
    /**
     * Get paginated notifications for the current user.
     */
    list: (page = 0, size = 20) =>
        api.get(`${BASE}?page=${page}&size=${size}`),

    /**
     * Get unread notification count for badge.
     */
    getUnreadCount: () =>
        api.get(`${BASE}/unread-count`),

    /**
     * Mark a single notification as read.
     */
    markAsRead: (id) =>
        api.put(`${BASE}/${id}/read`),

    /**
     * Mark all notifications as read.
     */
    markAllAsRead: () =>
        api.put(`${BASE}/read-all`),
};

export default notificationService;
