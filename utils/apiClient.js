/**
 * API Client for making requests to the Freelo API
 */

import axios from 'axios';

// Base URL for Freelo API
const API_BASE_URL = 'https://api.freelo.io/v1';

/**
 * Create an API client with authentication
 * @param {Object} auth - Authentication details
 * @param {string} auth.email - User email
 * @param {string} auth.apiKey - API key
 * @param {string} auth.userAgent - User agent string
 * @returns {Object} - Axios instance configured for Freelo API
 */
const createApiClient = (auth) => {
  const { email, apiKey, userAgent } = auth;

  // Create basic auth token
  const token = Buffer.from(`${email}:${apiKey}`).toString('base64');

  // Create axios instance with default config
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Basic ${token}`,
      'User-Agent': userAgent,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout
  });

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    response => response,
    error => {
      // Handle API errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('API Error: No response received', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};

export {
  createApiClient
};
