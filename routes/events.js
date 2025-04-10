/**
 * Events Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import eventsController from '../controllers/events.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Events routes
router.get('/events', eventsController.getAllEvents);

module.exports = router;
