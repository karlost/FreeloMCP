/**
 * Events Tools
 * Handles activity event operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerEventsTools(server) {
  registerToolWithMetadata(
    server,
    'get_events',
    'Fetches activity events (audit log) with powerful filtering options. Events track all changes in Freelo: task updates, comments, status changes, assignments, file uploads, etc. Essential for activity tracking, auditing, generating reports, or building activity feeds. Supports filtering by projects, users, event types, tasks, and date ranges with pagination.',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (numeric array, e.g., [197352, 198000]). Get from get_projects or get_all_projects.'),
        users_ids: z.array(z.number()).optional().describe('Filter by user IDs who performed actions (numeric array, e.g., [12345, 67890]). Get from get_users.'),
        events_types: z.array(z.string()).optional().describe('Filter by event types (e.g., ["task_created", "task_finished", "comment_added"]). Common types: task_created, task_finished, task_assigned, comment_added, file_uploaded.'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort order: "desc" (newest first, default) or "asc" (oldest first)'),
        date_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-01")'),
          date_to: z.string().describe('End date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-31")')
        }).optional().describe('Filter events within date range. Essential for period reports and historical analysis.'),
        tasks_ids: z.array(z.number()).optional().describe('Filter by task IDs (numeric array, e.g., [12345, 67890]). Use to see all activity for specific tasks.'),
        p: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Critical for large event sets to avoid token limits.')
      }).optional().describe('Optional filters - combine multiple for precise queries')
    },
    withErrorHandling('get_events', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/events', { params: filters });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), type: z.string(), date: z.string() }))
    }
  );
}
