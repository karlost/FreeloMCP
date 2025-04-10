/**
 * Invoicing Controller
 * Handles all invoicing-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all issued invoices with optional filtering
 * @route GET /api/v1/issued-invoices
 */
const getAllIssuedInvoices = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/issued-invoices', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get issued invoice detail
 * @route GET /api/v1/issued-invoice/:invoiceId
 */
const getIssuedInvoiceDetail = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { invoiceId } = req.params;
    const response = await apiClient.get(`/issued-invoice/${invoiceId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Download issued invoice reports
 * @route GET /api/v1/issued-invoice/:invoiceId/reports
 */
const downloadIssuedInvoiceReports = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { invoiceId } = req.params;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}-reports.csv"`);

    // Get the response as a stream and pipe it directly to the client
    const response = await apiClient.get(`/issued-invoice/${invoiceId}/reports`, {
      responseType: 'stream'
    });

    response.data.pipe(res);
  } catch (error) {
    // Reset headers that were set for CSV download
    res.setHeader('Content-Type', 'application/json');
    res.removeHeader('Content-Disposition');

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx range
      const status = error.response.status || 500;
      res.status(status).json({
        error: 'Invoice not found',
        message: 'Could not download invoice reports'
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'No response received from Freelo API'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'An unknown error occurred'
      });
    }
  }
};

/**
 * Mark issued invoice as invoiced
 * @route POST /api/v1/issued-invoice/:invoiceId/mark-as-invoiced
 */
const markAsInvoiced = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { invoiceId } = req.params;
    const response = await apiClient.post(`/issued-invoice/${invoiceId}/mark-as-invoiced`, req.body);
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
  getAllIssuedInvoices,
  getIssuedInvoiceDetail,
  downloadIssuedInvoiceReports,
  markAsInvoiced
};
