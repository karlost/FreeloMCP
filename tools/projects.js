/**
 * Projects Tools
 * Handles all project-related operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { ProjectSchema, ProjectDetailedSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerProjectsTools(server) {
  registerToolWithMetadata(
    server,
    'get_projects',
    'Fetches your own active projects in Freelo. Returns only projects that you own (where you are the project owner). For a complete list including shared projects, use get_all_projects instead. This is the quickest way to get an overview of projects you directly manage.',
    {},
    withErrorHandling('get_projects', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/projects');
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_all_projects',
    'Fetches all projects in Freelo - both projects you own and projects shared with you. Supports pagination for large datasets. Use this when you need a comprehensive view of all accessible projects, including archived and template projects. For just your own projects, use get_projects for better performance.',
    {},
    withErrorHandling('get_all_projects', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-projects');
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'create_project',
    'Creates a new project in Freelo. Requires a project name and currency. Optionally, you can specify a project owner (defaults to current user). The project will be created in active state. Use create_project_from_template if you want to create from an existing template instead.',
    {
      projectData: z.object({
        name: z.string().describe('Project name - clear and descriptive name for the new project'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).describe('Project currency code: CZK (Czech Koruna), EUR (Euro), or USD (US Dollar). This affects invoicing and budget features.'),
        project_owner_id: z.union([z.string(), z.number()]).optional().describe('Optional: User ID of project owner (numeric string like "12345"). If not specified, the current authenticated user becomes the owner. Get user IDs from get_users.')
      }).describe('Project creation data')
    },
    withErrorHandling('create_project', async ({ projectData }) => {
      const apiClient = getApiClient();
      const formattedData = { ...projectData };
      if (formattedData.project_owner_id !== undefined) {
        formattedData.project_owner_id = String(formattedData.project_owner_id);
      }
      const response = await apiClient.post('/projects', formattedData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_project_details',
    'Fetches detailed information about a specific project, including workers, tasklists, custom fields, and project settings. Use this after get_projects or get_all_projects to dive deeper into a specific project. Essential for understanding project structure before creating tasks or managing workers.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get project IDs from get_projects, get_all_projects, or other project listing tools.')
    },
    withErrorHandling('get_project_details', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/project/${projectId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectDetailedSchema
    }
  );

  registerToolWithMetadata(
    server,
    'archive_project',
    'Archives a project in Freelo. Archived projects are hidden from default views but remain accessible via get_archived_projects. All project data, tasks, and history are preserved. This is reversible - use activate_project to restore. Archiving is recommended over deletion for completed projects.',
    {
      projectId: z.string().describe('Unique project identifier to archive (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    withErrorHandling('archive_project', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project/${projectId}/archive`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectSchema
    }
  );

  registerToolWithMetadata(
    server,
    'activate_project',
    'Activates an archived project in Freelo. The project will become visible in default views again and all functionality will be restored. Use this to un-archive projects that were previously archived. Get archived project IDs from get_archived_projects.',
    {
      projectId: z.string().describe('Unique project identifier to activate (numeric string, e.g., "197352"). Must be an archived project - get IDs from get_archived_projects.')
    },
    withErrorHandling('activate_project', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project/${projectId}/activate`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_project',
    'Permanently deletes a project from Freelo. WARNING: This action is irreversible! All tasks, files, comments, and project data will be permanently lost. Consider using archive_project instead for completed projects to preserve data. Only use this when you are absolutely certain the project should be removed.',
    {
      projectId: z.string().describe('Unique project identifier to permanently delete (numeric string, e.g., "197352"). WARNING: This is irreversible - all project data will be lost! Get from get_projects or get_all_projects.')
    },
    withErrorHandling('delete_project', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/project/${projectId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_invited_projects',
    'Fetches projects where you have been invited as a collaborator but are not the owner. Returns projects shared with you by other users. Supports pagination. This is useful for viewing projects you contribute to but don\'t directly manage. For your own projects, use get_projects.',
    {
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Each page returns a batch of projects.')
    },
    withErrorHandling('get_invited_projects', async ({ page }) => {
      const apiClient = getApiClient();
      const params = page !== undefined ? { p: page } : {};
      const response = await apiClient.get('/invited-projects', { params });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_archived_projects',
    'Fetches archived projects in Freelo. Archived projects are completed or inactive projects hidden from default views but with all data preserved. Use this to find project IDs for reactivation with activate_project or to access historical project data. Supports pagination.',
    {
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Each page returns a batch of archived projects.')
    },
    withErrorHandling('get_archived_projects', async ({ page }) => {
      const apiClient = getApiClient();
      const params = page !== undefined ? { p: page } : {};
      const response = await apiClient.get('/archived-projects', { params });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_template_projects',
    'Fetches project templates in Freelo. Templates are reusable project structures with predefined tasklists, tasks, and settings. Use this to find templates for creating new projects with create_project_from_template. Supports filtering by name, date, tags, users, and pagination.',
    {
      filters: z.object({
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional().describe('Sort column: "name" (alphabetically), "date_add" (creation date), or "date_edited_at" (last modification)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (ascending/A-Z/oldest first) or "desc" (descending/Z-A/newest first)'),
        tags: z.array(z.string()).optional().describe('Filter by template tags (array of tag strings)'),
        users_ids: z.array(z.string()).optional().describe('Filter by user IDs who have access to templates (array of numeric strings)'),
        page: z.number().optional().describe('Page number for pagination, starts at 0')
      }).optional().describe('Optional filters for refining template results')
    },
    withErrorHandling('get_template_projects', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
      delete params.page;
      const response = await apiClient.get('/template-projects', { params });
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_user_projects',
    'Fetches all projects accessible to a specific user (by user ID). Returns projects the user owns or has been invited to. Useful for viewing another team member\'s workload or project portfolio. Supports filtering by project state (active/archived/finished), sorting, and pagination. Get user IDs from get_users first.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Get user IDs from get_users or get_project_workers.'),
      filters: z.object({
        states_ids: z.array(z.number()).optional().describe('Filter by project state IDs: 1=active, 2=archived, 3=template, 4=finished. Example: [1,4] for active and finished projects.'),
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional().describe('Sort column: "name", "date_add" (creation), or "date_edited_at" (last modified)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (A-Z/oldest first) or "desc" (Z-A/newest first)'),
        page: z.number().optional().describe('Page number for pagination, starts at 0')
      }).optional().describe('Optional filters for refining results')
    },
    withErrorHandling('get_user_projects', async ({ userId, filters = {} }) => {
      const apiClient = getApiClient();
      const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
      delete params.page;
      const response = await apiClient.get(`/user/${userId}/all-projects`, { params });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'create_project_from_template',
    'Creates a new project from an existing template. The new project will inherit the template\'s structure including tasklists, tasks, custom fields, and default settings. This is much faster than creating a project manually when you have standardized project structures. Get template IDs from get_template_projects first.',
    {
      templateId: z.string().describe('Unique template project identifier (numeric string, e.g., "197352"). Get template IDs from get_template_projects.'),
      projectData: z.object({
        name: z.string().describe('Name for the new project - should be descriptive and unique'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).optional().describe('Optional: Project currency (CZK, EUR, or USD). If not specified, inherits from template.')
      }).describe('Configuration data for the new project')
    },
    withErrorHandling('create_project_from_template', async ({ templateId, projectData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project/create-from-template/${templateId}`, projectData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: ProjectSchema
    }
  );
}
