/**
 * HTTP Client - Base API client với interceptors và error handling
 * Chuẩn thực tế: Axios-like API client
 */

import { API_CONFIG } from './apiConfig.js';

class HttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || API_CONFIG.BASE_URL;
    this.timeout = config.timeout || API_CONFIG.TIMEOUT;
    this.retryAttempts = config.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = config.retryDelay || API_CONFIG.RETRY_DELAY;

    // Request interceptors
    this.requestInterceptors = [];
    // Response interceptors
    this.responseInterceptors = [];
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    return localStorage.getItem('token') || null;
  }

  /**
   * Build headers
   */
  buildHeaders(customHeaders = {}, includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Build URL
   */
  buildURL(endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Handle response
   */
  async handleResponse(response) {
    // Helper to read body once
    const rawText = await response.text();

    const parseJsonSafe = (text) => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    };

    if (!response.ok) {
      const errorData = parseJsonSafe(rawText) ?? {
        message: rawText || `HTTP error! status: ${response.status}`,
        status: response.status,
      };

      const responseMessage =
        errorData?.responseStatus?.responseMessage ||
        errorData?.responseMessage;

      const firstError =
        Array.isArray(errorData?.errors)
          ? errorData.errors[0]?.defaultMessage || errorData.errors[0]
          : null;

      // Pick the most useful, human-readable message
      const message =
        responseMessage ||
        errorData?.message ||
        errorData?.error ||
        errorData?.detail ||
        errorData?.title ||
        firstError ||
        rawText ||
        `HTTP error! status: ${response.status}`;

      const error = new Error(message);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Success path: parse JSON (fallback to raw string)
    const data = parseJsonSafe(rawText);
    return data ?? rawText;
  }

  /**
   * Retry request
   */
  async retryRequest(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.retryRequest(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if should retry
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx errors
    if (!error.status) return true; // Network error
    return error.status >= 500 && error.status < 600;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Request method
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      includeAuth = true,
      retry = false,
      timeout: requestTimeout, // NEW: Allow per-request timeout override
      ...restOptions
    } = options;

    const url = this.buildURL(endpoint);
    const headers = this.buildHeaders(customHeaders, includeAuth);

    // Debug log for DELETE requests
    if (import.meta.env.DEV && method === 'DELETE') {
      console.log('[httpClient] DELETE request:', url);
      console.log('[httpClient] Headers:', headers);
      console.log('[httpClient] Auth token:', this.getAuthToken() ? 'Present' : 'Missing');
    }

    // Handle FormData (don't set Content-Type for FormData)
    let requestBody = body;
    if (body instanceof FormData) {
      delete headers['Content-Type'];
      requestBody = body;
    } else if (body && typeof body === 'object') {
      requestBody = JSON.stringify(body);
      // Debug log for POST/PUT/DELETE requests
      if (import.meta.env.DEV && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        console.log('[httpClient] Request body:', requestBody);
        if (requestBody && typeof requestBody === 'string') {
          try {
            console.log('[httpClient] Request body parsed:', JSON.parse(requestBody));
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    }

    const config = {
      method,
      headers,
      body: requestBody,
      ...restOptions,
    };

    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(config);

    // Use per-request timeout if provided, otherwise use default
    const timeoutMs = requestTimeout || this.timeout;

    // Make request
    const requestFn = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...finalConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await this.handleResponse(response);
        return await this.applyResponseInterceptors(data);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
        }
        throw error;
      }
    };

    return retry ? this.retryRequest(requestFn) : requestFn();
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {*} body - Request body (optional)
   * @param {Object} options - Additional options
   */
  delete(endpoint, body, options = {}) {
    // If second param is an object and doesn't have method/headers/body, treat it as options
    if (body && typeof body === 'object' && !Array.isArray(body) && !body.method && !body.headers && !body.body) {
      return this.request(endpoint, { ...body, method: 'DELETE' });
    }
    // Otherwise, treat second param as body
    return this.request(endpoint, { ...options, method: 'DELETE', body });
  }
}

// Create singleton instance
const httpClient = new HttpClient();

// Add default request interceptor for logging (dev only)
if (import.meta.env.DEV) {
  httpClient.addRequestInterceptor(async (config) => {
    console.log('[API Request]', config.method, config.url || config);
    return config;
  });
}

// Add default response interceptor for error handling
httpClient.addResponseInterceptor(async (response) => {
  // Handle common errors
  if (response && response.success === false) {
    console.error('[API Error]', response.message || 'Unknown error');
  }
  return response;
});

export default httpClient;

