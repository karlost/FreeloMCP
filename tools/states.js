/**
 * States Tools
 * Handles task state operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerStatesTools(server) {
  registerToolWithMetadata(
    server,
    'get_all_states',
    'Fetches all available task states in Freelo. States represent task lifecycle status (e.g., 1=active/open, 2=finished/completed, 3=archived). Essential for understanding state IDs before using get_all_tasks with state_id filter or when analyzing task workflows. Returns state IDs, names, and descriptions.',
    {},
    withErrorHandling('get_all_states', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/states');
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), name: z.string() }))
    }
  );
}
