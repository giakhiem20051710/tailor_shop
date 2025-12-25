/**
 * Image Asset Service
 * Handles image asset API calls for upload, classification, and filtering
 */

import httpClient from './api/httpClient.js';
import { API_ENDPOINTS } from './api/apiConfig.js';

class ImageAssetService {
  /**
   * Tạo Image Asset mới
   * @param {Object} assetData - { s3Key, url, category, type, gender, tags, productTemplateId?, fabricId?, styleId? }
   * @returns {Promise<Object>} Created ImageAsset
   */
  async create(assetData) {
    return httpClient.post(API_ENDPOINTS.IMAGE_ASSET.CREATE, assetData);
  }

  /**
   * Upload ảnh và tự động phân loại
   * @param {File} file - File ảnh
   * @param {Object} options - { description?, category?, type?, gender? }
   * @returns {Promise<Object>} Created ImageAsset với phân loại tự động
   */
  async upload(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.description) {
      formData.append('description', options.description);
    }
    if (options.category) {
      formData.append('category', options.category);
    }
    if (options.type) {
      formData.append('type', options.type);
    }
    if (options.gender) {
      formData.append('gender', options.gender);
    }

    return httpClient.post(API_ENDPOINTS.IMAGE_ASSET.UPLOAD, formData, {
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Lấy Image Asset theo ID
   * @param {number} id - Image Asset ID
   * @returns {Promise<Object>} ImageAsset detail
   */
  async getById(id) {
    return httpClient.get(API_ENDPOINTS.IMAGE_ASSET.DETAIL(id));
  }

  /**
   * Lấy danh sách Image Assets (có phân trang)
   * @param {Object} pagination - { page, size }
   * @returns {Promise<Object>} Paginated ImageAssets
   */
  async getAll(pagination = {}) {
    const { page = 0, size = 20 } = pagination;
    const endpoint = `${API_ENDPOINTS.IMAGE_ASSET.LIST}?page=${page}&size=${size}`;
    return httpClient.get(endpoint);
  }

  /**
   * Lấy Image Assets theo category
   * @param {string} category - "template", "fabric", "style"
   * @param {Object} pagination - { page, size }
   * @returns {Promise<Object>} Paginated ImageAssets
   */
  async getByCategory(category, pagination = {}) {
    const { page = 0, size = 20 } = pagination;
    const endpoint = `${API_ENDPOINTS.IMAGE_ASSET.BY_CATEGORY(category)}?page=${page}&size=${size}`;
    return httpClient.get(endpoint);
  }

  /**
   * Lấy Image Assets theo category và type
   * @param {string} category - "template", "fabric", "style"
   * @param {string} type - "ao_so_mi", "quan_tay", etc.
   * @param {Object} pagination - { page, size }
   * @returns {Promise<Object>} Paginated ImageAssets
   */
  async getByCategoryAndType(category, type, pagination = {}) {
    const { page = 0, size = 20 } = pagination;
    const endpoint = `${API_ENDPOINTS.IMAGE_ASSET.BY_CATEGORY_AND_TYPE(category, type)}?page=${page}&size=${size}`;
    return httpClient.get(endpoint);
  }

  /**
   * Filter Image Assets theo nhiều tiêu chí
   * @param {Object} filters - { category?, type?, gender?, page?, size? }
   * @returns {Promise<Object>} Paginated ImageAssets
   */
  async filter(filters = {}) {
    const { category, type, gender, page = 0, size = 20 } = filters;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (gender) params.append('gender', gender);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const endpoint = `${API_ENDPOINTS.IMAGE_ASSET.FILTER}?${params.toString()}`;
    return httpClient.get(endpoint);
  }

  /**
   * Lấy Image Assets theo Template ID
   * @param {number} templateId - Product Template ID
   * @returns {Promise<Array>} List of ImageAssets
   */
  async getByTemplateId(templateId) {
    return httpClient.get(API_ENDPOINTS.IMAGE_ASSET.BY_TEMPLATE(templateId));
  }

  /**
   * Parse response từ backend (xử lý CommonResponse structure)
   * @param {Object} response - Response từ API
   * @returns {*} Parsed data
   */
  parseResponse(response) {
    // Backend trả về CommonResponse<T> với structure:
    // { requestTrace, responseDateTime, responseStatus, responseData }
    if (response?.responseData !== undefined) {
      return response.responseData;
    }
    // Fallback cho các trường hợp khác
    if (response?.data?.responseData !== undefined) {
      return response.data.responseData;
    }
    if (response?.data !== undefined) {
      return response.data;
    }
    return response;
  }
}

export default new ImageAssetService();

