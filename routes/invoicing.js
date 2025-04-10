/**
 * Invoicing Routes
 */

import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import invoicingController from '../controllers/invoicing.js';

// Apply authentication middleware to all routes
router.use(authenticate);

// Invoicing routes
router.get('/issued-invoices', invoicingController.getAllIssuedInvoices);
router.get('/issued-invoice/:invoiceId', invoicingController.getIssuedInvoiceDetail);
router.get('/issued-invoice/:invoiceId/reports', invoicingController.downloadIssuedInvoiceReports);
router.post('/issued-invoice/:invoiceId/mark-as-invoiced', invoicingController.markAsInvoiced);

module.exports = router;
