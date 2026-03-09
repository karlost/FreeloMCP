/**
 * Invoices Tools
 * Tools for managing invoices in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerInvoicesTools(server) {
  // Get issued invoices
  registerToolWithMetadata(
    server,
    'get_issued_invoices',
    'Fetches issued invoices with filtering options. Use this to retrieve client invoices for accounting, billing reports, or financial analysis. Supports filtering by project and date range. Essential for tracking billable work and generating financial reports.',
    {
      filters: z.object({
        project_id: z.string().optional().describe('Filter by project ID (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
        date_from: z.string().optional().describe('Filter invoices from this date in format YYYY-MM-DD (e.g., "2025-10-01")'),
        date_to: z.string().optional().describe('Filter invoices to this date in format YYYY-MM-DD (e.g., "2025-10-31")')
      }).optional().describe('Optional filters for invoices')
    },
    withErrorHandling('get_issued_invoices', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/issued-invoices', { params: filters });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), number: z.string(), amount: z.number() }))
    }
  );

  // Get invoice detail
  registerToolWithMetadata(
    server,
    'get_invoice_detail',
    'Fetches detailed information about a specific invoice, including line items, work reports, amounts, and status. Use this to review invoice details before sending to clients or for detailed accounting records. Get invoice IDs from get_issued_invoices.',
    {
      invoiceId: z.string().describe('Unique invoice identifier (numeric string, e.g., "12345"). Get from get_issued_invoices response.')
    },
    withErrorHandling('get_invoice_detail', async ({ invoiceId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/issued-invoice/${invoiceId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ id: z.number(), number: z.string(), amount: z.number() })
    }
  );

  // Download invoice reports
  registerToolWithMetadata(
    server,
    'download_invoice_reports',
    'Downloads work reports and time tracking data associated with an invoice. Use this to get detailed breakdown of billable work for client transparency or internal auditing. Returns work report data that was included in the invoice calculation.',
    {
      invoiceId: z.string().describe('Unique invoice identifier (numeric string, e.g., "12345"). Get from get_issued_invoices or get_invoice_detail.')
    },
    withErrorHandling('download_invoice_reports', async ({ invoiceId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/issued-invoice/${invoiceId}/reports`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ url: z.string().url() })
    }
  );

  // Get invoice reports as JSON
  registerToolWithMetadata(
    server,
    'get_invoice_reports_json',
    'Fetches work reports associated with an invoice as structured JSON data (unlike download_invoice_reports which returns CSV). Returns detailed work report entries with project, tasklist, and user information. Ideal for programmatic processing of invoice data.',
    {
      invoiceId: z.string().describe('Unique invoice identifier (numeric string, e.g., "12345"). Get from get_issued_invoices or get_invoice_detail.')
    },
    withErrorHandling('get_invoice_reports_json', async ({ invoiceId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/issued-invoice/${invoiceId}/reports-json`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({
        work_report_id: z.number().nullable(),
        project: z.object({ id: z.number(), name: z.string() }).optional(),
        tasklist: z.object({ id: z.number(), name: z.string() }).optional()
      }).passthrough())
    }
  );

  // Mark as invoiced
  registerToolWithMetadata(
    server,
    'mark_as_invoiced',
    'Marks an invoice as invoiced (sent to client). Use this to track invoice status and indicate that the invoice has been delivered to the client. Important for invoice lifecycle management and accounting workflows. Get invoice IDs from get_issued_invoices.',
    {
      invoiceId: z.string().describe('Unique invoice identifier to mark as invoiced (numeric string, e.g., "12345"). Get from get_issued_invoices response.')
    },
    withErrorHandling('mark_as_invoiced', async ({ invoiceId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/issued-invoice/${invoiceId}/mark-as-invoiced`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );
}
