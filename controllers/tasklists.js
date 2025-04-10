/**
 * Tasklists Controller
 * Handles all tasklist-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create a tasklist in a project
 * @route POST /api/v1/project/:projectId/tasklists
 */
const createTasklist = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/tasklists`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get all tasklists (globally or by project)
 * @route GET /api/v1/all-tasklists
 */
const getAllTasklists = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/all-tasklists', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get assignable workers for a tasklist
 * @route GET /api/v1/project/:projectId/tasklist/:tasklistId/assignable-workers
 */
const getAssignableWorkers = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId, tasklistId } = req.params;
    const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/assignable-workers`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get tasklist details
 * @route GET /api/v1/tasklist/:tasklistId
 */
const getTasklistDetails = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { tasklistId } = req.params;
    const response = await apiClient.get(`/tasklist/${tasklistId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create tasklist from template
 * @route POST /api/v1/tasklist/create-from-template/:templateId
 */
const createTasklistFromTemplate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { templateId } = req.params;
    const response = await apiClient.post(`/tasklist/create-from-template/${templateId}`, req.body);
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

/**
 * Get all tasklists for a project
 * @route GET /api/v1/project/:projectId/tasklists
 */
const getProjectTasklists = async (req, res) => {
  try {
    console.log('Getting tasklists for project with ID:', req.params.projectId);
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;

    // Use all-tasklists endpoint with project filter
    const params = {
      ...req.query,
      projects_ids: [projectId]
    };

    console.log('Query parameters:', params);
    const response = await apiClient.get('/all-tasklists', { params });

    console.log('API response status:', response.status);

    // If the response is paginated, extract the tasklists array
    if (response.data && response.data.data && response.data.data.tasklists) {
      res.status(200).json(response.data.data.tasklists);
    } else {
      res.status(200).json(response.data);
    }
  } catch (error) {
    console.error('Error getting tasklists:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

export default {
  createTasklist,
  getAllTasklists,
  getAssignableWorkers,
  getTasklistDetails,
  createTasklistFromTemplate,
  getProjectTasklists
};
