/**
 * PinnedItems Tools
 * Handles pinned item operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerPinnedItemsTools(server) {
  registerToolWithMetadata(
    server,
    'get_pinned_items',
    'Fetches all pinned items in a project. Pinned items are shortcuts to important tasks, notes, or files displayed prominently for quick access. Use this to see what team members have pinned as important or frequently accessed. Essential for understanding project priorities.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    withErrorHandling('get_pinned_items', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/project/${projectId}/pinned-items`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), type: z.string() }))
    }
  );

  registerToolWithMetadata(
    server,
    'pin_item',
    'Pins a task, note, or file to the top of a project for quick access. Pinned items appear prominently for all project members. Use this to highlight important tasks, reference documentation, or frequently needed files. Useful for team coordination and prioritization.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      itemData: z.object({
        type: z.enum(['task', 'note', 'file']).describe('Type of item to pin: "task" (pin a task), "note" (pin documentation), or "file" (pin an attachment)'),
        item_id: z.string().describe('ID of the item to pin (numeric string, e.g., "12345"). Get from get_all_tasks, get_note, or get_all_files depending on type.'),
        link: z.string().optional().describe('Optional: Custom link URL for the pinned item (e.g., external documentation URL)')
      }).describe('Item data to pin')
    },
    withErrorHandling('pin_item', async ({ projectId, itemData }) => {
      const apiClient = getApiClient();
      // Ensure link field is set (API requires non-null value)
      const apiData = {
        ...itemData,
        link: itemData.link || '#'  // Use '#' instead of empty string
      };
      const response = await apiClient.post(`/project/${projectId}/pinned-items`, apiData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_pinned_item',
    'Removes a pinned item from a project. Use this to unpin tasks, notes, or files that are no longer priority or frequently accessed. Does not delete the underlying item (task/note/file), only removes the pin. Get pinned item IDs from get_pinned_items.',
    {
      pinnedItemId: z.string().describe('Unique pinned item identifier (numeric string, e.g., "12345"). Get from get_pinned_items response.')
    },
    withErrorHandling('delete_pinned_item', async ({ pinnedItemId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/pinned-item/${pinnedItemId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );
}
