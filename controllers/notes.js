/**
 * Notes Controller
 * Handles all note-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Create a new note in a project
 * @route POST /api/v1/project/:projectId/note
 */
const createNote = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/project/${projectId}/note`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get note details
 * @route GET /api/v1/note/:noteId
 */
const getNote = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { noteId } = req.params;
    const response = await apiClient.get(`/note/${noteId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Update an existing note
 * @route POST /api/v1/note/:noteId
 */
const updateNote = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { noteId } = req.params;
    const response = await apiClient.post(`/note/${noteId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete an existing note
 * @route DELETE /api/v1/note/:noteId
 */
const deleteNote = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { noteId } = req.params;
    const response = await apiClient.delete(`/note/${noteId}`);
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
  createNote,
  getNote,
  updateNote,
  deleteNote
};
