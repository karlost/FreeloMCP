/**
 * Time Tracking Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import timeTrackingController from '../controllers/timeTracking.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Time tracking routes
router.post('/timetracking/start', timeTrackingController.startTimeTracking);
router.post('/timetracking/stop', timeTrackingController.stopTimeTracking);
router.post('/timetracking/edit', timeTrackingController.editTimeTracking);
router.post('/task/:taskId/work-reports', timeTrackingController.createWorkReport);
router.post('/work-reports/:workReportId', timeTrackingController.updateWorkReport);
router.delete('/work-reports/:workReportId', timeTrackingController.deleteWorkReport);

module.exports = router;
