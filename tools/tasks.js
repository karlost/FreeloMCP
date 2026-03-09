/**
 * Tasks Tools
 * Handles all task-related operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { TaskSchema, TaskDetailedSchema, createArrayResponseSchema } from '../utils/schemas.js';

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
    withErrorHandling('get_all_tasks', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-tasks', { params: filters });

      let data = response.data;
      if (data && data.data && data.data.tasks) {
        data = data.data.tasks;
      }

      return formatResponse(data);
    }),
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
    withErrorHandling('get_tasklist_tasks', async ({ projectId, tasklistId, orderBy = 'priority', order = 'asc' }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/tasks`, {
        params: {
          order_by: orderBy,
          order: order
        }
      });
      return formatResponse(response.data);
    }),
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
        worker: z.number().optional().describe('Optional: User ID to assign the task to (numeric, e.g., 12345). Get from get_project_workers. Leave empty for unassigned.'),
        dueDate: z.string().optional().describe('Optional: Due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-15" or "2025-10-15 17:00:00")')
      }).describe('Task creation data')
    },
    withErrorHandling('create_task', async ({ projectId, tasklistId, taskData }) => {
      const apiClient = getApiClient();

      const apiData = { ...taskData };
      if (taskData.description) {
        apiData.comment = { content: taskData.description };
        delete apiData.description;
      }
      if (taskData.dueDate) {
        apiData.due_date = taskData.dueDate;
        delete apiData.dueDate;
      }

      const response = await apiClient.post(`/project/${projectId}/tasklist/${tasklistId}/tasks`, apiData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_task_details',
    'Fetches complete details about a specific task including name, description, assignees, due date, priority, status, labels, custom fields, and metadata. Use this after finding tasks with get_all_tasks or get_tasklist_tasks to get full information before editing or taking action. Essential for understanding task context.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks, get_tasklist_tasks, or after create_task.')
    },
    withErrorHandling('get_task_details', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/task/${taskId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskDetailedSchema
    }
  );

  registerToolWithMetadata(
    server,
    'edit_task',
    'Updates an existing task with new information. You can modify any combination of name, assignment, due date, or priority. All fields are optional - only provide the fields you want to change. Get task details with get_task_details first to see current values. IMPORTANT: To update task description, use update_task_description instead - this endpoint does not support description updates.',
    {
      taskId: z.string().describe('Unique task identifier to update (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      taskData: z.object({
        name: z.string().optional().describe('Optional: New task name/title'),
        worker: z.number().optional().describe('Optional: User ID to assign task to (numeric). Get from get_project_workers.'),
        dueDate: z.string().optional().describe('Optional: New due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS'),
        priority: z.enum(['h', 'm', 'l']).optional().nullable().describe('Priority: h=high, m=medium, l=low')
      }).describe('Task update data - only include fields to change')
    },
    withErrorHandling('edit_task', async ({ taskId, taskData }) => {
      const apiClient = getApiClient();
      const apiData = { ...taskData };
      if (taskData.dueDate) {
        apiData.due_date = taskData.dueDate;
        delete apiData.dueDate;
      }
      const response = await apiClient.post(`/task/${taskId}`, apiData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_task',
    'Permanently deletes a task from Freelo. WARNING: This is irreversible! All task data including description, comments, attachments, subtasks, and history will be lost. Consider using finish_task instead to mark tasks as complete while preserving history. Only use when you are absolutely certain the task should be removed.',
    {
      taskId: z.string().describe('Unique task identifier to permanently delete (numeric string, e.g., "25368707"). WARNING: This is irreversible! Get from get_all_tasks or get_task_details.')
    },
    withErrorHandling('delete_task', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/task/${taskId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'finish_task',
    'Marks a task as finished/completed. The task will be moved to finished state, preserving all data and history. Finished tasks can be reactivated later with activate_task if needed. This is the standard way to complete tasks - much safer than delete_task. Essential for task workflow completion.',
    {
      taskId: z.string().describe('Unique task identifier to mark as finished (numeric string, e.g., "25368707"). Get from get_all_tasks or get_tasklist_tasks.')
    },
    withErrorHandling('finish_task', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/finish`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'activate_task',
    'Reactivates a finished task, moving it back to active state. Use this when a completed task needs to be reopened or when work needs to continue. The task will become visible in active task lists again. Get finished tasks with get_finished_tasks or filter get_all_tasks with state_id=2.',
    {
      taskId: z.string().describe('Unique task identifier to reactivate (numeric string, e.g., "25368707"). Must be a finished task - get from get_finished_tasks.')
    },
    withErrorHandling('activate_task', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/activate`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_finished_tasks',
    'Fetches completed/finished tasks from a specific tasklist. Returns tasks that have been marked as done with finish_task. Useful for reviewing completed work, generating reports, or finding tasks to reactivate. Optionally filter results with fulltext search. For finished tasks across all projects, use get_all_tasks with state_id=2 instead.',
    {
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists.'),
      search_query: z.string().optional().describe('Optional: Fulltext search query to filter finished task names (case insensitive, e.g., "bug fix")')
    },
    withErrorHandling('get_finished_tasks', async ({ tasklistId, search_query }) => {
      const apiClient = getApiClient();
      const params = search_query ? { search_query } : {};
      const response = await apiClient.get(`/tasklist/${tasklistId}/finished-tasks`, { params });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'move_task',
    'Moves a task from its current tasklist to a different tasklist. The target tasklist can be in the same project or a different project. Task data, comments, attachments, and history are preserved. Use this for reorganizing work or transferring tasks between project phases. The task ID remains the same after moving.',
    {
      taskId: z.string().describe('Unique task identifier to move (numeric string, e.g., "25368707"). Get from get_all_tasks or get_tasklist_tasks.'),
      targetTasklistId: z.string().describe('Unique identifier of destination tasklist (numeric string, e.g., "12345"). Can be in same or different project. Get from get_project_tasklists.')
    },
    withErrorHandling('move_task', async ({ taskId, targetTasklistId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/move/${targetTasklistId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_task_description',
    'Fetches only the description content of a task. More lightweight than get_task_details when you only need the description text. Useful for reading task details without fetching full task metadata. Descriptions can contain plain text or markdown formatting with requirements, acceptance criteria, or notes.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.')
    },
    withErrorHandling('get_task_description', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/task/${taskId}/description`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskDetailedSchema
    }
  );

  registerToolWithMetadata(
    server,
    'update_task_description',
    'Updates only the description of a task without affecting other task properties. More efficient than edit_task when only changing the description. Supports plain text or markdown. Use this to add context, requirements, acceptance criteria, or technical notes. Previous description is replaced completely.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      description: z.string().describe('New description content in plain text or markdown. Replaces existing description completely. Use empty string to clear description.')
    },
    withErrorHandling('update_task_description', async ({ taskId, description }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/description`, { content: description });
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskDetailedSchema
    }
  );

  registerToolWithMetadata(
    server,
    'create_task_reminder',
    'Creates a reminder notification for a task that will be sent at the specified date/time. Users will receive notifications in Freelo to check the task. Useful for follow-ups, deadlines, or periodic reviews. You can remind specific users or use default assignees. Delete with delete_task_reminder if needed.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      reminderData: z.object({
        date: z.string().describe('Reminder date and time in ISO 8601 format (e.g., "2025-10-15T14:00:00Z" or "2025-10-15T14:00:00+02:00"). Users will be notified at this time.'),
        user_ids: z.array(z.string()).optional().describe('Optional: Array of user IDs to remind (e.g., ["12345", "67890"]). If not specified, task assignees are reminded. Get IDs from get_project_workers.')
      }).describe('Reminder configuration data')
    },
    withErrorHandling('create_task_reminder', async ({ taskId, reminderData }) => {
      const apiClient = getApiClient();
      const apiData = {
        remind_at: reminderData.date,
        ...(reminderData.user_ids && { user_ids: reminderData.user_ids })
      };
      const response = await apiClient.post(`/task/${taskId}/reminder`, apiData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_task_reminder',
    'Removes an existing reminder from a task. Use this to cancel scheduled reminders that are no longer needed or were set incorrectly. The task itself is not affected - only the reminder is removed. Users will no longer receive the scheduled notification.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing reminder. Get from get_all_tasks or get_task_details.')
    },
    withErrorHandling('delete_task_reminder', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/task/${taskId}/reminder`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_public_link',
    'Generates or retrieves a public sharing link for a task. Anyone with this link can view the task details without logging into Freelo - useful for sharing with external stakeholders, clients, or contractors. The link remains active until deleted with delete_public_link. Task content is read-only via public links.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details. A public link will be generated if none exists.')
    },
    withErrorHandling('get_public_link', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/public-link/task/${taskId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ url: z.string().url() })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_public_link',
    'Removes the public sharing link for a task. After deletion, the previous link URL will no longer work and task details will no longer be accessible without authentication. Use this when you no longer want to share the task publicly or when project information becomes confidential. The task itself is not deleted.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing public link. Get from get_all_tasks or after get_public_link.')
    },
    withErrorHandling('delete_public_link', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/public-link/task/${taskId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'create_task_from_template',
    'Creates a new task based on an existing template task. The new task inherits the template\'s name, description, custom fields, subtasks, and structure. Saves time when creating repetitive tasks with standardized formats. Find templates in template projects using get_template_projects. After creation, you can modify the task with edit_task.',
    {
      templateId: z.string().describe('Unique template task identifier (numeric string, e.g., "25368707"). Get template tasks from projects returned by get_template_projects.'),
      projectId: z.string().describe('Unique identifier of target project where task will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique identifier of target tasklist where task will be created (numeric string, e.g., "12345"). Get from get_project_tasklists.')
    },
    withErrorHandling('create_task_from_template', async ({ templateId, projectId, tasklistId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/create-from-template/${templateId}`, {
        task_id: parseInt(templateId, 10),
        target_project_id: parseInt(projectId, 10),
        target_tasklist_id: parseInt(tasklistId, 10)
      });
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'set_total_time_estimate',
    'Sets the total estimated time for completing a task in minutes. This is a PREMIUM FEATURE and may require a paid Freelo plan (returns 402 Payment Required on free plans). Estimates help with project planning, resource allocation, and deadline forecasting. Use set_user_time_estimate for per-user estimates instead. Delete with delete_total_time_estimate.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      minutes: z.number().describe('Total estimated time in minutes (e.g., 60 for 1 hour, 480 for 8 hours, 120 for 2 hours). Must be positive number.')
    },
    withErrorHandling('set_total_time_estimate', async ({ taskId, minutes }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/total-time-estimate`, { minutes });
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_total_time_estimate',
    'Removes the total time estimate from a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Use this when estimates are no longer needed or were set incorrectly. The task itself is not affected. Time tracking history is preserved.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing total time estimate. Get from get_all_tasks or get_task_details.')
    },
    withErrorHandling('delete_total_time_estimate', async ({ taskId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/task/${taskId}/total-time-estimate`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'set_user_time_estimate',
    'Sets a time estimate for a specific user on a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Useful for collaborative tasks where different team members contribute different amounts of time. Each user can have their own estimate. Use set_total_time_estimate for overall task estimate instead. Delete with delete_user_time_estimate.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). User should be assigned to task or project. Get from get_project_workers.'),
      minutes: z.number().describe('Estimated time for this specific user in minutes (e.g., 120 for 2 hours, 60 for 1 hour). Must be positive number.')
    },
    withErrorHandling('set_user_time_estimate', async ({ taskId, userId, minutes }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/task/${taskId}/users-time-estimates/${userId}`, { minutes });
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_user_time_estimate',
    'Removes a user-specific time estimate from a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Use this when a user\'s estimate is no longer needed or was set incorrectly. Other users\' estimates and the task itself are not affected.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing user time estimate. Get from get_all_tasks or get_task_details.'),
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Must have an existing time estimate on this task. Get from get_project_workers.')
    },
    withErrorHandling('delete_user_time_estimate', async ({ taskId, userId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/task/${taskId}/users-time-estimates/${userId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );
}
