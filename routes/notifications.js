/**
 * Notifications Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import notificationsController from '../controllers/notifications.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Notifications routes
router.get('/all-notifications', notificationsController.getAllNotifications);
router.post('/notification/:notificationId/mark-as-read', notificationsController.markAsRead);
router.post('/notification/:notificationId/mark-as-unread', notificationsController.markAsUnread);

module.exports = router;
