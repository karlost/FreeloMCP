/**
 * Pinned Items Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import pinnedItemsController from '../controllers/pinnedItems.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Project pinned items routes
router.get('/project/:projectId/pinned-items', pinnedItemsController.getPinnedItems);
router.post('/project/:projectId/pinned-items', pinnedItemsController.pinItem);

// Pinned item specific routes
router.delete('/pinned-item/:pinnedItemId', pinnedItemsController.deletePinnedItem);

module.exports = router;
