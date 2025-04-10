/**
 * Pinned Items Controller
 * Handles all pinned item-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all pinned items in a project
 * @route GET /api/v1/project/:projectId/pinned-items
 */
const getPinnedItems = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.get(`/project/${projectId}/pinned-items`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Pin an item to a project
 * @route POST /api/v1/project/:projectId/pinned-items
 */
const pinItem = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/pinned-items`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete a pinned item
 * @route DELETE /api/v1/pinned-item/:pinnedItemId
 */
const deletePinnedItem = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { pinnedItemId } = req.params;
    const response = await apiClient.delete(`/pinned-item/${pinnedItemId}`);
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
  getPinnedItems,
  pinItem,
  deletePinnedItem
};
