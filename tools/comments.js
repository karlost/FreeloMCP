/**
 * Comments Tools
 * Tools for managing comments on tasks in Freelo
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { CommentSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerCommentsTools(server) {
  // Create comment
  registerToolWithMetadata(
    server,
    'create_comment',
    'Creates a new comment on a task. Comments are visible to all project members and support file attachments. Use this for discussions, feedback, or updates. For editing existing comments, use edit_comment. Get task IDs from get_all_tasks or get_tasklist_tasks.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      commentData: z.object({
        content: z.string().describe('Comment content - text of the comment (supports plain text and markdown)'),
        fileUuids: z.array(z.string()).optional().describe('Optional: Array of file UUIDs to attach to the comment. Get UUIDs from upload_file.')
      }).describe('Comment creation data')
    },
    withErrorHandling('create_comment', async ({ taskId, commentData }) => {
      const apiClient = getApiClient();
      const body = { content: commentData.content };
      if (commentData.fileUuids && commentData.fileUuids.length > 0) {
        body.files = commentData.fileUuids.map(uuid => ({ uuid }));
      }
      const response = await apiClient.post(`/task/${taskId}/comments`, body);
      return formatResponse(response.data);
    }),
    {
      outputSchema: CommentSchema
    }
  );

  // Edit comment
  registerToolWithMetadata(
    server,
    'edit_comment',
    'Edits an existing comment on a task. Only the comment author or project admin can edit comments. You can update the text content and modify attached files. Use get_all_comments to retrieve comment IDs. For creating new comments, use create_comment instead.',
    {
      commentId: z.string().describe('Unique comment identifier (numeric string, e.g., "12345"). Get from get_all_comments.'),
      commentData: z.object({
        content: z.string().describe('Updated comment content - new text for the comment (supports plain text and markdown)'),
        fileUuids: z.array(z.string()).optional().describe('Optional: Array of file UUIDs to attach (replaces existing attachments). Get UUIDs from upload_file.')
      }).describe('Updated comment data')
    },
    withErrorHandling('edit_comment', async ({ commentId, commentData }) => {
      const apiClient = getApiClient();
      const body = { content: commentData.content };
      if (commentData.fileUuids && commentData.fileUuids.length > 0) {
        body.files = commentData.fileUuids.map(uuid => ({ uuid }));
      }
      const response = await apiClient.post(`/comment/${commentId}`, body);
      return formatResponse(response.data);
    }),
    {
      outputSchema: CommentSchema
    }
  );

  // Get all comments
  registerToolWithMetadata(
    server,
    'get_all_comments',
    'Fetches all comments across projects with filtering and sorting options. Comments include discussions on tasks, documents, files, and links. Essential for tracking communication, finding specific conversations, or generating activity reports. Supports filtering by project, comment type, and pagination.',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (numeric array, e.g., [197352, 198000]). Get from get_projects or get_all_projects.'),
        type: z.enum(['all', 'task', 'document', 'file', 'link']).optional().describe('Filter by comment context: "all" (default, all comments), "task" (task comments), "document" (note comments), "file" (file comments), "link" (link comments)'),
        order_by: z.enum(['date_add', 'date_edited_at']).optional().describe('Sort by: "date_add" (creation date, default), "date_edited_at" (last edited date)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (oldest first) or "desc" (newest first, default)'),
        p: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Critical for large comment sets to avoid token limits.')
      }).optional().describe('Optional filters for comments')
    },
    withErrorHandling('get_all_comments', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-comments', { params: filters });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(CommentSchema)
    }
  );
}
