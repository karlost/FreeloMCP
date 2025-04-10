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

// Initialize MCP server
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
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_projects:', error);
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
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    } catch (error) {
      console.error('Error in get_all_projects:', error);
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
      const response = await apiClient.get(`/project/${projectId}/tasklists`);
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

// Create comment tool
server.tool(
  'create_comment',
  {
    taskId: z.string(),
    commentData: z.object({
      text: z.string(),
      attachments: z.array(z.string()).optional()
    })
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

// Connect the server to stdio transport
const transport = new StdioServerTransport();
server.connect(transport);

// Log server startup information
console.log('MCP Server started');
if (DEFAULT_EMAIL && DEFAULT_API_KEY && DEFAULT_USER_AGENT) {
  console.log(`Using environment variables for authentication:`);
  console.log(`- FREELO_EMAIL: ${DEFAULT_EMAIL}`);
  console.log(`- FREELO_API_KEY: ${DEFAULT_API_KEY.substring(0, 5)}...`);
  console.log(`- FREELO_USER_AGENT: ${DEFAULT_USER_AGENT}`);
} else {
  console.log('No environment variables found for authentication.');
  console.log('Tools will require explicit authentication parameters.');
}
