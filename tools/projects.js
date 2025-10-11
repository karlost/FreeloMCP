/**
 * Projects Tools
 * Handles all project-related operations
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';

export function registerProjectsTools(server) {
  server.tool(
    'get_projects',
    'Fetches your own active projects in Freelo. Returns only projects that you own (where you are the project owner). For a complete list including shared projects, use get_all_projects instead. This is the quickest way to get an overview of projects you directly manage.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/projects');
        return formatResponse(response.data);
      } catch (error) {
        return handleToolError(error, 'get_projects');
      }
    }
  );
  
  server.tool(
    'get_all_projects',
    'Fetches all projects in Freelo - both projects you own and projects shared with you. Supports pagination for large datasets. Use this when you need a comprehensive view of all accessible projects, including archived and template projects. For just your own projects, use get_projects for better performance.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-projects');
        return formatResponse(response.data);
      } catch (error) {
        return handleToolError(error, 'get_all_projects');
      }
    }
  );
  
  server.tool(
    'create_project',
    'Creates a new project in Freelo. Requires a project name and currency. Optionally, you can specify a project owner (defaults to current user). The project will be created in active state. Use create_project_from_template if you want to create from an existing template instead.',
    {
      projectData: z.object({
        name: z.string().describe('Project name - clear and descriptive name for the new project'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).describe('Project currency code: CZK (Czech Koruna), EUR (Euro), or USD (US Dollar). This affects invoicing and budget features.'),
        project_owner_id: z.union([z.string(), z.number()]).optional().describe('Optional: User ID of project owner (numeric string like "12345"). If not specified, the current authenticated user becomes the owner. Get user IDs from get_users.')
      }).describe('Project creation data')
    },
    async ({ projectData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Ensure project_owner_id is a string if provided
        const formattedData = { ...projectData };
        if (formattedData.project_owner_id !== undefined) {
          formattedData.project_owner_id = String(formattedData.project_owner_id);
        }
  
        const response = await apiClient.post('/projects', formattedData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_project:', error);
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
    }
  );
  
  server.tool(
    'get_project_details',
    'Fetches detailed information about a specific project, including workers, tasklists, custom fields, and project settings. Use this after get_projects or get_all_projects to dive deeper into a specific project. Essential for understanding project structure before creating tasks or managing workers.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get project IDs from get_projects, get_all_projects, or other project listing tools.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_project_details:', error);
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
    }
  );
  
  server.tool(
    'archive_project',
    'Archives a project in Freelo. Archived projects are hidden from default views but remain accessible via get_archived_projects. All project data, tasks, and history are preserved. This is reversible - use activate_project to restore. Archiving is recommended over deletion for completed projects.',
    {
      projectId: z.string().describe('Unique project identifier to archive (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/archive`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in archive_project:', error);
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
    }
  );
  
  server.tool(
    'activate_project',
    'Activates an archived project in Freelo. The project will become visible in default views again and all functionality will be restored. Use this to un-archive projects that were previously archived. Get archived project IDs from get_archived_projects.',
    {
      projectId: z.string().describe('Unique project identifier to activate (numeric string, e.g., "197352"). Must be an archived project - get IDs from get_archived_projects.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/activate`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in activate_project:', error);
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
    }
  );
  
  server.tool(
    'delete_project',
    'Permanently deletes a project from Freelo. WARNING: This action is irreversible! All tasks, files, comments, and project data will be permanently lost. Consider using archive_project instead for completed projects to preserve data. Only use this when you are absolutely certain the project should be removed.',
    {
      projectId: z.string().describe('Unique project identifier to permanently delete (numeric string, e.g., "197352"). WARNING: This is irreversible - all project data will be lost! Get from get_projects or get_all_projects.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/project/${projectId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_project:', error);
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
    }
  );
}
