/**
 * Labels Tools
 * Tools for managing task labels in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { LabelSchema, TaskSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerLabelsTools(server) {
  // Find available labels
  registerToolWithMetadata(
    server,
    'find_available_labels',
    'Fetches all available task labels (tags) in Freelo, optionally filtered by project. Labels are used to categorize and filter tasks (e.g., "urgent", "bug", "feature", "design"). Essential before using get_all_tasks with label filters or when applying labels to tasks. Returns label names, colors, and usage counts.',
    {
      projectId: z.string().optional().describe('Optional: Project ID to get project-specific labels (numeric string, e.g., "197352"). If omitted, returns all labels across all projects. Get from get_projects.')
    },
    withErrorHandling('find_available_labels', async ({ projectId }) => {
      const apiClient = getApiClient();
      const params = projectId ? { project_id: projectId } : {};
      const response = await apiClient.get('/project-labels/find-available', { params });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(LabelSchema)
    }
  );

  // Add labels to task
  registerToolWithMetadata(
    server,
    'add_labels_to_task',
    'Adds one or more labels to a task. Labels are used for categorizing and filtering tasks (e.g., "bug", "urgent", "feature"). Multiple labels can be added at once. Use find_available_labels to discover available label UUIDs. For removing labels, use remove_labels_from_task.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      labelIds: z.array(z.number()).describe('Array of label IDs to add (e.g., [28279, 28280]). Get label IDs from find_available_labels.')
    },
    withErrorHandling('add_labels_to_task', async ({ taskId, labelIds }) => {
      const apiClient = getApiClient();
      const requestBody = {
        labels: labelIds.map(id => ({ id }))
      };
      const response = await apiClient.post(`/task-labels/add-to-task/${taskId}`, requestBody);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  // Remove labels from task
  registerToolWithMetadata(
    server,
    'remove_labels_from_task',
    'Removes one or more labels from a task. This is useful for cleaning up task categorization or removing outdated labels. Multiple labels can be removed at once. Only labels currently attached to the task can be removed. For adding labels, use add_labels_to_task.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      labelIds: z.array(z.number()).describe('Array of label IDs to remove (e.g., [28279, 28280]). Must be labels currently attached to this task.')
    },
    withErrorHandling('remove_labels_from_task', async ({ taskId, labelIds }) => {
      const apiClient = getApiClient();
      const requestBody = {
        labels: labelIds.map(id => ({ id }))
      };
      const response = await apiClient.post(`/task-labels/remove-from-task/${taskId}`, requestBody);
      return formatResponse(response.data);
    }),
    {
      outputSchema: TaskSchema
    }
  );

  // Edit project label
  registerToolWithMetadata(
    server,
    'edit_label',
    'Edits an existing project label (name, color, or visibility). Use this to update label properties without removing it from tasks. Get label IDs from find_available_labels.',
    {
      labelId: z.string().describe('Unique label identifier (numeric string, e.g., "12345"). Get from find_available_labels.'),
      labelData: z.object({
        name: z.string().describe('Label name (required by API)'),
        color: z.string().describe('Label color in hex format from allowed set: #77787a, #15acc0, #367fee, #10aa40, #f2830b, #ca3e99, #9235e4, #e9483a, #ffffff, #e3b51e, #e8384f, #fd612c, #fda41a, #f4bd38, #a4c61a, #62d26f, #37a862, #159ddc, #4186e0, #7a6ff0, #aa62e3, #e362e3, #ea4e9d, #fc91ad, #8da3a6, #e9e9e9'),
        is_private: z.boolean().optional().describe('Whether label is private (visible only to you). Defaults to false.')
      }).describe('Label update data - name and color are required by API')
    },
    withErrorHandling('edit_label', async ({ labelId, labelData }) => {
      const apiClient = getApiClient();
      const data = { ...labelData };
      if (data.is_private === undefined) data.is_private = false;
      const response = await apiClient.post(`/project-labels/${labelId}`, data);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  // Delete project label
  registerToolWithMetadata(
    server,
    'delete_label',
    'Deletes a project label permanently. The label will be removed from all tasks that have it. This action cannot be undone. Get label IDs from find_available_labels.',
    {
      labelId: z.string().describe('Unique label identifier (numeric string, e.g., "12345"). Get from find_available_labels.')
    },
    withErrorHandling('delete_label', async ({ labelId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/project-labels/${labelId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  // Add label to project
  registerToolWithMetadata(
    server,
    'add_label_to_project',
    'Adds an existing label to a project, making it available for tasks in that project. Use this to share labels across projects or associate a label with a specific project.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects.'),
      labelData: z.object({
        name: z.string().describe('Label name'),
        color: z.string().optional().describe('Label color in hex format (e.g., "#FF0000")'),
        is_private: z.boolean().optional().describe('Whether label is private'),
        id: z.number().optional().describe('ID of an existing label to add. If omitted, creates a new label.')
      }).describe('Label data to add to the project')
    },
    withErrorHandling('add_label_to_project', async ({ projectId, labelData }) => {
      const apiClient = getApiClient();
      const data = { ...labelData };
      if (data.is_private === undefined) data.is_private = false;
      const response = await apiClient.post(`/project-labels/add-to-project/${projectId}`, data);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  // Remove label from project
  registerToolWithMetadata(
    server,
    'remove_label_from_project',
    'Removes a label from a project. The label will no longer be available for tasks in this project but still exists globally. Use find_available_labels to get label details.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects.'),
      labelData: z.object({
        id: z.number().describe('ID of the label to remove from the project. Get from find_available_labels.'),
        name: z.string().optional().describe('Label name (for reference)'),
        color: z.string().optional().describe('Label color (for reference)')
      }).describe('Label data to remove from the project')
    },
    withErrorHandling('remove_label_from_project', async ({ projectId, labelData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project-labels/remove-from-project/${projectId}`, labelData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  // Create task labels
  registerToolWithMetadata(
    server,
    'create_task_labels',
    'Creates a new task label (tag) for categorizing tasks. Labels help organize and filter tasks across projects (e.g., "urgent", "bug", "feature", "design"). After creation, labels can be applied to tasks via edit_task or filtered with get_all_tasks. Use find_available_labels to see existing labels first.',
    {
      labelData: z.object({
        name: z.string().describe('Name of the label (e.g., "urgent", "bug", "feature", "design"). Should be short and descriptive for easy filtering.'),
        color: z.string().optional().describe('Optional: Color for the label in hex format (e.g., "#FF0000" for red, "#00FF00" for green). Used for visual distinction in UI.'),
        project_id: z.string().optional().describe('Optional: Project ID to associate label with specific project (numeric string, e.g., "197352"). If omitted, label is global. Get from get_projects.')
      }).describe('Label data')
    },
    withErrorHandling('create_task_labels', async ({ labelData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/task-labels', { labels: [labelData] });
      return formatResponse(response.data);
    }),
    {
      outputSchema: LabelSchema
    }
  );
}
