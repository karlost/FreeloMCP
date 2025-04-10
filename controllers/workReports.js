/**
 * Work Reports Controller
 * Handles all work report-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all work reports with optional filtering
 * @route GET /api/v1/work-reports
 */
const getAllWorkReports = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/work-reports', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Create work report for a task
 * @route POST /api/v1/task/:taskId/work-reports
 */
const createWorkReport = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { taskId } = req.params;
    const response = await apiClient.post(`/task/${taskId}/work-reports`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Update work report
 * @route POST /api/v1/work-reports/:workReportId
 */
const updateWorkReport = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { workReportId } = req.params;
    const response = await apiClient.post(`/work-reports/${workReportId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Delete work report
 * @route DELETE /api/v1/work-reports/:workReportId
 */
const deleteWorkReport = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { workReportId } = req.params;
    const response = await apiClient.delete(`/work-reports/${workReportId}`);
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
  getAllWorkReports,
  createWorkReport,
  updateWorkReport,
  deleteWorkReport
};
