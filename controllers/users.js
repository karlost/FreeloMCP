/**
 * Users Controller
 * Handles all user-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all users (coworkers)
 * @route GET /api/v1/users
 */
const getAllUsers = async (req, res) => {
  try {
    console.log('Getting all users');
    const apiClient = createApiClient(req.auth);

    // Forward all query parameters
    console.log('Query parameters:', req.query);
    const response = await apiClient.get('/users', { params: req.query });

    console.log('API response status:', response.status);
    console.log('API response data type:', typeof response.data);

    // Ensure response is an array
    let users = response.data;
    if (!Array.isArray(users)) {
      // If response is not an array but has a data property that contains users array
      if (response.data && response.data.data && response.data.data.users && Array.isArray(response.data.data.users)) {
        users = response.data.data.users;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else {
        // If we can't find an array, return an empty array
        users = [];
      }
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

/**
 * Get users who promoted me as project manager
 * @route GET /api/v1/users/project-manager-of
 */
const getProjectManagerOf = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/users/project-manager-of');
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Manage workers - invite users to projects by emails or user IDs
 * @route POST /api/v1/users/manage-workers
 */
const manageWorkers = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.post('/users/manage-workers', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get out of office status for a user
 * @route GET /api/v1/user/:userId/out-of-office
 */
const getOutOfOffice = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { userId } = req.params;
    const response = await apiClient.get(`/user/${userId}/out-of-office`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Set out of office status for a user
 * @route POST /api/v1/user/:userId/out-of-office
 */
const setOutOfOffice = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { userId } = req.params;
    const response = await apiClient.post(`/user/${userId}/out-of-office`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete out of office status for a user
 * @route DELETE /api/v1/user/:userId/out-of-office
 */
const deleteOutOfOffice = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { userId } = req.params;
    const response = await apiClient.delete(`/user/${userId}/out-of-office`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Handle API errors
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 */
const handleApiError = (error, res) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    res.status(status).json(data);
  } else if (error.request) {
    // The request was made but no response was received
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'No response received from Freelo API'
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

export default {
  getAllUsers,
  getProjectManagerOf,
  manageWorkers,
  getOutOfOffice,
  setOutOfOffice,
  deleteOutOfOffice
};
