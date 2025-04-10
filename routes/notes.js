/**
 * Notes Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import notesController from '../controllers/notes.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Notes routes
router.post('/project/:projectId/note', notesController.createNote);
router.get('/note/:noteId', notesController.getNote);
router.post('/note/:noteId', notesController.updateNote);
router.delete('/note/:noteId', notesController.deleteNote);

module.exports = router;
