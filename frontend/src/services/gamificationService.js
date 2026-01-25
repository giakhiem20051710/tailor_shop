import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

/**
 * Gamification Service
 * Handles all gamification-related API calls (Seasonal Challenges)
 */
class GamificationService {

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get all currently active challenges
     * @returns {Promise<Array>} List of active challenges
     */
    async getActiveChallenges() {
        const response = await httpClient.get('/gamification/challenges/active');
        return this.parseResponse(response);
    }

    /**
     * Get challenges by season and year
     * @param {string} season - Season enum value (TET, VALENTINE, etc.)
     * @param {number} year - Year (default: current year)
     * @returns {Promise<Object>} Season challenges response
     */
    async getChallengesBySeason(season, year = new Date().getFullYear()) {
        const response = await httpClient.get(
            `/gamification/challenges/season/${season}?year=${year}`
        );
        return this.parseResponse(response);
    }

    /**
     * Get challenge detail by ID
     * @param {number} challengeId 
     * @returns {Promise<Object>} Challenge detail
     */
    async getChallengeById(challengeId) {
        const response = await httpClient.get(`/gamification/challenges/${challengeId}`);
        return this.parseResponse(response);
    }

    /**
     * Get challenge detail by code
     * @param {string} code - Challenge code (e.g., TET_2026_FIRST_ORDER)
     * @returns {Promise<Object>} Challenge detail
     */
    async getChallengeByCode(code) {
        const response = await httpClient.get(`/gamification/challenges/code/${code}`);
        return this.parseResponse(response);
    }

    /**
     * Get upcoming challenges
     * @returns {Promise<Array>} List of upcoming challenges
     */
    async getUpcomingChallenges() {
        const response = await httpClient.get('/gamification/challenges/upcoming');
        return this.parseResponse(response);
    }

    // ==================== USER PROGRESS ENDPOINTS ====================

    /**
     * Get my progress for all active challenges
     * @returns {Promise<Array>} List of challenges with progress
     */
    async getMyProgress() {
        const response = await httpClient.get('/gamification/challenges/my-progress');
        return this.parseResponse(response);
    }

    /**
     * Get my progress for a specific challenge
     * @param {number} challengeId 
     * @returns {Promise<Object>} Progress detail
     */
    async getMyProgressForChallenge(challengeId) {
        const response = await httpClient.get(
            `/gamification/challenges/${challengeId}/my-progress`
        );
        return this.parseResponse(response);
    }

    /**
     * Get claimable rewards
     * @returns {Promise<Array>} List of claimable challenges
     */
    async getClaimableRewards() {
        const response = await httpClient.get('/gamification/challenges/claimable');
        return this.parseResponse(response);
    }

    /**
     * Claim reward for a completed challenge
     * @param {number} challengeId 
     * @returns {Promise<Object>} Claim result
     */
    async claimReward(challengeId) {
        const response = await httpClient.post(
            `/gamification/challenges/${challengeId}/claim`
        );
        return this.parseResponse(response);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all challenges (admin)
     * @returns {Promise<Array>} All challenges
     */
    async getAllChallenges() {
        const response = await httpClient.get('/gamification/challenges/admin/all');
        return this.parseResponse(response);
    }

    /**
     * Create a new challenge (admin)
     * @param {Object} challengeData 
     * @returns {Promise<Object>} Created challenge
     */
    async createChallenge(challengeData) {
        const response = await httpClient.post('/gamification/challenges/admin', challengeData);
        return this.parseResponse(response);
    }

    /**
     * Update a challenge (admin)
     * @param {number} challengeId 
     * @param {Object} updateData 
     * @returns {Promise<Object>} Updated challenge
     */
    async updateChallenge(challengeId, updateData) {
        const response = await httpClient.put(
            `/gamification/challenges/admin/${challengeId}`,
            updateData
        );
        return this.parseResponse(response);
    }

    /**
     * Deactivate a challenge (admin)
     * @param {number} challengeId 
     * @returns {Promise<void>}
     */
    async deactivateChallenge(challengeId) {
        const response = await httpClient.delete(
            `/gamification/challenges/admin/${challengeId}`
        );
        return this.parseResponse(response);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Parse backend CommonResponse
     */
    parseResponse(response) {
        if (response && response.data !== undefined) {
            return response.data;
        }
        return response;
    }

    /**
     * Get season display info
     */
    getSeasonInfo(season) {
        const seasons = {
            TET: { name: 'Tết Nguyên Đán', emoji: '🧧', color: '#C41E3A' },
            VALENTINE: { name: 'Valentine', emoji: '💝', color: '#FF69B4' },
            WOMEN_DAY: { name: 'Ngày Phụ Nữ', emoji: '🌸', color: '#FF69B4' },
            SUMMER: { name: 'Mùa Hè', emoji: '☀️', color: '#FFD700' },
            BACK_TO_SCHOOL: { name: 'Mùa Tựu Trường', emoji: '📚', color: '#4169E1' },
            MID_AUTUMN: { name: 'Trung Thu', emoji: '🥮', color: '#FF8C00' },
            HALLOWEEN: { name: 'Halloween', emoji: '🎃', color: '#FF6600' },
            CHRISTMAS: { name: 'Giáng Sinh', emoji: '🎄', color: '#228B22' },
            NEW_YEAR: { name: 'Năm Mới', emoji: '🎊', color: '#FFD700' }
        };
        return seasons[season] || { name: season, emoji: '🎯', color: '#7B68EE' };
    }

    /**
     * Format remaining time
     */
    formatRemainingTime(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return 'Đã kết thúc';

        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày`;
        if (hours > 0) return `${hours} giờ`;
        if (minutes > 0) return `${minutes} phút`;
        return `${seconds} giây`;
    }
}

export default new GamificationService();
