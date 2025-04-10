/**
 * Users Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import usersController from '../controllers/users.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Users routes
router.get('/users', usersController.getAllUsers);
router.get('/users/project-manager-of', usersController.getProjectManagerOf);
router.post('/users/manage-workers', usersController.manageWorkers);
router.get('/user/:userId/out-of-office', usersController.getOutOfOffice);
router.post('/user/:userId/out-of-office', usersController.setOutOfOffice);
router.delete('/user/:userId/out-of-office', usersController.deleteOutOfOffice);

module.exports = router;
