/**
 * Projects Controller
 * Handles all project-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create a new project
 * @route POST /api/v1/projects
 */
const createProject = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.post('/projects', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get all own (active) projects including active tasklists
 * @route GET /api/v1/projects
 */
const getOwnProjects = async (req, res) => {
  try {
    console.log('Getting all projects with auth:', { email: req.auth.email, userAgent: req.auth.userAgent });
    const apiClient = createApiClient(req.auth);

    // Forward all query parameters
    console.log('Query parameters:', req.query);
    const response = await apiClient.get('/projects', { params: req.query });

    console.log('API response status:', response.status);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error getting projects:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

/**
 * Get all projects (owned and invited)
 * @route GET /api/v1/all-projects
 */
const getAllProjects = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    // Forward all query parameters
    const response = await apiClient.get('/all-projects', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get invited projects
 * @route GET /api/v1/invited-projects
 */
const getInvitedProjects = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/invited-projects', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get archived projects
 * @route GET /api/v1/archived-projects
 */
const getArchivedProjects = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/archived-projects', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get template projects
 * @route GET /api/v1/template-projects
 */
const getTemplateProjects = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/template-projects', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get user's projects
 * @route GET /api/v1/user/:userId/all-projects
 */
const getUserProjects = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { userId } = req.params;
    const response = await apiClient.get(`/user/${userId}/all-projects`, { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get project workers
 * @route GET /api/v1/project/:projectId/workers
 */
const getProjectWorkers = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.get(`/project/${projectId}/workers`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Remove workers from project by IDs
 * @route POST /api/v1/project/:projectId/remove-workers/by-ids
 */
const removeWorkersByIds = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/remove-workers/by-ids`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Remove workers from project by emails
 * @route POST /api/v1/project/:projectId/remove-workers/by-emails
 */
const removeWorkersByEmails = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/remove-workers/by-emails`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Archive project
 * @route POST /api/v1/project/:projectId/archive
 */
const archiveProject = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/archive`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Activate project
 * @route POST /api/v1/project/:projectId/activate
 */
const activateProject = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/activate`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get project details
 * @route GET /api/v1/project/:projectId
 */
const getProjectDetails = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.get(`/project/${projectId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete project
 * @route DELETE /api/v1/project/:projectId
 */
const deleteProject = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.delete(`/project/${projectId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create project from template
 * @route POST /api/v1/project/create-from-template/:templateId
 */
const createProjectFromTemplate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { templateId } = req.params;
    const response = await apiClient.post(`/project/create-from-template/${templateId}`, req.body);
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
  createProject,
  getOwnProjects,
  getAllProjects,
  getInvitedProjects,
  getArchivedProjects,
  getTemplateProjects,
  getUserProjects,
  getProjectWorkers,
  removeWorkersByIds,
  removeWorkersByEmails,
  archiveProject,
  activateProject,
  getProjectDetails,
  deleteProject,
  createProjectFromTemplate
};
