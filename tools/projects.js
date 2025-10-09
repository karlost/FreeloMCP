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
    {
      projectData: z.object({
        name: z.string().describe('Název projektu'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).describe('Měna projektu (CZK, EUR, USD)'),
        project_owner_id: z.union([z.string(), z.number()]).optional().describe('ID vlastníka projektu (volitelné)')
      }).describe('Data pro vytvoření projektu')
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
    {
      projectId: z.string().describe('ID projektu')
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
    {
      projectId: z.string().describe('ID projektu k archivaci')
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
    {
      projectId: z.string().describe('ID projektu k aktivaci')
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
    {
      projectId: z.string().describe('ID projektu ke smazání')
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
