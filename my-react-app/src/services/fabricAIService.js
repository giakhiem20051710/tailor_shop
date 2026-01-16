/**
 * Fabric AI Analysis Service
 * Calls backend API which uses Gemini Vision to analyze fabric images
 */

import httpClient from './api/httpClient';

/**
 * Analyze a fabric image using backend AI service
 * @param {string} base64Image - Base64 encoded image (with or without data:image prefix)
 * @returns {Promise<Object>} - Parsed fabric analysis result
 */
export async function analyzeFabricImage(base64Image) {
    try {
        // Extract mime type if present
        let mimeType = 'image/jpeg';
        let imageData = base64Image;

        if (base64Image.startsWith('data:')) {
            const match = base64Image.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
                mimeType = match[1];
                imageData = base64Image; // Keep full data URL
            }
        }

        console.log('🔄 Calling AI analyze API...');
        console.log('📦 MimeType:', mimeType);
        console.log('📦 Image data length:', imageData.length);

        // Call backend API
        const response = await httpClient.post('/fabrics/ai-analyze', {
            imageData: imageData,
            mimeType: mimeType,
        });

        console.log('✅ API Response:', response);
        console.log('📦 Response data:', response?.data);
        console.log('📦 Response responseData:', response?.responseData);

        // Handle different response formats
        // httpClient may return: 
        // 1. axios response: { data: { responseData: {...} } }
        // 2. direct object: { responseData: {...}, requestTrace: ... }
        let result = null;

        // Check if response has responseData directly (from httpClient interceptor)
        if (response?.responseData) {
            result = response.responseData;
        } else if (response?.data?.responseData) {
            result = response.data.responseData;
        } else if (response?.data?.data) {
            result = response.data.data;
        } else if (response?.data?.success !== undefined) {
            result = response.data;
        } else if (response?.data) {
            result = response.data;
        }

        console.log('📦 Extracted result:', result);

        if (!result) {
            throw new Error('Backend không trả về dữ liệu. Response: ' + JSON.stringify(response));
        }

        if (result.success === false) {
            throw new Error(result.errorMessage || 'AI không thể phân tích ảnh vải');
        }

        return result;
    } catch (error) {
        console.error('❌ Fabric AI Analysis Error:', error);
        console.error('❌ Error response:', error?.response);
        console.error('❌ Error response data:', error?.response?.data);

        // Check for specific HTTP errors
        if (error?.response?.status === 404) {
            throw new Error('API endpoint không tồn tại (404). Vui lòng restart backend.');
        }
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            throw new Error('Bạn cần đăng nhập với quyền Admin/Staff để sử dụng tính năng này.');
        }
        if (error?.response?.status === 500) {
            const serverError = error?.response?.data?.message || error?.response?.data?.data?.errorMessage;
            throw new Error('Lỗi server (500): ' + (serverError || 'Kiểm tra logs backend.'));
        }
        if (error?.code === 'ERR_NETWORK') {
            throw new Error('Không thể kết nối backend. Kiểm tra backend đang chạy ở port 8080.');
        }

        // Extract error message
        const errorMessage = error?.response?.data?.message
            || error?.response?.data?.data?.errorMessage
            || error?.message
            || 'Không thể phân tích ảnh vải. Vui lòng thử lại.';

        throw new Error(errorMessage);
    }
}

/**
 * Check if backend AI service is available
 * @returns {boolean} - Always true since backend handles the key
 */
export function isApiKeyConfigured() {
    return true; // Backend handles API key
}

export default {
    analyzeFabricImage,
    isApiKeyConfigured,
};

