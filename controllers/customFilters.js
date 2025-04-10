/**
 * Custom Filters Controller
 * Handles all custom filter-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all custom filters
 * @route GET /api/v1/dashboard/custom-filters
 */
const getAllCustomFilters = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/dashboard/custom-filters');
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get tasks by custom filter UUID
 * @route GET /api/v1/dashboard/custom-filter/by-uuid/:uuid/tasks
 */
const getTasksByFilterUuid = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { uuid } = req.params;
    const response = await apiClient.get(`/dashboard/custom-filter/by-uuid/${uuid}/tasks`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get tasks by custom filter name
 * @route GET /api/v1/dashboard/custom-filter/by-name/:nameWebalized/tasks
 */
const getTasksByFilterName = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { nameWebalized } = req.params;
    const response = await apiClient.get(`/dashboard/custom-filter/by-name/${nameWebalized}/tasks`);
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
  getAllCustomFilters,
  getTasksByFilterUuid,
  getTasksByFilterName
};
