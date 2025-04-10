/**
 * Custom Filters Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import customFiltersController from '../controllers/customFilters.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Custom Filters routes
router.get('/dashboard/custom-filters', customFiltersController.getAllCustomFilters);
router.get('/dashboard/custom-filter/by-uuid/:uuid/tasks', customFiltersController.getTasksByFilterUuid);
router.get('/dashboard/custom-filter/by-name/:nameWebalized/tasks', customFiltersController.getTasksByFilterName);

module.exports = router;
