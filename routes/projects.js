/**
 * Projects Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import projectsController from '../controllers/projects.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Projects collection routes
router.post('/projects', projectsController.createProject);
router.get('/projects', projectsController.getOwnProjects);

// All projects collection routes
router.get('/all-projects', projectsController.getAllProjects);
router.get('/invited-projects', projectsController.getInvitedProjects);
router.get('/archived-projects', projectsController.getArchivedProjects);
router.get('/template-projects', projectsController.getTemplateProjects);

// User projects routes
router.get('/user/:userId/all-projects', projectsController.getUserProjects);

// Project specific routes
router.get('/project/:projectId', projectsController.getProjectDetails);
router.delete('/project/:projectId', projectsController.deleteProject);
router.post('/project/:projectId/archive', projectsController.archiveProject);
router.post('/project/:projectId/activate', projectsController.activateProject);

// Project workers routes
router.get('/project/:projectId/workers', projectsController.getProjectWorkers);
router.post('/project/:projectId/remove-workers/by-ids', projectsController.removeWorkersByIds);
router.post('/project/:projectId/remove-workers/by-emails', projectsController.removeWorkersByEmails);

// Create project from template
router.post('/project/create-from-template/:templateId', projectsController.createProjectFromTemplate);

module.exports = router;
