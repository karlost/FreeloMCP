/**
 * Subtasks Tools
 * Tools for managing subtasks in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { SubtaskSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerSubtasksTools(server) {
  // Create subtask
  registerToolWithMetadata(
    server,
    'create_subtask',
    'Creates a subtask under an existing task. Subtasks help break down complex tasks into smaller, manageable pieces. Each subtask can have its own assignment, description, and due date. Useful for detailed task decomposition and better progress tracking. Use get_subtasks to list existing subtasks.',
    {
      taskId: z.string().describe('Unique parent task identifier (numeric string, e.g., "25368707"). The subtask will be created under this task. Get from get_all_tasks or get_task_details.'),
      subtaskData: z.object({
        name: z.string().describe('Subtask name - clear and actionable (e.g., "Write unit tests", "Review code", "Update documentation")'),
        description: z.string().optional().describe('Optional: Detailed subtask description with context or requirements'),
        worker: z.number().optional().describe('Optional: User ID to assign subtask to (numeric). Can be different from parent task assignee. Get from get_project_workers.'),
        dueDate: z.string().optional().describe('Optional: Due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS')
      }).describe('Subtask creation data')
    },
    withErrorHandling('create_subtask', async ({ taskId, subtaskData }) => {
      const apiClient = getApiClient();

      // Transform description to comment.content for API
      const apiData = { ...subtaskData };
      if (subtaskData.description) {
        apiData.comment = { content: subtaskData.description };
        delete apiData.description;
      }

      // Transform dueDate to due_date for API
      if (subtaskData.dueDate) {
        apiData.due_date = subtaskData.dueDate;
        delete apiData.dueDate;
      }

      const response = await apiClient.post(`/task/${taskId}/subtasks`, apiData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: SubtaskSchema
    }
  );

  // Get subtasks
  registerToolWithMetadata(
    server,
    'get_subtasks',
    'Fetches all subtasks belonging to a parent task. Returns a list of subtasks with their names, statuses, assignments, and due dates. Essential for understanding task breakdown and progress on complex tasks. Use this before marking tasks complete to ensure all subtasks are done.',
    {
      taskId: z.string().describe('Unique parent task identifier (numeric string, e.g., "25368707"). Returns all subtasks under this task. Get from get_all_tasks or get_task_details.')
    },
    withErrorHandling('get_subtasks', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/task/${taskId}/subtasks`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(SubtaskSchema)
    }
  );
}
