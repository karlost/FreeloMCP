/**
 * Work Reports Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import workReportsController from '../controllers/workReports.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Work reports routes
router.get('/work-reports', workReportsController.getAllWorkReports);
router.post('/task/:taskId/work-reports', workReportsController.createWorkReport);
router.post('/work-reports/:workReportId', workReportsController.updateWorkReport);
router.delete('/work-reports/:workReportId', workReportsController.deleteWorkReport);

module.exports = router;
