/**
 * Notifications Tools
 * Handles notification operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { createArrayResponseSchema, NotificationSchema } from '../utils/schemas.js';

export function registerNotificationsTools(server) {
  registerToolWithMetadata(
    server,
    'get_all_notifications',
    'Fetches all notifications for the current user. Notifications include mentions, task assignments, comments, and other activity updates. Supports pagination for large notification lists. Use this to build notification feeds or check for unread updates.',
    {
      filters: z.object({
        page: z.number().optional().describe('Page number for pagination, starts at 1 (default: 1). Use for loading more notifications.'),
        limit: z.number().optional().describe('Number of notifications per page (e.g., 20, 50). Use to control response size.')
      }).optional().describe('Optional pagination filters')
    },
    withErrorHandling('get_all_notifications', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-notifications', { params: filters });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(NotificationSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'mark_notification_read',
    'Marks a specific notification as read. Use this to track which notifications have been seen and reduce unread notification counts. Essential for notification management workflows. Get notification IDs from get_all_notifications.',
    {
      notificationId: z.string().describe('Unique notification identifier (numeric string, e.g., "12345"). Get from get_all_notifications response.')
    },
    withErrorHandling('mark_notification_read', async ({ notificationId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/notification/${notificationId}/mark-as-read`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NotificationSchema
    }
  );

  registerToolWithMetadata(
    server,
    'mark_notification_unread',
    'Marks a specific notification as unread. Use this to flag notifications that require follow-up action or to restore notifications that were accidentally marked as read. Get notification IDs from get_all_notifications.',
    {
      notificationId: z.string().describe('Unique notification identifier (numeric string, e.g., "12345"). Get from get_all_notifications response.')
    },
    withErrorHandling('mark_notification_unread', async ({ notificationId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/notification/${notificationId}/mark-as-unread`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NotificationSchema
    }
  );
}
