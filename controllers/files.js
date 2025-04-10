/**
 * Files Controller
 * Handles all file-related operations
 */

import { createApiClient } from '../utils/apiClient.js';
import FormData from 'form-data';

/**
 * Download file by UUID
 * @route GET /api/v1/file/:fileUuid
 */
const downloadFile = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { fileUuid } = req.params;
    
    // Get the response as a stream and pipe it directly to the client
    const response = await apiClient.get(`/file/${fileUuid}`, { 
      responseType: 'stream' 
    });
    
    // Set content type and disposition headers if available
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    
    // Pipe the file stream to the response
    response.data.pipe(res);
  } catch (error) {
    // Reset headers that might have been set
    res.setHeader('Content-Type', 'application/json');
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx range
      const status = error.response.status || 500;
      res.status(status).json({ 
        error: 'File not found',
        message: 'Could not download file'
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
 * Upload file
 * @route POST /api/v1/file/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file provided'
      });
    }
    
    const apiClient = createApiClient(req.auth);
    
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Set custom headers for the form data
    const headers = {
      ...formData.getHeaders()
    };
    
    // Send the file to the Freelo API
    const response = await apiClient.post('/file/upload', formData, { headers });
    
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Get all items (files, documents, links, directories)
 * @route GET /api/v1/all-docs-and-files
 */
const getAllItems = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/all-docs-and-files', { params: req.query });
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
  downloadFile,
  uploadFile,
  getAllItems
};
