/**
 * Custom Fields Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import customFieldsController from '../controllers/customFields.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Custom Fields routes
router.get('/custom-field/get-types', customFieldsController.getCustomFieldTypes);
router.post('/custom-field/create/:projectId', customFieldsController.createCustomField);
router.post('/custom-field/rename/:uuid', customFieldsController.renameCustomField);
router.delete('/custom-field/delete/:uuid', customFieldsController.deleteCustomField);
router.post('/custom-field/restore/:uuid', customFieldsController.restoreCustomField);
router.post('/custom-field/add-or-edit-value', customFieldsController.addOrEditValue);
router.post('/custom-field/add-or-edit-enum-value', customFieldsController.addOrEditEnumValue);
router.delete('/custom-field/delete-value/:uuid', customFieldsController.deleteValue);

module.exports = router;
