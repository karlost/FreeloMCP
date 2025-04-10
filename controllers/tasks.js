/**
 * Tasks Controller
 * Handles all task-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create a task in a tasklist
 * @route POST /api/v1/project/:projectId/tasklist/:tasklistId/tasks
 */
const createTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId, tasklistId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/tasklist/${tasklistId}/tasks`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get tasks in a tasklist
 * @route GET /api/v1/project/:projectId/tasklist/:tasklistId/tasks
 */
const getTasksInTasklist = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId, tasklistId } = req.params;
    const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/tasks`, { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get all tasks (globally, with filters)
 * @route GET /api/v1/all-tasks
 */
const getAllTasks = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/all-tasks', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get finished tasks in a tasklist
 * @route GET /api/v1/tasklist/:tasklistId/finished-tasks
 */
const getFinishedTasksInTasklist = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { tasklistId } = req.params;
    const response = await apiClient.get(`/tasklist/${tasklistId}/finished-tasks`, { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Activate a task
 * @route POST /api/v1/task/:taskId/activate
 */
const activateTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/activate`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Finish a task
 * @route POST /api/v1/task/:taskId/finish
 */
const finishTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/finish`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Move a task to another tasklist
 * @route POST /api/v1/task/:taskId/move/:tasklistId
 */
const moveTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId, tasklistId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/move/${tasklistId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get task details
 * @route GET /api/v1/task/:taskId
 */
const getTaskDetails = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.get(`/task/${taskId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Edit a task
 * @route POST /api/v1/task/:taskId
 */
const editTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete a task
 * @route DELETE /api/v1/task/:taskId
 */
const deleteTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.delete(`/task/${taskId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get task description
 * @route GET /api/v1/task/:taskId/description
 */
const getTaskDescription = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.get(`/task/${taskId}/description`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Update task description
 * @route POST /api/v1/task/:taskId/description
 */
const updateTaskDescription = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/description`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create task reminder
 * @route POST /api/v1/task/:taskId/reminder
 */
const createTaskReminder = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/reminder`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete task reminder
 * @route DELETE /api/v1/task/:taskId/reminder
 */
const deleteTaskReminder = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.delete(`/task/${taskId}/reminder`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get public link for task
 * @route GET /api/v1/public-link/task/:taskId
 */
const getPublicLinkForTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.get(`/public-link/task/${taskId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete public link for task
 * @route DELETE /api/v1/public-link/task/:taskId
 */
const deletePublicLinkForTask = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.delete(`/public-link/task/${taskId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create task from template
 * @route POST /api/v1/task/create-from-template/:templateId
 */
const createTaskFromTemplate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { templateId } = req.params;
    const response = await apiClient.post(`/task/create-from-template/${templateId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create total time estimate for task
 * @route POST /api/v1/task/:taskId/total-time-estimate
 */
const createTotalTimeEstimate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/total-time-estimate`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete total time estimate for task
 * @route DELETE /api/v1/task/:taskId/total-time-estimate
 */
const deleteTotalTimeEstimate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.delete(`/task/${taskId}/total-time-estimate`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create user time estimate for task
 * @route POST /api/v1/task/:taskId/users-time-estimates/:userId
 */
const createUserTimeEstimate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId, userId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/users-time-estimates/${userId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete user time estimate for task
 * @route DELETE /api/v1/task/:taskId/users-time-estimates/:userId
 */
const deleteUserTimeEstimate = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId, userId } = req.params;
    const response = await apiClient.delete(`/task/${taskId}/users-time-estimates/${userId}`);
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
 * Get all tasks for a project
 * @route GET /api/v1/project/:projectId/tasks
 */
const getProjectTasks = async (req, res) => {
  try {
    console.log('Getting tasks for project with ID:', req.params.projectId);
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;

    // Use all-tasks endpoint with project filter
    const params = {
      ...req.query,
      projects_ids: [projectId]
    };

    console.log('Query parameters:', params);
    const response = await apiClient.get('/all-tasks', { params });

    console.log('API response status:', response.status);

    // If the response is paginated, extract the tasks array
    if (response.data && response.data.data && response.data.data.tasks) {
      res.status(200).json(response.data.data.tasks);
    } else {
      res.status(200).json(response.data);
    }
  } catch (error) {
    console.error('Error getting tasks:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

export default {
  createTask,
  getTasksInTasklist,
  getAllTasks,
  getFinishedTasksInTasklist,
  activateTask,
  finishTask,
  moveTask,
  getTaskDetails,
  editTask,
  deleteTask,
  getTaskDescription,
  updateTaskDescription,
  createTaskReminder,
  deleteTaskReminder,
  getPublicLinkForTask,
  deletePublicLinkForTask,
  createTaskFromTemplate,
  createTotalTimeEstimate,
  deleteTotalTimeEstimate,
  createUserTimeEstimate,
  deleteUserTimeEstimate,
  getProjectTasks
};
