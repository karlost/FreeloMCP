/**
 * Comments Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import commentsController from '../controllers/comments.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Comments routes
router.post('/task/:taskId/comments', commentsController.createComment);
router.get('/task/:taskId/comments', commentsController.getTaskComments);
router.post('/comment/:commentId', commentsController.updateComment);
router.get('/all-comments', commentsController.getAllComments);

module.exports = router;
