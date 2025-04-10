/**
 * Custom Fields Controller
 * Handles all custom field-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get custom field types
 * @route GET /api/v1/custom-field/get-types
 */
const getCustomFieldTypes = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/custom-field/get-types');
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create custom field
 * @route POST /api/v1/custom-field/create/:projectId
 */
const createCustomField = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { projectId } = req.params;
    const response = await apiClient.post(`/custom-field/create/${projectId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Rename custom field
 * @route POST /api/v1/custom-field/rename/:uuid
 */
const renameCustomField = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { uuid } = req.params;
    const response = await apiClient.post(`/custom-field/rename/${uuid}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete custom field
 * @route DELETE /api/v1/custom-field/delete/:uuid
 */
const deleteCustomField = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { uuid } = req.params;
    const response = await apiClient.delete(`/custom-field/delete/${uuid}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Restore custom field
 * @route POST /api/v1/custom-field/restore/:uuid
 */
const restoreCustomField = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { uuid } = req.params;
    const response = await apiClient.post(`/custom-field/restore/${uuid}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Add or edit custom field value
 * @route POST /api/v1/custom-field/add-or-edit-value
 */
const addOrEditValue = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.post('/custom-field/add-or-edit-value', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Add or edit enum custom field value
 * @route POST /api/v1/custom-field/add-or-edit-enum-value
 */
const addOrEditEnumValue = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.post('/custom-field/add-or-edit-enum-value', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete custom field value
 * @route DELETE /api/v1/custom-field/delete-value/:uuid
 */
const deleteValue = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { uuid } = req.params;
    const response = await apiClient.delete(`/custom-field/delete-value/${uuid}`);
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
  getCustomFieldTypes,
  createCustomField,
  renameCustomField,
  deleteCustomField,
  restoreCustomField,
  addOrEditValue,
  addOrEditEnumValue,
  deleteValue
};
