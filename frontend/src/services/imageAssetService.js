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
   * Xóa Image Asset
   * @param {number} id - Image Asset ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    return httpClient.delete(API_ENDPOINTS.IMAGE_ASSET.DELETE(id));
  }

  /**
   * Xóa nhiều Image Assets cùng lúc
   * @param {Array<number>} ids - Array of Image Asset IDs
   * @returns {Promise<Object>} { total, successCount, failedCount, successIds, failedIds }
   */
  async bulkDelete(ids) {
    return httpClient.delete(API_ENDPOINTS.IMAGE_ASSET.BULK_DELETE, ids);
  }

  /**
   * Cleanup các checksum orphan (không có ImageAsset tương ứng)
   * Dùng để xử lý các checksum còn sót lại sau khi xóa ImageAsset trước khi có code cleanup
   * @returns {Promise<Object>} { deletedCount, message }
   */
  async cleanupOrphanChecksums() {
    return httpClient.post(API_ENDPOINTS.IMAGE_ASSET.CLEANUP_ORPHAN_CHECKSUMS);
  }

  /**
   * Phân tích ảnh với Gemini AI và upload lên S3
   * @param {File} file - File ảnh
   * @returns {Promise<Object>} ProductAnalysisResult với thông tin chi tiết + URL ảnh
   */
  async analyzeWithAI(file) {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.post(`${API_ENDPOINTS.IMAGE_ASSET.BASE}/analyze`, formData, {
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Chỉ phân tích ảnh với AI, không upload (dùng cho preview/edit trước khi lưu)
   * @param {File} file - File ảnh
   * @returns {Promise<Object>} ProductAnalysisResult
   */
  async analyzeOnly(file) {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.post(`${API_ENDPOINTS.IMAGE_ASSET.BASE}/analyze-only`, formData, {
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Lưu ảnh với metadata đã được user chỉnh sửa
   * @param {File} file - File ảnh
   * @param {Object} editedMetadata - Metadata đã chỉnh sửa (ProductAnalysisResult)
   * @returns {Promise<Object>} ProductAnalysisResult với URL ảnh đã upload
   */
  async saveWithMetadata(file, editedMetadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(editedMetadata));

    return httpClient.post(`${API_ENDPOINTS.IMAGE_ASSET.BASE}/save-with-metadata`, formData, {
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Phân tích nhiều ảnh với Gemini AI cùng lúc (Bulk Analysis)
   * @param {File[]} files - Mảng các file ảnh
   * @returns {Promise<Object>} Mảng ProductAnalysisResult
   */
  async analyzeBulkWithAI(files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return httpClient.post(API_ENDPOINTS.IMAGE_ASSET.ANALYZE_BULK, formData, {
      headers: {}, // Let browser set Content-Type for FormData
      timeout: 300000, // 5 minutes timeout for bulk processing
    });
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

