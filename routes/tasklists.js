/**
 * Tasklists Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import tasklistsController from '../controllers/tasklists.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Project tasklists routes
router.post('/project/:projectId/tasklists', tasklistsController.createTasklist);
router.get('/project/:projectId/tasklists', tasklistsController.getProjectTasklists);

// All tasklists route
router.get('/all-tasklists', tasklistsController.getAllTasklists);

// Assignable workers for tasklist
router.get('/project/:projectId/tasklist/:tasklistId/assignable-workers', tasklistsController.getAssignableWorkers);

// Tasklist details
router.get('/tasklist/:tasklistId', tasklistsController.getTasklistDetails);

// Create tasklist from template
router.post('/tasklist/create-from-template/:templateId', tasklistsController.createTasklistFromTemplate);

module.exports = router;
