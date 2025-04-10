/**
 * Search Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import searchController from '../controllers/search.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Search routes
router.post('/search', searchController.search);

module.exports = router;
