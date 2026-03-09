/**
 * Users Tools
 * Handles all user-related operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { UserSchema, ProjectSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerUsersTools(server) {
  registerToolWithMetadata(
    server,
    'get_users',
    'Fetches all users in the Freelo workspace. Returns complete user list with names, emails, IDs, roles, and availability. Essential for getting user IDs before assigning tasks, inviting to projects, or managing permissions. Use this as the first step when working with team members.',
    {},
    withErrorHandling('get_users', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/users');
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'remove_workers',
    'Removes team members from a project. Provide either userIds (array of user ID strings) or emails (array of email strings) - at least one is required. Workers will immediately lose access to the project and its tasks. Get user IDs from get_project_workers or get_users.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      userIds: z.array(z.string()).optional().describe('Array of user IDs to remove (e.g., ["12345", "67890"]). Get user IDs from get_project_workers or get_users.'),
      emails: z.array(z.string()).optional().describe('Array of email addresses to remove (e.g., ["user@example.com"]). Get emails from get_project_workers.')
    },
    withErrorHandling('remove_workers', async ({ projectId, userIds, emails }) => {
      const apiClient = getApiClient();
      if (userIds && userIds.length > 0) {
        const response = await apiClient.post(`/project/${projectId}/remove-workers/by-ids`, {
          users_ids: userIds.map(id => parseInt(id, 10))
        });
        return formatResponse(response.data);
      } else if (emails && emails.length > 0) {
        const response = await apiClient.post(`/project/${projectId}/remove-workers/by-emails`, {
          users_emails: emails
        });
        return formatResponse(response.data);
      }
      return formatResponse({ error: 'Provide either userIds or emails' });
    }),
    {
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_project_workers',
    'Fetches the list of workers (team members) assigned to a specific project. Returns user details including names, emails, roles, and permissions. Essential for understanding team composition before assigning tasks or managing project access.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Use for projects with many team members.')
    },
    withErrorHandling('get_project_workers', async ({ projectId, page }) => {
      const apiClient = getApiClient();
      const params = page !== undefined ? { p: page } : {};
      const response = await apiClient.get(`/project/${projectId}/workers`, { params });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'invite_users',
    'Invites users to a project. Provide either userIds (array of existing user ID strings) or emails (array of email strings) - at least one is required. When using emails, users without Freelo accounts will receive invitation emails. Get user IDs from get_users.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      userIds: z.array(z.string()).optional().describe('Array of user IDs to invite (e.g., ["12345", "67890"]). Users must already exist in Freelo. Get IDs from get_users.'),
      emails: z.array(z.string()).optional().describe('Array of email addresses to invite (e.g., ["user@example.com"]). Users will receive invitations if not registered.')
    },
    withErrorHandling('invite_users', async ({ projectId, userIds, emails }) => {
      const apiClient = getApiClient();
      const body = {};
      if (userIds && userIds.length > 0) {
        body.projects_ids = [projectId];
        body.users_ids = userIds;
      }
      if (emails && emails.length > 0) {
        body.project_id = projectId;
        body.emails = emails;
      }
      const response = await apiClient.post('/users/manage-workers', body);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );

  registerToolWithMetadata(
    server,
    'get_out_of_office',
    'Fetches out-of-office (vacation/absence) information for a user. Returns dates and reason if set. Useful for checking team member availability before assigning tasks or scheduling work.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Get from get_users or get_project_workers.')
    },
    withErrorHandling('get_out_of_office', async ({ userId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/user/${userId}/out-of-office`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ from: z.string(), to: z.string(), message: z.string().optional() })
    }
  );

  registerToolWithMetadata(
    server,
    'set_out_of_office',
    'Sets out-of-office (vacation/absence) period for a user. Other team members will see when the user is unavailable. Delete with delete_out_of_office to cancel.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Typically the current user. Get from get_users.'),
      outOfOfficeData: z.object({
        date_from: z.string().describe('Absence start date in format YYYY-MM-DD (e.g., "2025-10-15")'),
        date_to: z.string().describe('Absence end date in format YYYY-MM-DD (e.g., "2025-10-20"). Must be after date_from.'),
        reason: z.string().optional().describe('Optional: Absence reason (e.g., "Vacation", "Sick leave"). Visible to team members.')
      }).describe('Out-of-office configuration data')
    },
    withErrorHandling('set_out_of_office', async ({ userId, outOfOfficeData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/user/${userId}/out-of-office`, {
        out_of_office: outOfOfficeData
      });
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ from: z.string(), to: z.string(), message: z.string().optional() })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_out_of_office',
    'Removes out-of-office status for a user. The user will appear as available immediately.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Must have existing out-of-office status. Get from get_users.')
    },
    withErrorHandling('delete_out_of_office', async ({ userId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/user/${userId}/out-of-office`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'get_project_manager_of',
    'Fetches projects where the current authenticated user is assigned as the project manager (PM). This differs from get_projects which returns projects you own - you can be PM on projects owned by others.',
    {},
    withErrorHandling('get_project_manager_of', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/users/project-manager-of');
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
}
