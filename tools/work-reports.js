/**
 * Work Reports Tools
 * Tools for managing work reports (time entries) in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { WorkReportSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerWorkReportsTools(server) {
  // Get work reports
  registerToolWithMetadata(
    server,
    'get_work_reports',
    'Fetches work reports with powerful filtering options. Work reports track time spent on tasks - essential for billing, productivity analysis, and project reporting. Supports filtering by projects, users, task labels, and date ranges. Use this for generating timesheets, analyzing team productivity, or preparing client invoices.',
    {
      filters: z.object({
        projects_ids: z.array(z.string()).optional().describe('Filter by project IDs (numeric strings, e.g., ["197352", "198000"]). Get from get_projects or get_all_projects.'),
        users_ids: z.array(z.string()).optional().describe('Filter by user IDs (numeric strings, e.g., ["12345", "67890"]). Get from get_users or get_project_workers.'),
        tasks_labels: z.array(z.string()).optional().describe('Filter by task label names (e.g., ["urgent", "bug"]). Get labels from find_available_labels.'),
        date_reported_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD (e.g., "2025-10-01")'),
          date_to: z.string().describe('End date in format YYYY-MM-DD (e.g., "2025-10-31")')
        }).optional().describe('Filter by date range when work was reported. Essential for monthly/weekly reports.')
      }).optional().describe('Optional filters - combine multiple for precise queries')
    },
    withErrorHandling('get_work_reports', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/work-reports', { params: filters });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(WorkReportSchema)
    }
  );

  // Create work report
  registerToolWithMetadata(
    server,
    'create_work_report',
    'Creates a new work report (time entry) for a specific task. Work reports track time spent on tasks for billing, productivity analysis, and project reporting. Use this after completing work on a task or at end of day for timesheet entry. For real-time tracking, use start_time_tracking instead.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks, get_tasklist_tasks, or get_task_details.'),
      reportData: z.object({
        minutes: z.number().describe('Number of minutes worked (e.g., 120 for 2 hours, 30 for half hour). Will be converted to hours in reports.'),
        date: z.string().describe('Date of work in format YYYY-MM-DD (e.g., "2025-10-11"). Usually today\'s date or past date for retroactive entries.'),
        description: z.string().optional().describe('Optional: Description of work performed (e.g., "Fixed login bug", "Client meeting notes"). Useful for detailed billing and reporting.')
      }).describe('Work report data')
    },
    withErrorHandling('create_work_report', async ({ taskId, reportData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/work-reports`, reportData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );

  // Update work report
  registerToolWithMetadata(
    server,
    'update_work_report',
    'Updates an existing work report. Use this to correct time entries, update descriptions, or change the date of logged work. Useful for fixing mistakes in timesheets or adding details to previously logged work. Get work report IDs from get_work_reports.',
    {
      workReportId: z.string().describe('Unique work report identifier (numeric string, e.g., "12345"). Get from get_work_reports response.'),
      reportData: z.object({
        minutes: z.number().optional().describe('Optional: Updated number of minutes worked (e.g., 120 for 2 hours)'),
        date: z.string().optional().describe('Optional: Updated date in format YYYY-MM-DD (e.g., "2025-10-11")'),
        description: z.string().optional().describe('Optional: Updated description of work performed')
      }).describe('Updated work report data - all fields optional, only provide what needs to change')
    },
    withErrorHandling('update_work_report', async ({ workReportId, reportData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/work-reports/${workReportId}`, reportData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );

  // Delete work report
  registerToolWithMetadata(
    server,
    'delete_work_report',
    'Permanently deletes a work report (time entry). WARNING: This action is irreversible! Use this to remove incorrect time entries or duplicate reports. Consider using update_work_report to fix mistakes instead of deleting. Get work report IDs from get_work_reports.',
    {
      workReportId: z.string().describe('Unique work report identifier to permanently delete (numeric string, e.g., "12345"). WARNING: This is irreversible! Get from get_work_reports response.')
    },
    withErrorHandling('delete_work_report', async ({ workReportId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/work-reports/${workReportId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );
}
