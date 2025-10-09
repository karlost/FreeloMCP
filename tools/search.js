/**
 * Search Tools
 * Handles all search-related operations
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';

export function registerSearchTools(server) {
  // Search Elasticsearch
  server.tool(
    'search_elasticsearch',
    {
      searchData: z.object({
        search_query: z.string().describe('Search query'),
        projects_ids: z.array(z.number()).optional().describe('IDs of projects to search in'),
        tasklists_ids: z.array(z.number()).optional().describe('IDs of tasklists to search in'),
        tasks_ids: z.array(z.number()).optional().describe('IDs of tasks to search in'),
        authors_ids: z.array(z.number()).optional().describe('IDs of item authors'),
        workers_ids: z.array(z.number()).optional().describe('IDs of workers'),
        state_ids: z.array(z.string()).optional().describe('States (active, archived, finished, template, etc.)'),
        entity_type: z.enum(['task', 'subtask', 'project', 'tasklist', 'file', 'comment']).optional().describe('Type of entity to search'),
        page: z.number().optional().describe('Page number (default: 0)'),
        limit: z.number().optional().describe('Max results per page (default: 100)')
      }).describe('Search data')
    },
    async ({ searchData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/search', searchData);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
      } catch (error) {
        console.error('Error in search_elasticsearch:', error);
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
