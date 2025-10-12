/**
 * Search Tools
 * Handles all search-related operations
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerSearchTools(server) {
  // Search Elasticsearch
  registerToolWithMetadata(
    server,
    'search_elasticsearch',
    'Performs powerful full-text search across Freelo using Elasticsearch. Searches through tasks, subtasks, projects, tasklists, files, and comments with advanced filtering options. Essential for finding content when you don\'t know the exact location. Supports filtering by projects, tasklists, authors, workers, states, entity types, and pagination. Much more powerful than get_all_tasks search_query for cross-entity searches.',
    {
      searchData: z.object({
        search_query: z.string().describe('Search query text (e.g., "urgent bug", "client meeting", "API documentation"). Searches across names, descriptions, and content.'),
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (numeric array, e.g., [197352, 198000]). Get from get_projects or get_all_projects.'),
        tasklists_ids: z.array(z.number()).optional().describe('Filter by tasklist IDs (numeric array, e.g., [12345, 67890]). Get from get_project_tasklists.'),
        tasks_ids: z.array(z.number()).optional().describe('Filter within specific task IDs (numeric array, e.g., [12345, 67890]). Useful for searching task content and subtasks.'),
        authors_ids: z.array(z.number()).optional().describe('Filter by author/creator user IDs (numeric array, e.g., [12345, 67890]). Get from get_users or get_project_workers.'),
        workers_ids: z.array(z.number()).optional().describe('Filter by assigned worker user IDs (numeric array, e.g., [12345, 67890]). Get from get_users or get_project_workers.'),
        state_ids: z.array(z.string()).optional().describe('Filter by states (string array, e.g., ["active", "finished", "archived", "template"]). Common: "active" (open tasks), "finished" (completed).'),
        entity_type: z.enum(['task', 'subtask', 'project', 'tasklist', 'file', 'comment']).optional().describe('Filter by entity type: "task", "subtask", "project", "tasklist", "file", or "comment". Omit to search all types.'),
        page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Use for loading more results.'),
        limit: z.number().optional().describe('Maximum results per page (default: 100). Control response size and performance.')
      }).describe('Search data with query and filters')
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
    },
    {
      outputSchema: createArrayResponseSchema(z.any())
    }
  );
}
