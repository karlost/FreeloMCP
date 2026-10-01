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

// Attachments passed via the `files` array are dropped by Freelo whenever the
// comment is edited later (#12). Inline `<a data-freelo-uuid>` links in the
// content survive edits: Freelo expands them into `data-freelo-file` on save.
// The link text becomes the attachment name shown in the Freelo UI.
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const appendInlineFiles = (content, fileUuids = []) =>
  content + fileUuids.map(file => {
    const { uuid, name } = typeof file === 'string' ? { uuid: file } : file;
    return `<a data-freelo-uuid="${escapeHtml(uuid)}">${escapeHtml(name || uuid)}</a>`;
  }).join('');

const fileUuidsSchema = z.array(z.union([
  z.string(),
  z.object({
    uuid: z.string().describe('File UUID from upload_file'),
    name: z.string().optional().describe('Attachment name shown in Freelo, e.g. "report.pdf". Defaults to the UUID.')
  })
]));

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
        fileUuids: fileUuidsSchema.optional().describe('Optional: Files to attach, from upload_file. Each item is a UUID string or { uuid, name } (name is the attachment label shown in Freelo; pass the original filename, otherwise the UUID is shown). Appended to content as inline `<a data-freelo-uuid>` links, which Freelo turns into attachments that survive later edits.')
      }).describe('Comment creation data')
    },
    withErrorHandling('create_comment', async ({ taskId, commentData }) => {
      const apiClient = getApiClient();
      const body = { content: appendInlineFiles(commentData.content, commentData.fileUuids) };
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
    'Edits an existing comment on a task. The new content REPLACES the old one. ⚠️ Attachments (#12): files attached through the API `files` array are always removed by an edit. Attachments that live inline in the content (`<a data-freelo-file=...>` / `<a data-freelo-uuid=...>`, which is how create_comment and edit_comment attach fileUuids) survive, as long as you keep that markup in the new content. Read the current content first (get_all_comments or get_task_details) and edit it, do not rewrite it from scratch. Only the comment author or project admin can edit comments. For creating new comments, use create_comment instead.',
    {
      commentId: z.string().describe('Unique comment identifier (numeric string, e.g., "12345"). Get from get_all_comments.'),
      commentData: z.object({
        content: z.string().describe('Updated comment content - new text for the comment (supports plain text and markdown)'),
        fileUuids: fileUuidsSchema.optional().describe('Optional: Files to add as new attachments, from upload_file. Each item is a UUID string or { uuid, name }. Appended to content as inline `<a data-freelo-uuid>` links.')
      }).describe('Updated comment data')
    },
    withErrorHandling('edit_comment', async ({ commentId, commentData }) => {
      const apiClient = getApiClient();
      const body = { content: appendInlineFiles(commentData.content, commentData.fileUuids) };
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
