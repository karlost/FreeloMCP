/**
 * Tasks Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import tasksController from '../controllers/tasks.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Tasks in tasklist routes
router.post('/project/:projectId/tasklist/:tasklistId/tasks', tasksController.createTask);
router.get('/project/:projectId/tasklist/:tasklistId/tasks', tasksController.getTasksInTasklist);

// Tasks in project routes
router.get('/project/:projectId/tasks', tasksController.getProjectTasks);

// All tasks route
router.get('/all-tasks', tasksController.getAllTasks);

// Finished tasks in tasklist
router.get('/tasklist/:tasklistId/finished-tasks', tasksController.getFinishedTasksInTasklist);

// Task specific routes
router.get('/task/:taskId', tasksController.getTaskDetails);
router.post('/task/:taskId', tasksController.editTask);
router.delete('/task/:taskId', tasksController.deleteTask);

// Task actions
router.post('/task/:taskId/activate', tasksController.activateTask);
router.post('/task/:taskId/finish', tasksController.finishTask);
router.post('/task/:taskId/move/:tasklistId', tasksController.moveTask);

// Task description
router.get('/task/:taskId/description', tasksController.getTaskDescription);
router.post('/task/:taskId/description', tasksController.updateTaskDescription);

// Task reminder
router.post('/task/:taskId/reminder', tasksController.createTaskReminder);
router.delete('/task/:taskId/reminder', tasksController.deleteTaskReminder);

// Public link for task
router.get('/public-link/task/:taskId', tasksController.getPublicLinkForTask);
router.delete('/public-link/task/:taskId', tasksController.deletePublicLinkForTask);

// Create task from template
router.post('/task/create-from-template/:templateId', tasksController.createTaskFromTemplate);

// Task time estimates
router.post('/task/:taskId/total-time-estimate', tasksController.createTotalTimeEstimate);
router.delete('/task/:taskId/total-time-estimate', tasksController.deleteTotalTimeEstimate);
router.post('/task/:taskId/users-time-estimates/:userId', tasksController.createUserTimeEstimate);
router.delete('/task/:taskId/users-time-estimates/:userId', tasksController.deleteUserTimeEstimate);

module.exports = router;
