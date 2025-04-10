/**
 * Files Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import filesController from '../controllers/files.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Files routes
router.get('/file/:fileUuid', filesController.downloadFile);
router.post('/file/upload', upload.single('file'), filesController.uploadFile);
router.get('/all-docs-and-files', filesController.getAllItems);

module.exports = router;
