/**
 * API Service
 *
 * Base class for implementing API services with built-in error handling,
 * request management, and retry logic.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { withRetry } = require('../utils/helpers');
const { config } = require('../config');

const DEFAULT_TIMEOUT_MS = 10000;

class ApiService {
    /**
     * Create a new API service instance
     * @param {Object} options - Configuration options
     * @param {string} options.baseURL - Base URL for API requests
     * @param {number} options.timeout - Request timeout in ms (default: 10000)
     * @param {Object} options.headers - Default headers for all requests
     * @param {boolean} options.withCredentials - Include credentials in requests
     */
    constructor(options = {}) {
        // Check if API is enabled in configuration
        this.enabled = config.api.enabled;

        if (!this.enabled) {
            logger.warn('API service is disabled in configuration');
            return;
        }

        this.client = axios.create({
            baseURL: options.baseURL,
            timeout: options.timeout || DEFAULT_TIMEOUT_MS,
            headers: options.headers || {},
            withCredentials: options.withCredentials || false,
        });

        // Add request and response interceptors
        this._addInterceptors();
    }

    /**
     * Add interceptors to handle request/response globally
     * @private
     */
    _addInterceptors() {
        // Request interceptor for logging and auth
        this.client.interceptors.request.use(
            (config) => {
                logger.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('API Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor for logging and error handling
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`API Response: ${response.status} ${response.config.url}`);
                return response.data;
            },
            (error) => {
                const { response, request, message, config } = error;

                // Handle different error scenarios
                if (response)
                // The server responded with an error status code
                {
                    logger.error(`API Error ${response.status}: ${config?.url}`, {
                        status: response.status,
                        data: response.data,
                        method: config?.method,
                        url: config?.url,
                    });
                }
                else if (request)
                // The request was made but no response was received
                {
                    logger.error(`API No Response: ${request.method} ${request.path}`, {
                        message: message,
                    });
                }
                else
                // Something prevented the request from being sent
                { logger.error(`API Request Failed: ${message}`); }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Make a GET request to the API
     * @param {string} url - The endpoint URL
     * @param {Object} options - Request options
     * @param {Object} options.params - URL parameters
     * @param {Object} options.headers - Request headers
     * @param {boolean} options.retry - Whether to retry on failure
     * @returns {Promise<any>} Response data
     */
    async get(url, options = {}) {
        const requestFn = () => {
            return this.client.get(url, {
                params: options.params,
                headers: options.headers,
            });
        };

        if (options.retry) { return withRetry(requestFn); }

        return requestFn();
    }

    /**
     * Make a POST request to the API
     * @param {string} url - The endpoint URL
     * @param {Object} data - Request body data
     * @param {Object} options - Request options
     * @param {Object} options.headers - Request headers
     * @param {boolean} options.retry - Whether to retry on failure
     * @returns {Promise<any>} Response data
     */
    async post(url, data = {}, options = {}) {
        const requestFn = () => {
            return this.client.post(url, data, {
                headers: options.headers,
            });
        };

        if (options.retry) { return withRetry(requestFn); }

        return requestFn();
    }

    /**
     * Make a PUT request to the API
     * @param {string} url - The endpoint URL
     * @param {Object} data - Request body data
     * @param {Object} options - Request options
     * @param {Object} options.headers - Request headers
     * @param {boolean} options.retry - Whether to retry on failure
     * @returns {Promise<any>} Response data
     */
    async put(url, data = {}, options = {}) {
        const requestFn = () => {
            return this.client.put(url, data, {
                headers: options.headers,
            });
        };

        if (options.retry) { return withRetry(requestFn); }

        return requestFn();
    }

    /**
     * Make a PATCH request to the API
     * @param {string} url - The endpoint URL
     * @param {Object} data - Request body data
     * @param {Object} options - Request options
     * @param {Object} options.headers - Request headers
     * @param {boolean} options.retry - Whether to retry on failure
     * @returns {Promise<any>} Response data
     */
    async patch(url, data = {}, options = {}) {
        const requestFn = () => {
            return this.client.patch(url, data, {
                headers: options.headers,
            });
        };

        if (options.retry) { return withRetry(requestFn); }

        return requestFn();
    }

    /**
     * Make a DELETE request to the API
     * @param {string} url - The endpoint URL
     * @param {Object} options - Request options
     * @param {Object} options.headers - Request headers
     * @param {boolean} options.retry - Whether to retry on failure
     * @returns {Promise<any>} Response data
     */
    async delete(url, options = {}) {
        const requestFn = () => {
            return this.client.delete(url, {
                headers: options.headers,
            });
        };

        if (options.retry) { return withRetry(requestFn); }

        return requestFn();
    }
}

module.exports = ApiService;
