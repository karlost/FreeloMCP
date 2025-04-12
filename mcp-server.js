/**
 * MCP Server for Freelo API
 * This server implements the Model Context Protocol for Freelo API integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default authentication values from environment variables
const DEFAULT_EMAIL = process.env.FREELO_EMAIL;
const DEFAULT_API_KEY = process.env.FREELO_API_KEY;
const DEFAULT_USER_AGENT = process.env.FREELO_USER_AGENT;

// Validate environment variables
if (!DEFAULT_EMAIL || !DEFAULT_API_KEY || !DEFAULT_USER_AGENT) {
  console.warn('Warning: One or more environment variables are missing (FREELO_EMAIL, FREELO_API_KEY, FREELO_USER_AGENT)');
  console.warn('Tools will require explicit authentication parameters.');
}

// Import controllers
import projectsController from './controllers/projects.js';
import tasksController from './controllers/tasks.js';
import tasklistsController from './controllers/tasklists.js';
import usersController from './controllers/users.js';
import filesController from './controllers/files.js';
import subtasksController from './controllers/subtasks.js';
import commentsController from './controllers/comments.js';
import { createApiClient } from './utils/apiClient.js';
import { handleToolError } from './utils/errorHandler.js';
import { formatResponse } from './utils/responseFormatter.js';

// Function to initialize the server and register tools
export function initializeMcpServer() {
  const server = new McpServer({
    name: 'freelo-mcp',
    version: '1.0.0',
    description: 'MCP Server for Freelo API v1'
  });

// Projects tools
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

// Tasks tools
server.tool(
  'get_all_tasks',
  {
    filters: z.object({
      projectId: z.string().optional(),
      tasklistId: z.string().optional(),
      status: z.string().optional()
    }).optional()
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
  }
);

server.tool(
  'get_tasklist_tasks',
  {
    projectId: z.string().describe('ID projektu'),
    tasklistId: z.string().describe('ID tasklistu'),
    orderBy: z.enum(['priority', 'name', 'date_add', 'date_edited_at']).optional().describe('Sloupec pro řazení (priority, name, date_add, date_edited_at)'),
    order: z.enum(['asc', 'desc']).optional().describe('Směr řazení (asc, desc)')
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
  }
);

server.tool(
  'create_task',
  {
    projectId: z.string(),
    tasklistId: z.string(),
    taskData: z.object({
      name: z.string(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      dueDate: z.string().optional()
    })
  },
  async ({ projectId, tasklistId, taskData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/project/${projectId}/tasklist/${tasklistId}/tasks`, taskData);
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
  }
);

// Tasklists tools
server.tool(
  'get_project_tasklists',
  {
    projectId: z.string()
  },
  async ({ projectId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      // Zkusíme použít endpoint pro všechny tasklisty s filtrem na projekt
      const response = await apiClient.get('/all-tasklists', {
        params: {
          projects_ids: [projectId]
        }
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_project_tasklists:', error);
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

// Users tools
server.tool(
  'get_users',
  {},
  async () => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.get('/users');
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_users:', error);
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

// Users tools
server.tool(
  'remove_workers',
  {
    projectId: z.string().describe('ID of the project to remove workers from'),
    userIds: z.array(z.string()).describe('Array of user IDs to remove from the project')
  },
  async ({ projectId, userIds }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/project/${projectId}/remove-workers`, {
        users_ids: userIds
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in remove_workers:', error);
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

 // Files tools
server.tool(
  'get_all_files',
  {},
  async () => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.get('/all-docs-and-files');
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_all_files:', error);
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

// Upload file tool
server.tool(
  'upload_file',
  {
    fileData: z.string().describe('Base64-encoded file data'),
    fileName: z.string().describe('Name of the file')
  },
  async ({ fileData, fileName }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };

      // Create API client
      const apiClient = createApiClient(auth);

      // Create FormData
      const form = new FormData();

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileData, 'base64');

      // Append file to form
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });

      // Set custom headers for this request
      const headers = {
        ...form.getHeaders(),
        'Authorization': `Basic ${Buffer.from(`${auth.email}:${auth.apiKey}`).toString('base64')}`,
        'User-Agent': auth.userAgent
      };

      // Make request
      const response = await apiClient.post('/file/upload', form, { headers });

      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in upload_file:', error);
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

// Download file tool
server.tool(
  'download_file',
  {
    fileUuid: z.string().describe('UUID of the file to download')
  },
  async ({ fileUuid }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };

      // Create API client
      const apiClient = createApiClient(auth);

      // Set responseType to arraybuffer to get binary data
      const response = await apiClient.get(`/file/${fileUuid}`, {
        responseType: 'arraybuffer'
      });

      // Convert binary data to base64
      const base64Data = Buffer.from(response.data).toString('base64');

      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Get filename from content-disposition header if available
      let filename = fileUuid;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            filename,
            contentType,
            data: base64Data
          })
        }]
      };
    } catch (error) {
      console.error('Error in download_file:', error);
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

// Subtasks tools
server.tool(
  'create_subtask',
  {
    taskId: z.string(),
    subtaskData: z.object({
      name: z.string(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      dueDate: z.string().optional()
    })
  },
  async ({ taskId, subtaskData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/task/${taskId}/subtasks`, subtaskData);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in create_subtask:', error);
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

// Get subtasks tool
server.tool(
  'get_subtasks',
  {
    taskId: z.string()
  },
  async ({ taskId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.get(`/task/${taskId}/subtasks`);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_subtasks:', error);
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



// Create tasklist tool
server.tool(
  'create_tasklist',
  {
    projectId: z.string(),
    tasklistData: z.object({
      name: z.string(),
      description: z.string().optional(),
      color: z.string().optional()
    })
  },
  async ({ projectId, tasklistData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/project/${projectId}/tasklists`, tasklistData);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in create_tasklist:', error);
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

// Get task details tool
server.tool(
  'get_task_details',
  {
    taskId: z.string()
  },
  async ({ taskId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.get(`/task/${taskId}`);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_task_details:', error);
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

// Edit task tool
server.tool(
  'edit_task',
  {
    taskId: z.string(),
    taskData: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.number().optional(),
      status: z.string().optional()
    })
  },
  async ({ taskId, taskData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/task/${taskId}`, taskData);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in edit_task:', error);
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

// Delete task tool
server.tool(
  'delete_task',
  {
    taskId: z.string()
  },
  async ({ taskId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.delete(`/task/${taskId}`);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in delete_task:', error);
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

// Finish task tool
server.tool(
  'finish_task',
  {
    taskId: z.string().describe('ID of the task to finish')
  },
  async ({ taskId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/task/${taskId}/finish`);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in finish_task:', error);
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

// Activate task tool
server.tool(
  'activate_task',
  {
    taskId: z.string().describe('ID of the task to activate')
  },
  async ({ taskId }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/task/${taskId}/activate`);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in activate_task:', error);
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

// Removed non-functional delete_subtask tool

// Create comment tool
server.tool(
  'create_comment',
  {
    taskId: z.string(),
    commentData: z.object({
      content: z.string().describe('Obsah komentáře'),
      attachments: z.array(z.string()).optional().describe('ID příloh (volitelné)')
    }).describe('Data pro vytvoření komentáře')
  },
  async ({ taskId, commentData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/task/${taskId}/comments`, commentData);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in create_comment:', error);
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

// Removed non-functional edit_subtask tool

// Edit comment tool
server.tool(
  'edit_comment',
  {
    commentId: z.string().describe('ID of the comment to edit'),
    commentData: z.object({
      content: z.string().describe('Updated content of the comment'),
      files: z.array(z.object({
        download_url: z.string().describe('URL to download the file from'),
        filename: z.string().optional().describe('Name of the file')
      })).optional().describe('Array of files to attach to the comment')
    }).describe('Updated comment data')
  },
  async ({ commentId, commentData }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);
      const response = await apiClient.post(`/comment/${commentId}`, commentData);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in edit_comment:', error);
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



// Add labels to task tool
server.tool(
  'add_labels_to_task',
  {
    taskId: z.string().describe('ID of the task to add labels to'),
    labelUuids: z.array(z.string()).describe('Array of label UUIDs to add to the task')
  },
  async ({ taskId, labelUuids }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);

      // Format the request body
      const requestBody = {
        labels: labelUuids.map(uuid => ({ uuid }))
      };

      const response = await apiClient.post(`/task-labels/add-to-task/${taskId}`, requestBody);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in add_labels_to_task:', error);
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

// Remove labels from task tool
server.tool(
  'remove_labels_from_task',
  {
    taskId: z.string().describe('ID of the task to remove labels from'),
    labelUuids: z.array(z.string()).describe('Array of label UUIDs to remove from the task')
  },
  async ({ taskId, labelUuids }) => {
    try {
      const auth = {
        email: process.env.FREELO_EMAIL,
        apiKey: process.env.FREELO_API_KEY,
        userAgent: process.env.FREELO_USER_AGENT
      };
      const apiClient = createApiClient(auth);

      // Format the request body
      const requestBody = {
        labels: labelUuids.map(uuid => ({ uuid }))
      };

      const response = await apiClient.post(`/task-labels/remove-from-task/${taskId}`, requestBody);
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in remove_labels_from_task:', error);
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


// Create user time estimate tool




  return server; // Return the initialized server instance
}

// Only initialize and start listening if the script is run directly
// This prevents the server from starting automatically when imported (e.g., in tests)
// Determine if the script is the main module being run
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const serverInstance = initializeMcpServer();
  const transport = new StdioServerTransport();
  // Use connect instead of listen for StdioTransport
  serverInstance.connect(transport);

  console.log('MCP Server started via Stdio');
  if (DEFAULT_EMAIL && DEFAULT_API_KEY && DEFAULT_USER_AGENT) {
    console.log(`Using environment variables for authentication:`);
    console.log(`- FREELO_EMAIL: ${DEFAULT_EMAIL}`);
    console.log(`- FREELO_API_KEY: ${DEFAULT_API_KEY.substring(0, 5)}...`);
    console.log(`- FREELO_USER_AGENT: ${DEFAULT_USER_AGENT}`);
  } else {
    console.log('No environment variables found for authentication.');
    console.log('Tools will require explicit authentication parameters.');
  }
}
