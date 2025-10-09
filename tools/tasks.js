/**
 * Tasks Tools
 * Handles all task-related operations
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';

export function registerTasksTools(server) {
  server.tool(
    'get_all_tasks',
    {
      filters: z.object({
        search_query: z.string().optional().describe('Fulltext search query for task name'),
        state_id: z.number().optional().describe('ID of tasks state'),
        projects_ids: z.array(z.number()).optional().describe('Projects IDs array'),
        tasklists_ids: z.array(z.number()).optional().describe('Tasklists IDs array'),
        order_by: z.enum(['priority', 'name', 'date_add', 'date_edited_at']).optional().describe('Order column'),
        order: z.enum(['asc', 'desc']).optional().describe('Order direction'),
        with_label: z.string().optional().describe('Filter by label name (case insensitive)'),
        without_label: z.string().optional().describe('Exclude label name (case insensitive)'),
        no_due_date: z.boolean().optional().describe('Only tasks with no due date'),
        due_date_range: z.object({
          date_from: z.string().describe('Date from (Y-m-d or Y-m-d H:i:s)'),
          date_to: z.string().describe('Date to (Y-m-d or Y-m-d H:i:s)')
        }).optional().describe('Range of due dates'),
        finished_overdue: z.boolean().optional().describe('Only tasks finished after due date'),
        finished_date_range: z.object({
          date_from: z.string().describe('Date from (Y-m-d or Y-m-d H:i:s)'),
          date_to: z.string().describe('Date to (Y-m-d or Y-m-d H:i:s)')
        }).optional().describe('Range of finished dates'),
        worker_id: z.number().optional().describe('ID of worker'),
        p: z.number().optional().describe('Page number (starts from 0)')
      }).optional().describe('Filters for tasks')
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
  
}
