/**
 * Tasklists Tools
 * Tools for managing tasklists in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { TasklistSchema, UserSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerTasklistsTools(server) {
  // Get project tasklists
  registerToolWithMetadata(
    server,
    'get_project_tasklists',
    'Fetches all tasklists within a project. Tasklists organize tasks into logical groups or phases (e.g., "To Do", "In Progress", "Done" or "Design", "Development", "Testing"). Essential for understanding project structure before creating or finding tasks. Use this after get_project_details to drill down into project organization.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects, get_all_projects, or get_project_details.')
    },
    withErrorHandling('get_project_tasklists', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-tasklists', {
        params: {
          projects_ids: [projectId]
        }
      });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(TasklistSchema)
    }
  );

  // Create tasklist
  registerToolWithMetadata(
    server,
    'create_tasklist',
    'Creates a new tasklist (task group) within a project. Tasklists help organize tasks into phases, sprints, or categories. Common examples: "Backlog", "Sprint 1", "Design Phase", "Bug Fixes". After creation, use create_task to add tasks. For creating from templates, use create_tasklist_from_template instead.',
    {
      projectId: z.string().describe('Unique project identifier where tasklist will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistData: z.object({
        name: z.string().describe('Tasklist name - clear and descriptive (e.g., "Sprint 1", "Design Phase")'),
        description: z.string().optional().describe('Optional: Description of the tasklist purpose'),
        color: z.string().optional().describe('Optional: Tasklist color as hex code (e.g., "#ff0000")')
      }).describe('Tasklist creation data')
    },
    withErrorHandling('create_tasklist', async ({ projectId, tasklistData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project/${projectId}/tasklists`, tasklistData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TasklistSchema
    }
  );

  // Get tasklist details
  registerToolWithMetadata(
    server,
    'get_tasklist_details',
    'Fetches detailed information about a specific tasklist including name, description, color, workers, and settings. Use this after get_project_tasklists to understand tasklist configuration before creating tasks or managing workers. Essential for understanding tasklist structure and permissions.',
    {
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists or get_all_projects.')
    },
    withErrorHandling('get_tasklist_details', async ({ tasklistId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/tasklist/${tasklistId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TasklistSchema
    }
  );

  // Get assignable workers
  registerToolWithMetadata(
    server,
    'get_assignable_workers',
    'Fetches the list of users who can be assigned to tasks in a specific tasklist. This considers project permissions and tasklist worker restrictions. Use this before creating or assigning tasks to ensure the assignee has access. Returns user details including names, IDs, and availability.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists.')
    },
    withErrorHandling('get_assignable_workers', async ({ projectId, tasklistId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/assignable-workers`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );

  // Create tasklist from template
  registerToolWithMetadata(
    server,
    'create_tasklist_from_template',
    'Creates a new tasklist based on an existing template tasklist. The new tasklist inherits the template\'s structure, tasks, and settings. Much faster than creating tasklists manually when you have standardized workflows. Find template tasklists in template projects using get_template_projects.',
    {
      templateId: z.string().describe('Unique template tasklist identifier (numeric string, e.g., "12345"). Get from tasklists in template projects returned by get_template_projects.'),
      projectId: z.string().describe('Unique identifier of target project where tasklist will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    withErrorHandling('create_tasklist_from_template', async ({ templateId, projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/tasklist/create-from-template/${templateId}`, {
        tasklist_id: parseInt(templateId),
        target_project_id: parseInt(projectId)
      });
      return formatResponse(response.data);
    }),
    {
      outputSchema: TasklistSchema
    }
  );
}
