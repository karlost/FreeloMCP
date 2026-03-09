/**
 * Filters Tools
 * Handles custom filter operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { createArrayResponseSchema, TaskSchema } from '../utils/schemas.js';

export function registerFiltersTools(server) {
  registerToolWithMetadata(
    server,
    'get_custom_filters',
    'Fetches all custom filters (saved task views) created by the user. Custom filters are saved search configurations that combine multiple criteria for quick access to specific task sets. Use this to get filter UUIDs before using get_tasks_by_filter_uuid or get_tasks_by_filter_name.',
    {},
    withErrorHandling('get_custom_filters', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/dashboard/custom-filters');
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ uuid: z.string(), name: z.string() }))
    }
  );

  registerToolWithMetadata(
    server,
    'get_tasks_by_filter_uuid',
    'Fetches tasks using a custom filter UUID. Custom filters are pre-configured task searches with multiple criteria. Use this to quickly retrieve task sets matching saved filter configurations. Get filter UUIDs from get_custom_filters.',
    {
      uuid: z.string().describe('UUID of the custom filter (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_filters response.')
    },
    withErrorHandling('get_tasks_by_filter_uuid', async ({ uuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/dashboard/custom-filter/by-uuid/${uuid}/tasks`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_tasks_by_filter_name',
    'Fetches tasks using a custom filter name. Alternative to get_tasks_by_filter_uuid when you know the filter name but not the UUID. Custom filters are pre-configured task searches. Get filter names from get_custom_filters.',
    {
      name: z.string().describe('Name of the custom filter (e.g., "My High Priority Tasks", "Overdue Items"). Get from get_custom_filters response.')
    },
    withErrorHandling('get_tasks_by_filter_name', async ({ name }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/dashboard/custom-filter/by-name/${encodeURIComponent(name)}/tasks`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );
}
