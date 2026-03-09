/**
 * Time Tracking Tools
 * Tools for starting, stopping, and editing time tracking sessions in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { WorkReportSchema } from '../utils/schemas.js';

export function registerTimeTrackingTools(server) {
  // Start time tracking
  registerToolWithMetadata(
    server,
    'start_time_tracking',
    'Starts real-time time tracking for a task or general work. Creates an active timer that runs until stopped with stop_time_tracking. Use this for live time tracking during work - when stopped, it automatically creates a work report. For manual time entry after work is done, use create_work_report instead.',
    {
      taskId: z.string().optional().describe('Optional: Task ID to track time for (numeric string, e.g., "12345"). If not provided, tracks general work time. Get from get_all_tasks or get_tasklist_tasks.')
    },
    withErrorHandling('start_time_tracking', async ({ taskId }) => {
      const apiClient = getApiClient();
      const body = taskId ? { task_id: parseInt(taskId, 10) } : {};
      const response = await apiClient.post('/timetracking/start', body);
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );

  // Stop time tracking
  registerToolWithMetadata(
    server,
    'stop_time_tracking',
    'Stops the currently active time tracking session. Calculates elapsed time since start_time_tracking was called and automatically creates a work report with the tracked time. Use this when finishing work on a task. If no timer is running, this will return an error.',
    {},
    withErrorHandling('stop_time_tracking', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/timetracking/stop');
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );

  // Edit time tracking
  registerToolWithMetadata(
    server,
    'edit_time_tracking',
    'Edits the currently active time tracking session. Use this to change which task is being tracked or add/update the description while the timer is still running. Useful when you realize you started tracking the wrong task or want to add notes. Only works with an active timer.',
    {
      trackingData: z.object({
        task_id: z.string().optional().describe('Optional: New task ID to track time for (numeric string, e.g., "12345"). Use to switch task while timer runs.'),
        description: z.string().optional().describe('Optional: Description to add to the time tracking session (e.g., "Working on feature X"). Will appear in work report when stopped.')
      }).describe('Data to edit in current time tracking - all fields optional')
    },
    withErrorHandling('edit_time_tracking', async ({ trackingData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/timetracking/edit', trackingData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: WorkReportSchema
    }
  );
}
