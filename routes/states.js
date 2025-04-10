/**
 * States Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import statesController from '../controllers/states.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// States routes
router.get('/states', statesController.getAllStates);

module.exports = router;
