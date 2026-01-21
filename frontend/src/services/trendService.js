import httpClient from "./api/httpClient";

/**
 * Service cho phân tích xu hướng thời trang
 */
const trendService = {
    /**
     * Lấy phân tích xu hướng theo khoảng thời gian
     * @param {string} period - week, month, quarter, year
     */
    async analyzeTrends(period = "month") {
        try {
            // httpClient đã xử lý fetch và error check cơ bản
            // Trả về data trực tiếp (CommonResponse structure)
            return await httpClient.get("/api/trends/analysis", {
                params: { period },
            });
        } catch (error) {
            console.error("Error analyzing trends:", error);
            throw error;
        }
    },

    /**
     * Parse response từ backend (xử lý CommonResponse structure)
     * Copy logic từ ProductService để đồng bộ
     */
    parseResponse(response) {
        if (response?.responseData !== undefined) {
            return response.responseData;
        }
        if (response?.data?.responseData !== undefined) {
            return response.data.responseData;
        }
        if (response?.data !== undefined) {
            return response.data;
        }
        return response;
    },

    /**
     * Health check
     */
    async healthCheck() {
        return await httpClient.get("/api/trends/health");
    },
};

export default trendService;
