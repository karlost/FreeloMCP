/**
 * Subtasks Controller
 * Handles all subtask-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get subtasks in a task
 * @route GET /api/v1/task/:taskId/subtasks
 */
const getSubtasks = async (req, res) => {
  try {
    console.log('Getting subtasks for task with ID:', req.params.taskId);
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;

    // Forward all query parameters
    console.log('Query parameters:', req.query);
    const response = await apiClient.get(`/task/${taskId}/subtasks`, { params: req.query });

    console.log('API response status:', response.status);
    console.log('API response data type:', typeof response.data);

    // Ensure response is an array
    let subtasks = response.data;
    if (!Array.isArray(subtasks)) {
      // If response is not an array but has a data property that is an array
      if (response.data && Array.isArray(response.data.data)) {
        subtasks = response.data.data;
      } else if (response.data && response.data.subtasks && Array.isArray(response.data.subtasks)) {
        subtasks = response.data.subtasks;
      } else {
        // If we can't find an array, return an empty array
        subtasks = [];
      }
    }

    res.status(200).json(subtasks);
  } catch (error) {
    console.error('Error getting subtasks:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

/**
 * Create a subtask in a task
 * @route POST /api/v1/task/:taskId/subtasks
 */
const createSubtask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/subtasks`, req.body);
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
  getSubtasks,
  createSubtask
};
