/**
 * Notifications Controller
 * Handles all notification-related operations
 */

import { createApiClient } from '../utils/apiClient.js';

/**
 * Get all notifications with optional filtering
 * @route GET /api/v1/all-notifications
 */
const getAllNotifications = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const response = await apiClient.get('/all-notifications', { params: req.query });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Mark notification as read
 * @route POST /api/v1/notification/:notificationId/mark-as-read
 */
const markAsRead = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { notificationId } = req.params;
    const response = await apiClient.post(`/notification/${notificationId}/mark-as-read`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
};

/**
 * Mark notification as unread
 * @route POST /api/v1/notification/:notificationId/mark-as-unread
 */
const markAsUnread = async (req, res) => {
  try {
    const apiClient = createApiClient(req.auth);
    const { notificationId } = req.params;
    const response = await apiClient.post(`/notification/${notificationId}/mark-as-unread`);
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
  getAllNotifications,
  markAsRead,
  markAsUnread
};
