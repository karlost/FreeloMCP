/**
 * Task Labels Controller
 * Handles all task label-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create task labels
 * @route POST /api/v1/task-labels
 */
const createTaskLabels = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.post('/task-labels', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Add task labels to task
 * @route POST /api/v1/task-labels/add-to-task/:taskId
 */
const addLabelsToTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task-labels/add-to-task/${taskId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Remove task labels from task
 * @route POST /api/v1/task-labels/remove-from-task/:taskId
 */
const removeLabelsFromTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task-labels/remove-from-task/${taskId}`, req.body);
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
  createTaskLabels,
  addLabelsToTask,
  removeLabelsFromTask
};
