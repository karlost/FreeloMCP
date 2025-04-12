/**
 * Task Labels Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import taskLabelsController from '../controllers/taskLabels.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Task labels routes
// router.get('/task-labels', taskLabelsController.getTaskLabels); // Removed non-functional get route
router.post('/task-labels', taskLabelsController.createTaskLabels);
router.post('/task-labels/add-to-task/:taskId', taskLabelsController.addLabelsToTask);
router.post('/task-labels/remove-from-task/:taskId', taskLabelsController.removeLabelsFromTask);

module.exports = router;
