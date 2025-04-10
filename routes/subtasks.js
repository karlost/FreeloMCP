/**
 * Subtasks Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import subtasksController from '../controllers/subtasks.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Subtasks routes
router.get('/task/:taskId/subtasks', subtasksController.getSubtasks);
router.post('/task/:taskId/subtasks', subtasksController.createSubtask);

module.exports = router;
