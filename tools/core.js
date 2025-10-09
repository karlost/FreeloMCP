/**
 * Core Tools
 * All remaining Freelo MCP tools (to be split into specific modules)
 */

import { z } from 'zod';
import FormData from 'form-data';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';

export function registerCoreTools(server) {
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
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Projects IDs array'),
        type: z.enum(['directory', 'link', 'file', 'document']).optional().describe('Items type'),
        p: z.number().optional().describe('Page number (starts from 0)')
      }).optional().describe('Optional filters for files and documents')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-docs-and-files', { params: filters });
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
  
  
  // ====================
  // EXTENDED PROJECTS TOOLS
  // ====================
  
  // Get invited projects
  server.tool(
    'get_invited_projects',
    {
      page: z.number().optional().describe('Page number (default: 0)')
    },
    async ({ page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get('/invited-projects', { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_invited_projects:', error);
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
  
  // Get archived projects
  server.tool(
    'get_archived_projects',
    {
      page: z.number().optional().describe('Page number (default: 0)')
    },
    async ({ page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get('/archived-projects', { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_archived_projects:', error);
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
  
  // Get template projects
  server.tool(
    'get_template_projects',
    {
      filters: z.object({
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
        tags: z.array(z.string()).optional(),
        users_ids: z.array(z.string()).optional(),
        page: z.number().optional()
      }).optional().describe('Optional filters for template projects')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
        delete params.page;
        const response = await apiClient.get('/template-projects', { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_template_projects:', error);
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
  
  // Get user projects
  server.tool(
    'get_user_projects',
    {
      userId: z.string().describe('ID of the user'),
      filters: z.object({
        states_ids: z.array(z.number()).optional(),
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
        page: z.number().optional()
      }).optional().describe('Optional filters')
    },
    async ({ userId, filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
        delete params.page;
        const response = await apiClient.get(`/user/${userId}/all-projects`, { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_user_projects:', error);
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
  
  // Get project workers
  server.tool(
    'get_project_workers',
    {
      projectId: z.string().describe('ID of the project'),
      page: z.number().optional().describe('Page number (default: 0)')
    },
    async ({ projectId, page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get(`/project/${projectId}/workers`, { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_project_workers:', error);
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
  
  // Remove workers by emails
  server.tool(
    'remove_workers_by_emails',
    {
      projectId: z.string().describe('ID of the project'),
      emails: z.array(z.string()).describe('Array of email addresses to remove')
    },
    async ({ projectId, emails }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/remove-workers/by-emails`, {
          emails: emails
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in remove_workers_by_emails:', error);
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
  
  // Create project from template
  server.tool(
    'create_project_from_template',
    {
      templateId: z.string().describe('ID of the template project'),
      projectData: z.object({
        name: z.string().describe('Name of the new project'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).optional().describe('Currency (CZK, EUR, USD)')
      }).describe('Data for the new project')
    },
    async ({ templateId, projectData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/create-from-template/${templateId}`, projectData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_project_from_template:', error);
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
  
  // ====================
  // EXTENDED TASKS TOOLS
  // ====================
  
  // Get finished tasks in tasklist
  server.tool(
    'get_finished_tasks',
    {
      tasklistId: z.string().describe('ID of the tasklist'),
      search_query: z.string().optional().describe('Search query for filtering tasks')
    },
    async ({ tasklistId, search_query }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = search_query ? { search_query } : {};
        const response = await apiClient.get(`/tasklist/${tasklistId}/finished-tasks`, { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_finished_tasks:', error);
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
  
  // Move task to different tasklist
  server.tool(
    'move_task',
    {
      taskId: z.string().describe('ID of the task to move'),
      targetTasklistId: z.string().describe('ID of the target tasklist')
    },
    async ({ taskId, targetTasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/move/${targetTasklistId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in move_task:', error);
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
  
  // Get task description
  server.tool(
    'get_task_description',
    {
      taskId: z.string().describe('ID of the task')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/task/${taskId}/description`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_task_description:', error);
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
  
  // Update task description
  server.tool(
    'update_task_description',
    {
      taskId: z.string().describe('ID of the task'),
      description: z.string().describe('New description content')
    },
    async ({ taskId, description }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/description`, { content: description });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in update_task_description:', error);
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
  
  // Create task reminder
  server.tool(
    'create_task_reminder',
    {
      taskId: z.string().describe('ID of the task'),
      reminderData: z.object({
        date: z.string().describe('Reminder date in ISO 8601 format'),
        user_ids: z.array(z.string()).optional().describe('Array of user IDs to remind')
      }).describe('Reminder data')
    },
    async ({ taskId, reminderData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Transform date -> remind_at for API
        const apiData = {
          remind_at: reminderData.date,
          ...(reminderData.user_ids && { user_ids: reminderData.user_ids })
        };
        const response = await apiClient.post(`/task/${taskId}/reminder`, apiData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_task_reminder:', error);
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
  
  // Delete task reminder
  server.tool(
    'delete_task_reminder',
    {
      taskId: z.string().describe('ID of the task')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/reminder`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_task_reminder:', error);
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
  
  // Get public link for task
  server.tool(
    'get_public_link',
    {
      taskId: z.string().describe('ID of the task')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/public-link/task/${taskId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_public_link:', error);
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
  
  // Delete public link for task
  server.tool(
    'delete_public_link',
    {
      taskId: z.string().describe('ID of the task')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/public-link/task/${taskId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_public_link:', error);
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
  
  // Create task from template
  server.tool(
    'create_task_from_template',
    {
      templateId: z.string().describe('ID of the template task'),
      projectId: z.string().describe('ID of the target project'),
      tasklistId: z.string().describe('ID of the target tasklist')
    },
    async ({ templateId, projectId, tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/create-from-template/${templateId}`, {
          project_id: projectId,
          tasklist_id: tasklistId
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_task_from_template:', error);
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
  
  // Set total time estimate for task
  server.tool(
    'set_total_time_estimate',
    {
      taskId: z.string().describe('ID of the task'),
      minutes: z.number().describe('Total estimated minutes')
    },
    async ({ taskId, minutes }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/total-time-estimate`, { minutes });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in set_total_time_estimate:', error);
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
  
  // Delete total time estimate
  server.tool(
    'delete_total_time_estimate',
    {
      taskId: z.string().describe('ID of the task')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/total-time-estimate`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_total_time_estimate:', error);
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
  
  // Set user time estimate for task
  server.tool(
    'set_user_time_estimate',
    {
      taskId: z.string().describe('ID of the task'),
      userId: z.string().describe('ID of the user'),
      minutes: z.number().describe('Estimated minutes for this user')
    },
    async ({ taskId, userId, minutes }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/users-time-estimates/${userId}`, { minutes });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in set_user_time_estimate:', error);
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
  
  // Delete user time estimate
  server.tool(
    'delete_user_time_estimate',
    {
      taskId: z.string().describe('ID of the task'),
      userId: z.string().describe('ID of the user')
    },
    async ({ taskId, userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/users-time-estimates/${userId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_user_time_estimate:', error);
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
  
  // ====================
  // WORK REPORTS TOOLS
  // ====================
  
  // Get work reports
  server.tool(
    'get_work_reports',
    {
      filters: z.object({
        projects_ids: z.array(z.string()).optional(),
        users_ids: z.array(z.string()).optional(),
        tasks_labels: z.array(z.string()).optional(),
        date_reported_range: z.object({
          date_from: z.string(),
          date_to: z.string()
        }).optional()
      }).optional().describe('Optional filters for work reports')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/work-reports', { params: filters });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_work_reports:', error);
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
  
  // Create work report
  server.tool(
    'create_work_report',
    {
      taskId: z.string().describe('ID of the task'),
      reportData: z.object({
        minutes: z.number().describe('Number of minutes worked'),
        date: z.string().describe('Date of work in format YYYY-MM-DD'),
        description: z.string().optional().describe('Optional description of work done')
      }).describe('Work report data')
    },
    async ({ taskId, reportData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/work-reports`, reportData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_work_report:', error);
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
  
  // Update work report
  server.tool(
    'update_work_report',
    {
      workReportId: z.string().describe('ID of the work report'),
      reportData: z.object({
        minutes: z.number().optional(),
        date: z.string().optional(),
        description: z.string().optional()
      }).describe('Updated work report data')
    },
    async ({ workReportId, reportData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/work-reports/${workReportId}`, reportData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in update_work_report:', error);
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
  
  // Delete work report
  server.tool(
    'delete_work_report',
    {
      workReportId: z.string().describe('ID of the work report to delete')
    },
    async ({ workReportId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/work-reports/${workReportId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_work_report:', error);
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
  
  // ====================
  // TIME TRACKING TOOLS
  // ====================
  
  // Start time tracking
  server.tool(
    'start_time_tracking',
    {
      taskId: z.string().optional().describe('Optional task ID to track time for')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = taskId ? { task_id: taskId } : {};
        const response = await apiClient.post('/timetracking/start', null, { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in start_time_tracking:', error);
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
  
  // Stop time tracking
  server.tool(
    'stop_time_tracking',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/timetracking/stop');
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in stop_time_tracking:', error);
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
  
  // Edit time tracking
  server.tool(
    'edit_time_tracking',
    {
      trackingData: z.object({
        task_id: z.string().optional(),
        description: z.string().optional()
      }).describe('Data to edit in current time tracking')
    },
    async ({ trackingData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/timetracking/edit', trackingData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in edit_time_tracking:', error);
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
  
  // ====================
  // CUSTOM FIELDS TOOLS
  // ====================
  
  // Get custom field types
  server.tool(
    'get_custom_field_types',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/custom-field/get-types');
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_custom_field_types:', error);
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
  
  // Create custom field
  server.tool(
    'create_custom_field',
    {
      projectId: z.string().describe('ID of the project'),
      fieldData: z.object({
        name: z.string().describe('Name of the custom field'),
        type: z.string().describe('Type of the custom field'),
        is_required: z.enum(['yes', 'no']).optional().describe('Whether field is required (yes/no)')
      }).describe('Custom field data')
    },
    async ({ projectId, fieldData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/create/${projectId}`, fieldData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_custom_field:', error);
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
  
  // Rename custom field
  server.tool(
    'rename_custom_field',
    {
      uuid: z.string().describe('UUID of the custom field'),
      name: z.string().describe('New name for the custom field')
    },
    async ({ uuid, name }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/rename/${uuid}`, { name });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in rename_custom_field:', error);
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
  
  // Delete custom field
  server.tool(
    'delete_custom_field',
    {
      uuid: z.string().describe('UUID of the custom field to delete')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/custom-field/delete/${uuid}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_custom_field:', error);
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
  
  // Restore custom field
  server.tool(
    'restore_custom_field',
    {
      uuid: z.string().describe('UUID of the custom field to restore')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/restore/${uuid}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in restore_custom_field:', error);
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
  
  // Add or edit field value
  server.tool(
    'add_or_edit_field_value',
    {
      valueData: z.object({
        task_id: z.string().describe('ID of the task'),
        custom_field_uuid: z.string().describe('UUID of the custom field'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('Value to set')
      }).describe('Field value data')
    },
    async ({ valueData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/custom-field/add-or-edit-value', valueData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in add_or_edit_field_value:', error);
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
  
  // Add or edit enum value
  server.tool(
    'add_or_edit_enum_value',
    {
      valueData: z.object({
        task_id: z.string().describe('ID of the task'),
        custom_field_uuid: z.string().describe('UUID of the custom field'),
        enum_option_uuid: z.string().describe('UUID of the enum option')
      }).describe('Enum value data')
    },
    async ({ valueData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/custom-field/add-or-edit-enum-value', valueData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in add_or_edit_enum_value:', error);
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
  
  // Delete field value
  server.tool(
    'delete_field_value',
    {
      uuid: z.string().describe('UUID of the field value to delete')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/custom-field/delete-value/${uuid}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_field_value:', error);
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
  
  // Get custom fields by project
  server.tool(
    'get_custom_fields_by_project',
    {
      projectId: z.string().describe('ID of the project')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/custom-field/find-by-project/${projectId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_custom_fields_by_project:', error);
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
  
  // Get enum options
  server.tool(
    'get_enum_options',
    {
      customFieldUuid: z.string().describe('UUID of the custom field')
    },
    async ({ customFieldUuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/custom-field-enum/get-for-custom-field/${customFieldUuid}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_enum_options:', error);
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
  
  // Create enum option
  server.tool(
    'create_enum_option',
    {
      customFieldUuid: z.string().describe('UUID of the custom field'),
      optionData: z.object({
        name: z.string().describe('Name of the enum option'),
        color: z.string().optional().describe('Color of the enum option')
      }).describe('Enum option data')
    },
    async ({ customFieldUuid, optionData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field-enum/create/${customFieldUuid}`, optionData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_enum_option:', error);
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
  
  // ====================
  // INVOICING TOOLS
  // ====================
  
  // Get issued invoices
  server.tool(
    'get_issued_invoices',
    {
      filters: z.object({
        project_id: z.string().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional()
      }).optional().describe('Optional filters for invoices')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/issued-invoices', { params: filters });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_issued_invoices:', error);
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
  
  // Get invoice detail
  server.tool(
    'get_invoice_detail',
    {
      invoiceId: z.string().describe('ID of the invoice')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/issued-invoice/${invoiceId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_invoice_detail:', error);
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
  
  // Download invoice reports
  server.tool(
    'download_invoice_reports',
    {
      invoiceId: z.string().describe('ID of the invoice')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/issued-invoice/${invoiceId}/reports`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in download_invoice_reports:', error);
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
  
  // Mark as invoiced
  server.tool(
    'mark_as_invoiced',
    {
      invoiceId: z.string().describe('ID of the invoice')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/issued-invoice/${invoiceId}/mark-as-invoiced`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in mark_as_invoiced:', error);
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
  
  // ====================
  // NOTIFICATIONS TOOLS
  // ====================
  
  // Get all notifications
  server.tool(
    'get_all_notifications',
    {
      filters: z.object({
        page: z.number().optional(),
        limit: z.number().optional()
      }).optional().describe('Optional pagination filters')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-notifications', { params: filters });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_all_notifications:', error);
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
  
  // Mark notification as read
  server.tool(
    'mark_notification_read',
    {
      notificationId: z.string().describe('ID of the notification')
    },
    async ({ notificationId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/notification/${notificationId}/mark-as-read`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in mark_notification_read:', error);
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
  
  // Mark notification as unread
  server.tool(
    'mark_notification_unread',
    {
      notificationId: z.string().describe('ID of the notification')
    },
    async ({ notificationId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/notification/${notificationId}/mark-as-unread`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in mark_notification_unread:', error);
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
  
  // ====================
  // NOTES TOOLS
  // ====================
  
  // Create note
  server.tool(
    'create_note',
    {
      projectId: z.string().describe('ID of the project'),
      noteData: z.object({
        name: z.string().describe('Title of the note'),
        content: z.string().describe('Content of the note')
      }).describe('Note data')
    },
    async ({ projectId, noteData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/note`, noteData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_note:', error);
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
  
  // Get note
  server.tool(
    'get_note',
    {
      noteId: z.string().describe('ID of the note')
    },
    async ({ noteId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/note/${noteId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_note:', error);
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
  
  // Update note
  server.tool(
    'update_note',
    {
      noteId: z.string().describe('ID of the note'),
      noteData: z.object({
        name: z.string().optional().describe('Title of the note'),
        content: z.string().optional().describe('Content of the note')
      }).describe('Updated note data')
    },
    async ({ noteId, noteData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/note/${noteId}`, noteData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in update_note:', error);
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
  
  // Delete note
  server.tool(
    'delete_note',
    {
      noteId: z.string().describe('ID of the note to delete')
    },
    async ({ noteId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/note/${noteId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_note:', error);
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
  
  // ====================
  // USERS EXTENDED TOOLS
  // ====================
  
  // Get projects where user is project manager
  server.tool(
    'get_project_manager_of',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/users/project-manager-of');
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_project_manager_of:', error);
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
  
  // Invite users by email
  server.tool(
    'invite_users_by_email',
    {
      projectId: z.string().describe('ID of the project'),
      emails: z.array(z.string()).describe('Array of email addresses to invite')
    },
    async ({ projectId, emails }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/users/manage-workers', {
          project_id: projectId,
          emails: emails
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in invite_users_by_email:', error);
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
  
  // Invite users by IDs
  server.tool(
    'invite_users_by_ids',
    {
      projectId: z.string().describe('ID of the project'),
      userIds: z.array(z.string()).describe('Array of user IDs to invite')
    },
    async ({ projectId, userIds }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/users/manage-workers', {
          projects_ids: [projectId],  // API expects 'projects_ids' as array when using users_ids
          users_ids: userIds
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in invite_users_by_ids:', error);
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
  
  // Get out of office
  server.tool(
    'get_out_of_office',
    {
      userId: z.string().describe('ID of the user')
    },
    async ({ userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/user/${userId}/out-of-office`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_out_of_office:', error);
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
  
  // Set out of office
  server.tool(
    'set_out_of_office',
    {
      userId: z.string().describe('ID of the user'),
      outOfOfficeData: z.object({
        date_from: z.string().describe('Start date (YYYY-MM-DD)'),
        date_to: z.string().describe('End date (YYYY-MM-DD)'),
        reason: z.string().optional().describe('Optional reason')
      }).describe('Out of office data')
    },
    async ({ userId, outOfOfficeData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // API expects data wrapped in 'out_of_office' key
        const response = await apiClient.post(`/user/${userId}/out-of-office`, {
          out_of_office: outOfOfficeData
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in set_out_of_office:', error);
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
  
  // Delete out of office
  server.tool(
    'delete_out_of_office',
    {
      userId: z.string().describe('ID of the user')
    },
    async ({ userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/user/${userId}/out-of-office`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_out_of_office:', error);
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
  
  // ====================
  // EVENTS, TASKLISTS & OTHER TOOLS
  // ====================
  
  // Get events
  server.tool(
    'get_events',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Projects IDs array'),
        users_ids: z.array(z.number()).optional().describe('Users IDs array'),
        events_types: z.array(z.string()).optional().describe('Event types array'),
        order: z.enum(['asc', 'desc']).optional().describe('Data order (desc or asc)'),
        date_range: z.object({
          date_from: z.string().describe('Date from'),
          date_to: z.string().describe('Date to')
        }).optional().describe('Date range'),
        tasks_ids: z.array(z.number()).optional().describe('Tasks IDs array'),
        p: z.number().optional().describe('Page number (starts from 0)')
      }).optional().describe('Optional filters for events')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/events', { params: filters });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_events:', error);
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
  
  // Get tasklist details
  server.tool(
    'get_tasklist_details',
    {
      tasklistId: z.string().describe('ID of the tasklist')
    },
    async ({ tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/tasklist/${tasklistId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_tasklist_details:', error);
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
  
  // Get assignable workers
  server.tool(
    'get_assignable_workers',
    {
      projectId: z.string().describe('ID of the project'),
      tasklistId: z.string().describe('ID of the tasklist')
    },
    async ({ projectId, tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/assignable-workers`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_assignable_workers:', error);
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
  
  // Create tasklist from template
  server.tool(
    'create_tasklist_from_template',
    {
      templateId: z.string().describe('ID of the template tasklist'),
      projectId: z.string().describe('ID of the target project')
    },
    async ({ templateId, projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // API expects flat structure (no wrapping key) with 'tasklist_id' and 'target_project_id'
        const response = await apiClient.post(`/tasklist/create-from-template/${templateId}`, {
          tasklist_id: parseInt(templateId),
          target_project_id: parseInt(projectId)
        });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_tasklist_from_template:', error);
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
  
  // Get custom filters
  server.tool(
    'get_custom_filters',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/dashboard/custom-filters');
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_custom_filters:', error);
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
  
  // Get tasks by filter UUID
  server.tool(
    'get_tasks_by_filter_uuid',
    {
      uuid: z.string().describe('UUID of the custom filter')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/dashboard/custom-filter/by-uuid/${uuid}/tasks`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_tasks_by_filter_uuid:', error);
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
  
  // Get tasks by filter name
  server.tool(
    'get_tasks_by_filter_name',
    {
      name: z.string().describe('Name of the custom filter')
    },
    async ({ name }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/dashboard/custom-filter/by-name/${encodeURIComponent(name)}/tasks`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_tasks_by_filter_name:', error);
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
  
  // Find available labels
  server.tool(
    'find_available_labels',
    {
      projectId: z.string().optional().describe('Optional project ID to filter labels')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = projectId ? { project_id: projectId } : {};
        const response = await apiClient.get('/project-labels/find-available', { params });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in find_available_labels:', error);
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
  
  // Get pinned items
  server.tool(
    'get_pinned_items',
    {
      projectId: z.string().describe('ID of the project')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}/pinned-items`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_pinned_items:', error);
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
  
  // Pin item
  server.tool(
    'pin_item',
    {
      projectId: z.string().describe('ID of the project'),
      itemData: z.object({
        type: z.enum(['task', 'note', 'file']).describe('Type of item to pin'),
        item_id: z.string().describe('ID of the item to pin'),
        link: z.string().optional().describe('Optional link URL for the pinned item')
      }).describe('Item data to pin')
    },
    async ({ projectId, itemData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Ensure link field is set (API requires non-null value)
        const apiData = {
          ...itemData,
          link: itemData.link || '#'  // Use '#' instead of empty string
        };
        const response = await apiClient.post(`/project/${projectId}/pinned-items`, apiData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in pin_item:', error);
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
  
  // Delete pinned item
  server.tool(
    'delete_pinned_item',
    {
      pinnedItemId: z.string().describe('ID of the pinned item to delete')
    },
    async ({ pinnedItemId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/pinned-item/${pinnedItemId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in delete_pinned_item:', error);
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
  
  // Get all comments
  server.tool(
    'get_all_comments',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Projects IDs array'),
        type: z.enum(['all', 'task', 'document', 'file', 'link']).optional().describe('Comment type'),
        order_by: z.enum(['date_add', 'date_edited_at']).optional().describe('Order column'),
        order: z.enum(['asc', 'desc']).optional().describe('Order direction'),
        p: z.number().optional().describe('Page number (starts from 0)')
      }).optional().describe('Optional filters for comments')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-comments', { params: filters });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_all_comments:', error);
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
  
  // Create task labels
  server.tool(
    'create_task_labels',
    {
      labelData: z.object({
        name: z.string().describe('Name of the label'),
        color: z.string().optional().describe('Color of the label'),
        project_id: z.string().optional().describe('Optional project ID')
      }).describe('Label data')
    },
    async ({ labelData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/task-labels', { labels: [labelData] });
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in create_task_labels:', error);
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
  
  // Get all states
  server.tool(
    'get_all_states',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/states');
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in get_all_states:', error);
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
