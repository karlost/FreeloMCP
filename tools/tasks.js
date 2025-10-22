/**
 * Tasks Tools
 * Handles all task-related operations
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { TaskSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerTasksTools(server) {
  registerToolWithMetadata(
    server,
    'get_all_tasks',
    'Fetches all tasks across all projects with powerful filtering options. Supports 14 different filters including fulltext search, project/tasklist filtering, label filtering, date ranges, worker assignment, and pagination. This is the primary tool for finding tasks - essential for task management workflows. For tasks in a specific tasklist, use get_tasklist_tasks for simpler queries.',
    {
      filters: z.object({
        search_query: z.string().optional().describe('Fulltext search in task names (case insensitive, e.g., "bug fix" or "feature")'),
        state_id: z.number().optional().describe('Filter by task state ID: 1=active, 2=finished. Use get_all_states for complete list.'),
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (e.g., [197352, 198000]). Get from get_projects or get_all_projects.'),
        tasklists_ids: z.array(z.number()).optional().describe('Filter by tasklist IDs (e.g., [12345, 67890]). Get from get_project_tasklists.'),
        order_by: z.enum(['priority', 'name', 'date_add', 'date_edited_at']).optional().describe('Sort by: "priority" (task priority), "name" (alphabetically), "date_add" (creation date), "date_edited_at" (last modified)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (ascending/A-Z/oldest first) or "desc" (descending/Z-A/newest first)'),
        with_label: z.string().optional().describe('Include only tasks with this label name (case insensitive, e.g., "urgent", "bug"). Get labels from find_available_labels.'),
        without_label: z.string().optional().describe('Exclude tasks with this label name (case insensitive). Useful for filtering out specific categories.'),
        no_due_date: z.boolean().optional().describe('When true, returns only tasks without a due date. Useful for finding unscheduled work.'),
        due_date_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-01")'),
          date_to: z.string().describe('End date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-31")')
        }).optional().describe('Filter tasks with due dates within this range. Useful for deadline management.'),
        finished_overdue: z.boolean().optional().describe('When true, returns only tasks finished after their due date (late completions). Good for performance tracking.'),
        finished_date_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS'),
          date_to: z.string().describe('End date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS')
        }).optional().describe('Filter by completion date range. Essential for reporting and retrospectives.'),
        worker_id: z.number().optional().describe('Filter by assigned worker ID (numeric, e.g., 12345). Get worker IDs from get_project_workers or get_users.'),
        p: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Critical for large task sets to avoid token limits.')
      }).optional().describe('Optional filters - combine multiple for precise queries')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-tasks', { params: filters });

        // Handle different response formats
        let data = response.data;
        if (data && data.data && data.data.tasks) {
          data = data.data.tasks;
        }

        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
      } catch (error) {
        console.error('Error in get_all_tasks:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Tool execution failed',
              message: error.message,
              details: error.response?.data || error.toString()
            })
          }],
          isError: true
        };
      }
    },
    {
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_tasklist_tasks',
    'Fetches tasks from a specific tasklist within a project. Simpler than get_all_tasks when you already know the project and tasklist. Returns tasks sorted by priority by default. Use this when drilling down from project → tasklist → tasks hierarchy. For cross-project task searches or complex filtering, use get_all_tasks instead.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists or get_tasklist_details.'),
      orderBy: z.enum(['priority', 'name', 'date_add', 'date_edited_at']).optional().describe('Sort by: "priority" (default, highest first), "name" (alphabetically), "date_add" (creation date), or "date_edited_at" (last modified)'),
      order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (ascending/A-Z/oldest first) or "desc" (descending/Z-A/newest first). Default: "asc"')
    },
    async ({ projectId, tasklistId, orderBy = 'priority', order = 'asc' }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/tasks`, {
          params: {
            order_by: orderBy,
            order: order
          }
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_tasklist_tasks:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Tool execution failed',
              message: error.message,
              details: error.response?.data || error.toString()
            })
          }],
          isError: true
        };
      }
    },
    {
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'create_task',
    'Creates a new task in a specific tasklist within a project. The task is created in active state by default. You can optionally assign it to a worker, set a due date, and add a description. After creation, use edit_task for modifications, or create_subtask to add subtasks. For creating from templates, use create_task_from_template instead.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique tasklist identifier where the task will be created (numeric string, e.g., "12345"). Get from get_project_tasklists.'),
      taskData: z.object({
        name: z.string().describe('Task name - clear and descriptive title (required, e.g., "Fix login bug" or "Design homepage mockup")'),
        description: z.string().optional().describe('Optional: Detailed task description in plain text or markdown. Use for context, requirements, or acceptance criteria.'),
        assignedTo: z.string().optional().describe('Optional: User ID to assign the task to (numeric string, e.g., "12345"). Get from get_project_workers. Leave empty for unassigned.'),
        dueDate: z.string().optional().describe('Optional: Due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-15" or "2025-10-15 17:00:00")')
      }).describe('Task creation data')
    },
    async ({ projectId, tasklistId, taskData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);

        // Transform description to comment.content for API
        const apiData = { ...taskData };
        if (taskData.description) {
          apiData.comment = { content: taskData.description };
          delete apiData.description;
        }

        const response = await apiClient.post(`/project/${projectId}/tasklist/${tasklistId}/tasks`, apiData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_task:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Tool execution failed',
              message: error.message,
              details: error.response?.data || error.toString()
            })
          }],
          isError: true
        };
      }
    },
    {
      outputSchema: TaskSchema
    }
  );

}
