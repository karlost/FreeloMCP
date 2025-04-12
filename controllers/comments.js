/**
 * Comments Controller
 * Handles all comment-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create a comment for a task
 * @route POST /api/v1/task/:taskId/comments
 */
const createComment = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/comments`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Update an existing comment
 * @route POST /api/v1/comment/:commentId
 */
const updateComment = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { commentId } = req.params;
    const response = await apiClient.post(`/comment/${commentId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get all comments with optional filtering
 * @route GET /api/v1/all-comments
 */
const getAllComments = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/all-comments', { params: req.query });
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

// Removed non-functional deleteComment function
// /**
//  * Delete a comment
//  * @route DELETE /api/v1/comment/:commentId
//  */
// const deleteComment = async (req, res) => {
//   try {
//     const apiClient = createApiClient(req.auth);
//     const { commentId } = req.params;
//     const response = await apiClient.delete(`/comment/${commentId}`);
//     res.status(200).json(response.data);
//   } catch (error) {
//     handleApiError(error, res);
//   }
// };

/**
 * Get all comments for a task
 * @route GET /api/v1/task/:taskId/comments
 */
const getTaskComments = async (req, res) => {
  try {
    console.log('Getting comments for task with ID:', req.params.taskId);
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;

    // Get task details to get project ID
    const taskResponse = await apiClient.get(`/task/${taskId}`);
    if (!taskResponse.data || !taskResponse.data.id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get project ID from task response
    const projectId = taskResponse.data.project ? taskResponse.data.project.id : null;

    // Use all-comments endpoint with task type filter
    const params = {
      ...req.query,
      type: 'task'
    };

    // Add project filter if available
    if (projectId) {
      params.projects_ids = [projectId];
    }

    console.log('Query parameters:', params);
    const response = await apiClient.get('/all-comments', { params });

    console.log('API response status:', response.status);

    // Filter comments for the specific task
    let taskComments = [];
    if (response.data && response.data.data && response.data.data.comments) {
      taskComments = response.data.data.comments.filter(comment => {
        return comment.task && comment.task.id === parseInt(taskId);
      });
    }

    res.status(200).json(taskComments);
  } catch (error) {
    console.error('Error getting comments:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    handleApiError(error, res);
  }
};

export default {
  createComment,
  updateComment,
  // deleteComment, // Removed deleteComment export
  getAllComments,
  getTaskComments
};
