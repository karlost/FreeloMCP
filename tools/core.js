/**
 * Core Tools
 * All remaining Freelo MCP tools (to be split into specific modules)
 */

import { z } from 'zod';
import FormData from 'form-data';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import {
  TasklistSchema,
  UserSchema,
  TaskSchema,
  TaskDetailedSchema,
  SubtaskSchema,
  CommentSchema,
  WorkReportSchema,
  FileSchema,
  NoteSchema,
  NotificationSchema,
  LabelSchema,
  ProjectSchema,
  createArrayResponseSchema
} from '../utils/schemas.js';

export function registerCoreTools(server) {
  // Tasklists tools
  registerToolWithMetadata(
    server,
    'get_project_tasklists',
    'Fetches all tasklists within a project. Tasklists organize tasks into logical groups or phases (e.g., "To Do", "In Progress", "Done" or "Design", "Development", "Testing"). Essential for understanding project structure before creating or finding tasks. Use this after get_project_details to drill down into project organization.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects, get_all_projects, or get_project_details.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Zkusíme použít endpoint pro všechny tasklisty s filtrem na projekt
        const response = await apiClient.get('/all-tasklists', {
          params: {
            projects_ids: [projectId]
          }
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_project_tasklists:', error);
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
      outputSchema: createArrayResponseSchema(TasklistSchema)
    }
  );
  
  // Users tools
  registerToolWithMetadata(
    server,
    'get_users',
    'Fetches all users in the Freelo workspace. Returns complete user list with names, emails, IDs, roles, and availability. Essential for getting user IDs before assigning tasks, inviting to projects, or managing permissions. Use this as the first step when working with team members.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/users');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_users:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Users tools
  registerToolWithMetadata(
    server,
    'remove_workers',
    'Removes team members from a project by their user IDs. Workers will immediately lose access to the project, tasks, and related data. Use this for managing team composition. For removal by email instead of IDs, use remove_workers_by_emails. Get user IDs from get_project_workers first.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      userIds: z.array(z.string()).describe('Array of user IDs to remove (e.g., ["12345", "67890"]). Get user IDs from get_project_workers or get_users.')
    },
    async ({ projectId, userIds }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/remove-workers`, {
          users_ids: userIds
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in remove_workers:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
   // Files tools
  registerToolWithMetadata(
    server,
    'get_all_files',
    'Fetches all files and documents across projects with filtering options. Returns files, directories, links, and documents attached to tasks or uploaded to projects. Supports pagination for large file sets. Use this to find attachments, browse project files, or locate specific documents before downloading with download_file.',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (e.g., [197352, 198000]). Get from get_projects. Omit to search all projects.'),
        type: z.enum(['directory', 'link', 'file', 'document']).optional().describe('Filter by item type: "directory" (folders), "link" (URL links), "file" (uploaded files), "document" (documents). Omit for all types.'),
        p: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Use for large file collections to avoid token limits.')
      }).optional().describe('Optional filters - combine to narrow results')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-docs-and-files', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_all_files:', error);
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
      outputSchema: createArrayResponseSchema(FileSchema)
    }
  );
  
  // Upload file tool
  registerToolWithMetadata(
    server,
    'upload_file',
    'Uploads a file to Freelo. The file can then be attached to tasks, comments, or stored in project files. Supports any file type. Files are encoded as base64 for transfer. After upload, use the returned file UUID with download_file or to attach to tasks. Maximum file size depends on Freelo plan.',
    {
      fileData: z.string().describe('File content encoded as base64 string. Convert file bytes to base64 before passing. Example in Node.js: Buffer.from(fileBytes).toString("base64")'),
      fileName: z.string().describe('Original filename with extension (e.g., "report.pdf", "screenshot.png", "document.docx"). Preserves file type and helps with identification.')
    },
    async ({ fileData, fileName }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
  
        // Create API client
        const apiClient = createApiClient(auth);
  
        // Create FormData
        const form = new FormData();
  
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(fileData, 'base64');
  
        // Append file to form
        form.append('file', fileBuffer, {
          filename: fileName,
          contentType: 'application/octet-stream'
        });
  
        // Set custom headers for this request
        const headers = {
          ...form.getHeaders(),
          'Authorization': `Basic ${Buffer.from(`${auth.email}:${auth.apiKey}`).toString('base64')}`,
          'User-Agent': auth.userAgent
        };
  
        // Make request
        const response = await apiClient.post('/file/upload', form, { headers });
  
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in upload_file:', error);
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
      outputSchema: FileSchema
    }
  );
  
  // Download file tool
  registerToolWithMetadata(
    server,
    'download_file',
    'Downloads a file from Freelo by its UUID. Returns the file content which can be saved locally or processed. Use this after finding files with get_all_files to retrieve the actual file data. The UUID is returned when uploading files or found in file listings.',
    {
      fileUuid: z.string().describe('Unique file identifier (UUID format, e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_all_files or after upload_file.')
    },
    async ({ fileUuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
  
        // Create API client
        const apiClient = createApiClient(auth);
  
        // Set responseType to arraybuffer to get binary data
        const response = await apiClient.get(`/file/${fileUuid}`, {
          responseType: 'arraybuffer'
        });
  
        // Convert binary data to base64
        const base64Data = Buffer.from(response.data).toString('base64');
  
        // Get content type from response headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';
  
        // Get filename from content-disposition header if available
        let filename = fileUuid;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
  
        return {
          content: [{ type: 'text', text: JSON.stringify({
              filename,
              contentType,
              data: base64Data
            }) }],
          structuredContent: {
              filename,
              contentType,
              data: base64Data
            }
        };
      } catch (error) {
        console.error('Error in download_file:', error);
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
      outputSchema: FileSchema
    }
  );
  
  // Subtasks tools
  registerToolWithMetadata(
    server,
    'create_subtask',
    'Creates a subtask under an existing task. Subtasks help break down complex tasks into smaller, manageable pieces. Each subtask can have its own assignment, description, and due date. Useful for detailed task decomposition and better progress tracking. Use get_subtasks to list existing subtasks.',
    {
      taskId: z.string().describe('Unique parent task identifier (numeric string, e.g., "25368707"). The subtask will be created under this task. Get from get_all_tasks or get_task_details.'),
      subtaskData: z.object({
        name: z.string().describe('Subtask name - clear and actionable (e.g., "Write unit tests", "Review code", "Update documentation")'),
        description: z.string().optional().describe('Optional: Detailed subtask description with context or requirements'),
        worker: z.number().optional().describe('Optional: User ID to assign subtask to (numeric). Can be different from parent task assignee. Get from get_project_workers.'),
        dueDate: z.string().optional().describe('Optional: Due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS')
      }).describe('Subtask creation data')
    },
    async ({ taskId, subtaskData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);

        // Transform description to comment.content for API
        const apiData = { ...subtaskData };
        if (subtaskData.description) {
          apiData.comment = { content: subtaskData.description };
          delete apiData.description;
        }

        // Transform dueDate to due_date for API
        if (subtaskData.dueDate) {
          apiData.due_date = subtaskData.dueDate;
          delete apiData.dueDate;
        }

        const response = await apiClient.post(`/task/${taskId}/subtasks`, apiData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_subtask:', error);
        throw new Error(`Failed to create subtask: ${error.message}`);
      }
    },
    {
      outputSchema: SubtaskSchema
    }
  );
  
  // Get subtasks tool
  registerToolWithMetadata(
    server,
    'get_subtasks',
    'Fetches all subtasks belonging to a parent task. Returns a list of subtasks with their names, statuses, assignments, and due dates. Essential for understanding task breakdown and progress on complex tasks. Use this before marking tasks complete to ensure all subtasks are done.',
    {
      taskId: z.string().describe('Unique parent task identifier (numeric string, e.g., "25368707"). Returns all subtasks under this task. Get from get_all_tasks or get_task_details.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/task/${taskId}/subtasks`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_subtasks:', error);
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
      outputSchema: createArrayResponseSchema(SubtaskSchema)
    }
  );
  
  
  
  // Create tasklist tool
  registerToolWithMetadata(
    server,
    'create_tasklist',
    'Creates a new tasklist (task group) within a project. Tasklists help organize tasks into phases, sprints, or categories. Common examples: "Backlog", "Sprint 1", "Design Phase", "Bug Fixes". After creation, use create_task to add tasks. For creating from templates, use create_tasklist_from_template instead.',
    {
      projectId: z.string().describe('Unique project identifier where tasklist will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistData: z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional()
      })
    },
    async ({ projectId, tasklistData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/tasklists`, tasklistData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_tasklist:', error);
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
      outputSchema: TasklistSchema
    }
  );
  
  // Get task details tool
  registerToolWithMetadata(
    server,
    'get_task_details',
    'Fetches complete details about a specific task including name, description, assignees, due date, priority, status, labels, custom fields, and metadata. Use this after finding tasks with get_all_tasks or get_tasklist_tasks to get full information before editing or taking action. Essential for understanding task context.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks, get_tasklist_tasks, or after create_task.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/task/${taskId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_task_details:', error);
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
      outputSchema: TaskDetailedSchema
    }
  );
  
  // Edit task tool
  registerToolWithMetadata(
    server,
    'edit_task',
    'Updates an existing task with new information. You can modify any combination of name, assignment, due date, or priority. All fields are optional - only provide the fields you want to change. Get task details with get_task_details first to see current values. IMPORTANT: To update task description, use update_task_description instead - this endpoint does not support description updates.',
    {
      taskId: z.string().describe('Unique task identifier to update (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      taskData: z.object({
        name: z.string().optional().describe('Optional: New task name/title'),
        worker: z.number().optional().describe('Optional: User ID to assign task to (numeric). Get from get_project_workers.'),
        dueDate: z.string().optional().describe('Optional: New due date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS'),
        priority: z.number().optional().describe('Optional: Task priority (numeric value, higher = more important)')
      }).describe('Task update data - only include fields to change')
    },
    async ({ taskId, taskData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);

        // Transform dueDate to due_date for API
        const apiData = { ...taskData };
        if (taskData.dueDate) {
          apiData.due_date = taskData.dueDate;
          delete apiData.dueDate;
        }

        const response = await apiClient.post(`/task/${taskId}`, apiData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in edit_task:', error);
        throw new Error(`Failed to edit task: ${error.message}`);
      }
    },
    {
      outputSchema: TaskSchema
    }
  );
  
  // Delete task tool
  registerToolWithMetadata(
    server,
    'delete_task',
    'Permanently deletes a task from Freelo. WARNING: This is irreversible! All task data including description, comments, attachments, subtasks, and history will be lost. Consider using finish_task instead to mark tasks as complete while preserving history. Only use when you are absolutely certain the task should be removed.',
    {
      taskId: z.string().describe('Unique task identifier to permanently delete (numeric string, e.g., "25368707"). WARNING: This is irreversible! Get from get_all_tasks or get_task_details.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Finish task tool
  registerToolWithMetadata(
    server,
    'finish_task',
    'Marks a task as finished/completed. The task will be moved to finished state, preserving all data and history. Finished tasks can be reactivated later with activate_task if needed. This is the standard way to complete tasks - much safer than delete_task. Essential for task workflow completion.',
    {
      taskId: z.string().describe('Unique task identifier to mark as finished (numeric string, e.g., "25368707"). Get from get_all_tasks or get_tasklist_tasks.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/finish`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in finish_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Activate task tool
  registerToolWithMetadata(
    server,
    'activate_task',
    'Reactivates a finished task, moving it back to active state. Use this when a completed task needs to be reopened or when work needs to continue. The task will become visible in active task lists again. Get finished tasks with get_finished_tasks or filter get_all_tasks with state_id=2.',
    {
      taskId: z.string().describe('Unique task identifier to reactivate (numeric string, e.g., "25368707"). Must be a finished task - get from get_finished_tasks.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/activate`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in activate_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Removed non-functional delete_subtask tool
  
  // Create comment tool
  registerToolWithMetadata(
    server,
    'create_comment',
    'Creates a new comment on a task. Comments are visible to all project members and support file attachments. Use this for discussions, feedback, or updates. For editing existing comments, use edit_comment. Get task IDs from get_all_tasks or get_tasklist_tasks.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      commentData: z.object({
        content: z.string().describe('Comment content - text of the comment (supports plain text and markdown)'),
        attachments: z.array(z.string()).optional().describe('Optional: Array of attachment IDs (file UUIDs) to attach to the comment')
      }).describe('Comment creation data')
    },
    async ({ taskId, commentData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/comments`, commentData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_comment:', error);
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
      outputSchema: CommentSchema
    }
  );
  
  // Removed non-functional edit_subtask tool
  
  // Edit comment tool
  registerToolWithMetadata(
    server,
    'edit_comment',
    'Edits an existing comment on a task. Only the comment author or project admin can edit comments. You can update the text content and modify attached files. Use get_all_comments to retrieve comment IDs. For creating new comments, use create_comment instead.',
    {
      commentId: z.string().describe('Unique comment identifier (numeric string, e.g., "12345"). Get from get_all_comments.'),
      commentData: z.object({
        content: z.string().describe('Updated comment content - new text for the comment (supports plain text and markdown)'),
        files: z.array(z.object({
          download_url: z.string().describe('URL to download the file from'),
          filename: z.string().optional().describe('Optional: Name of the file')
        })).optional().describe('Optional: Array of files to attach to the comment (replaces existing attachments)')
      }).describe('Updated comment data')
    },
    async ({ commentId, commentData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/comment/${commentId}`, commentData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in edit_comment:', error);
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
      outputSchema: CommentSchema
    }
  );
  
  
  
  // Add labels to task tool
  registerToolWithMetadata(
    server,
    'add_labels_to_task',
    'Adds one or more labels to a task. Labels are used for categorizing and filtering tasks (e.g., "bug", "urgent", "feature"). Multiple labels can be added at once. Use find_available_labels to discover available label UUIDs. For removing labels, use remove_labels_from_task.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      labelUuids: z.array(z.string()).describe('Array of label UUIDs to add (e.g., ["uuid-1", "uuid-2"]). Get label UUIDs from find_available_labels.')
    },
    async ({ taskId, labelUuids }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
  
        // Format the request body
        const requestBody = {
          labels: labelUuids.map(uuid => ({ uuid }))
        };
  
        const response = await apiClient.post(`/task-labels/add-to-task/${taskId}`, requestBody);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in add_labels_to_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Remove labels from task tool
  registerToolWithMetadata(
    server,
    'remove_labels_from_task',
    'Removes one or more labels from a task. This is useful for cleaning up task categorization or removing outdated labels. Multiple labels can be removed at once. Only labels currently attached to the task can be removed. For adding labels, use add_labels_to_task.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
      labelUuids: z.array(z.string()).describe('Array of label UUIDs to remove (e.g., ["uuid-1", "uuid-2"]). Must be labels currently attached to this task.')
    },
    async ({ taskId, labelUuids }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
  
        // Format the request body
        const requestBody = {
          labels: labelUuids.map(uuid => ({ uuid }))
        };
  
        const response = await apiClient.post(`/task-labels/remove-from-task/${taskId}`, requestBody);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in remove_labels_from_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  
  // ====================
  // EXTENDED PROJECTS TOOLS
  // ====================
  
  // Get invited projects
  registerToolWithMetadata(
    server,
    'get_invited_projects',
    'Fetches projects where you have been invited as a collaborator but are not the owner. Returns projects shared with you by other users. Supports pagination. This is useful for viewing projects you contribute to but don\'t directly manage. For your own projects, use get_projects.',
    {
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Each page returns a batch of projects.')
    },
    async ({ page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get('/invited-projects', { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_invited_projects:', error);
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
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
  
  // Get archived projects
  registerToolWithMetadata(
    server,
    'get_archived_projects',
    'Fetches archived projects in Freelo. Archived projects are completed or inactive projects hidden from default views but with all data preserved. Use this to find project IDs for reactivation with activate_project or to access historical project data. Supports pagination.',
    {
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Each page returns a batch of archived projects.')
    },
    async ({ page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get('/archived-projects', { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_archived_projects:', error);
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
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
  
  // Get template projects
  registerToolWithMetadata(
    server,
    'get_template_projects',
    'Fetches project templates in Freelo. Templates are reusable project structures with predefined tasklists, tasks, and settings. Use this to find templates for creating new projects with create_project_from_template. Supports filtering by name, date, tags, users, and pagination.',
    {
      filters: z.object({
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional().describe('Sort column: "name" (alphabetically), "date_add" (creation date), or "date_edited_at" (last modification)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (ascending/A-Z/oldest first) or "desc" (descending/Z-A/newest first)'),
        tags: z.array(z.string()).optional().describe('Filter by template tags (array of tag strings)'),
        users_ids: z.array(z.string()).optional().describe('Filter by user IDs who have access to templates (array of numeric strings)'),
        page: z.number().optional().describe('Page number for pagination, starts at 0')
      }).optional().describe('Optional filters for refining template results')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
        delete params.page;
        const response = await apiClient.get('/template-projects', { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_template_projects:', error);
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
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
  
  // Get user projects
  registerToolWithMetadata(
    server,
    'get_user_projects',
    'Fetches all projects accessible to a specific user (by user ID). Returns projects the user owns or has been invited to. Useful for viewing another team member\'s workload or project portfolio. Supports filtering by project state (active/archived/finished), sorting, and pagination. Get user IDs from get_users first.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Get user IDs from get_users or get_project_workers.'),
      filters: z.object({
        states_ids: z.array(z.number()).optional().describe('Filter by project state IDs: 1=active, 2=archived, 3=template, 4=finished. Example: [1,4] for active and finished projects.'),
        order_by: z.enum(['name', 'date_add', 'date_edited_at']).optional().describe('Sort column: "name", "date_add" (creation), or "date_edited_at" (last modified)'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" (A-Z/oldest first) or "desc" (Z-A/newest first)'),
        page: z.number().optional().describe('Page number for pagination, starts at 0')
      }).optional().describe('Optional filters for refining results')
    },
    async ({ userId, filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = filters.page !== undefined ? { ...filters, p: filters.page } : filters;
        delete params.page;
        const response = await apiClient.get(`/user/${userId}/all-projects`, { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_user_projects:', error);
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
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
  
  // Get project workers
  registerToolWithMetadata(
    server,
    'get_project_workers',
    'Fetches the list of workers (team members) assigned to a specific project. Returns user details including names, emails, roles, and permissions. Essential for understanding team composition before assigning tasks or managing project access. Use remove_workers or remove_workers_by_emails to remove workers, or invite_users_by_ids/invite_users_by_email to add new members.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      page: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Use for projects with many team members.')
    },
    async ({ projectId, page }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = page !== undefined ? { p: page } : {};
        const response = await apiClient.get(`/project/${projectId}/workers`, { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_project_workers:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Remove workers by emails
  registerToolWithMetadata(
    server,
    'remove_workers_by_emails',
    'Removes team members from a project by their email addresses. Use this when you know worker emails but not their user IDs. Workers will lose access to the project and its tasks. This is a safer alternative to delete_project when you just want to adjust team composition. For removal by user IDs, use remove_workers instead.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      emails: z.array(z.string()).describe('Array of email addresses to remove from the project (e.g., ["user@example.com", "another@example.com"]). Get emails from get_project_workers.')
    },
    async ({ projectId, emails }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/remove-workers/by-emails`, {
          emails: emails
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in remove_workers_by_emails:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Create project from template
  registerToolWithMetadata(
    server,
    'create_project_from_template',
    'Creates a new project from an existing template. The new project will inherit the template\'s structure including tasklists, tasks, custom fields, and default settings. This is much faster than creating a project manually when you have standardized project structures. Get template IDs from get_template_projects first.',
    {
      templateId: z.string().describe('Unique template project identifier (numeric string, e.g., "197352"). Get template IDs from get_template_projects.'),
      projectData: z.object({
        name: z.string().describe('Name for the new project - should be descriptive and unique'),
        currency_iso: z.enum(['CZK', 'EUR', 'USD']).optional().describe('Optional: Project currency (CZK, EUR, or USD). If not specified, inherits from template.')
      }).describe('Configuration data for the new project')
    },
    async ({ templateId, projectData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/create-from-template/${templateId}`, projectData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_project_from_template:', error);
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
      outputSchema: ProjectSchema
    }
  );
  
  // ====================
  // EXTENDED TASKS TOOLS
  // ====================
  
  // Get finished tasks in tasklist
  registerToolWithMetadata(
    server,
    'get_finished_tasks',
    'Fetches completed/finished tasks from a specific tasklist. Returns tasks that have been marked as done with finish_task. Useful for reviewing completed work, generating reports, or finding tasks to reactivate. Optionally filter results with fulltext search. For finished tasks across all projects, use get_all_tasks with state_id=2 instead.',
    {
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists.'),
      search_query: z.string().optional().describe('Optional: Fulltext search query to filter finished task names (case insensitive, e.g., "bug fix")')
    },
    async ({ tasklistId, search_query }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = search_query ? { search_query } : {};
        const response = await apiClient.get(`/tasklist/${tasklistId}/finished-tasks`, { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_finished_tasks:', error);
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
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );
  
  // Move task to different tasklist
  registerToolWithMetadata(
    server,
    'move_task',
    'Moves a task from its current tasklist to a different tasklist. The target tasklist can be in the same project or a different project. Task data, comments, attachments, and history are preserved. Use this for reorganizing work or transferring tasks between project phases. The task ID remains the same after moving.',
    {
      taskId: z.string().describe('Unique task identifier to move (numeric string, e.g., "25368707"). Get from get_all_tasks or get_tasklist_tasks.'),
      targetTasklistId: z.string().describe('Unique identifier of destination tasklist (numeric string, e.g., "12345"). Can be in same or different project. Get from get_project_tasklists.')
    },
    async ({ taskId, targetTasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/move/${targetTasklistId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in move_task:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Get task description
  registerToolWithMetadata(
    server,
    'get_task_description',
    'Fetches only the description content of a task. More lightweight than get_task_details when you only need the description text. Useful for reading task details without fetching full task metadata. Descriptions can contain plain text or markdown formatting with requirements, acceptance criteria, or notes.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/task/${taskId}/description`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_task_description:', error);
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
      outputSchema: TaskDetailedSchema
    }
  );
  
  // Update task description
  registerToolWithMetadata(
    server,
    'update_task_description',
    'Updates only the description of a task without affecting other task properties. More efficient than edit_task when only changing the description. Supports plain text or markdown. Use this to add context, requirements, acceptance criteria, or technical notes. Previous description is replaced completely.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      description: z.string().describe('New description content in plain text or markdown. Replaces existing description completely. Use empty string to clear description.')
    },
    async ({ taskId, description }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/description`, { content: description });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in update_task_description:', error);
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
      outputSchema: TaskDetailedSchema
    }
  );
  
  // Create task reminder
  registerToolWithMetadata(
    server,
    'create_task_reminder',
    'Creates a reminder notification for a task that will be sent at the specified date/time. Users will receive notifications in Freelo to check the task. Useful for follow-ups, deadlines, or periodic reviews. You can remind specific users or use default assignees. Delete with delete_task_reminder if needed.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      reminderData: z.object({
        date: z.string().describe('Reminder date and time in ISO 8601 format (e.g., "2025-10-15T14:00:00Z" or "2025-10-15T14:00:00+02:00"). Users will be notified at this time.'),
        user_ids: z.array(z.string()).optional().describe('Optional: Array of user IDs to remind (e.g., ["12345", "67890"]). If not specified, task assignees are reminded. Get IDs from get_project_workers.')
      }).describe('Reminder configuration data')
    },
    async ({ taskId, reminderData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Transform date -> remind_at for API
        const apiData = {
          remind_at: reminderData.date,
          ...(reminderData.user_ids && { user_ids: reminderData.user_ids })
        };
        const response = await apiClient.post(`/task/${taskId}/reminder`, apiData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_task_reminder:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Delete task reminder
  registerToolWithMetadata(
    server,
    'delete_task_reminder',
    'Removes an existing reminder from a task. Use this to cancel scheduled reminders that are no longer needed or were set incorrectly. The task itself is not affected - only the reminder is removed. Users will no longer receive the scheduled notification.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing reminder. Get from get_all_tasks or get_task_details.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/reminder`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_task_reminder:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Get public link for task
  registerToolWithMetadata(
    server,
    'get_public_link',
    'Generates or retrieves a public sharing link for a task. Anyone with this link can view the task details without logging into Freelo - useful for sharing with external stakeholders, clients, or contractors. The link remains active until deleted with delete_public_link. Task content is read-only via public links.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details. A public link will be generated if none exists.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/public-link/task/${taskId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_public_link:', error);
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
      outputSchema: z.object({ url: z.string().url() })
    }
  );
  
  // Delete public link for task
  registerToolWithMetadata(
    server,
    'delete_public_link',
    'Removes the public sharing link for a task. After deletion, the previous link URL will no longer work and task details will no longer be accessible without authentication. Use this when you no longer want to share the task publicly or when project information becomes confidential. The task itself is not deleted.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing public link. Get from get_all_tasks or after get_public_link.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/public-link/task/${taskId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_public_link:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Create task from template
  registerToolWithMetadata(
    server,
    'create_task_from_template',
    'Creates a new task based on an existing template task. The new task inherits the template\'s name, description, custom fields, subtasks, and structure. Saves time when creating repetitive tasks with standardized formats. Find templates in template projects using get_template_projects. After creation, you can modify the task with edit_task.',
    {
      templateId: z.string().describe('Unique template task identifier (numeric string, e.g., "25368707"). Get template tasks from projects returned by get_template_projects.'),
      projectId: z.string().describe('Unique identifier of target project where task will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique identifier of target tasklist where task will be created (numeric string, e.g., "12345"). Get from get_project_tasklists.')
    },
    async ({ templateId, projectId, tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/create-from-template/${templateId}`, {
          project_id: projectId,
          tasklist_id: tasklistId
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_task_from_template:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Set total time estimate for task
  registerToolWithMetadata(
    server,
    'set_total_time_estimate',
    'Sets the total estimated time for completing a task in minutes. This is a PREMIUM FEATURE and may require a paid Freelo plan (returns 402 Payment Required on free plans). Estimates help with project planning, resource allocation, and deadline forecasting. Use set_user_time_estimate for per-user estimates instead. Delete with delete_total_time_estimate.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      minutes: z.number().describe('Total estimated time in minutes (e.g., 60 for 1 hour, 480 for 8 hours, 120 for 2 hours). Must be positive number.')
    },
    async ({ taskId, minutes }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/total-time-estimate`, { minutes });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in set_total_time_estimate:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Delete total time estimate
  registerToolWithMetadata(
    server,
    'delete_total_time_estimate',
    'Removes the total time estimate from a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Use this when estimates are no longer needed or were set incorrectly. The task itself is not affected. Time tracking history is preserved.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing total time estimate. Get from get_all_tasks or get_task_details.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/total-time-estimate`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_total_time_estimate:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Set user time estimate for task
  registerToolWithMetadata(
    server,
    'set_user_time_estimate',
    'Sets a time estimate for a specific user on a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Useful for collaborative tasks where different team members contribute different amounts of time. Each user can have their own estimate. Use set_total_time_estimate for overall task estimate instead. Delete with delete_user_time_estimate.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Get from get_all_tasks or get_task_details.'),
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). User should be assigned to task or project. Get from get_project_workers.'),
      minutes: z.number().describe('Estimated time for this specific user in minutes (e.g., 120 for 2 hours, 60 for 1 hour). Must be positive number.')
    },
    async ({ taskId, userId, minutes }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/users-time-estimates/${userId}`, { minutes });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in set_user_time_estimate:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // Delete user time estimate
  registerToolWithMetadata(
    server,
    'delete_user_time_estimate',
    'Removes a user-specific time estimate from a task. This is a PREMIUM FEATURE (may return 402 Payment Required on free plans). Use this when a user\'s estimate is no longer needed or was set incorrectly. Other users\' estimates and the task itself are not affected.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "25368707"). Must have an existing user time estimate. Get from get_all_tasks or get_task_details.'),
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Must have an existing time estimate on this task. Get from get_project_workers.')
    },
    async ({ taskId, userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/task/${taskId}/users-time-estimates/${userId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_user_time_estimate:', error);
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
      outputSchema: TaskSchema
    }
  );
  
  // ====================
  // WORK REPORTS TOOLS
  // ====================
  
  // Get work reports
  registerToolWithMetadata(
    server,
    'get_work_reports',
    'Fetches work reports with powerful filtering options. Work reports track time spent on tasks - essential for billing, productivity analysis, and project reporting. Supports filtering by projects, users, task labels, and date ranges. Use this for generating timesheets, analyzing team productivity, or preparing client invoices.',
    {
      filters: z.object({
        projects_ids: z.array(z.string()).optional().describe('Filter by project IDs (numeric strings, e.g., ["197352", "198000"]). Get from get_projects or get_all_projects.'),
        users_ids: z.array(z.string()).optional().describe('Filter by user IDs (numeric strings, e.g., ["12345", "67890"]). Get from get_users or get_project_workers.'),
        tasks_labels: z.array(z.string()).optional().describe('Filter by task label names (e.g., ["urgent", "bug"]). Get labels from find_available_labels.'),
        date_reported_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD (e.g., "2025-10-01")'),
          date_to: z.string().describe('End date in format YYYY-MM-DD (e.g., "2025-10-31")')
        }).optional().describe('Filter by date range when work was reported. Essential for monthly/weekly reports.')
      }).optional().describe('Optional filters - combine multiple for precise queries')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/work-reports', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_work_reports:', error);
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
      outputSchema: createArrayResponseSchema(WorkReportSchema)
    }
  );
  
  // Create work report
  registerToolWithMetadata(
    server,
    'create_work_report',
    'Creates a new work report (time entry) for a specific task. Work reports track time spent on tasks for billing, productivity analysis, and project reporting. Use this after completing work on a task or at end of day for timesheet entry. For real-time tracking, use start_time_tracking instead.',
    {
      taskId: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks, get_tasklist_tasks, or get_task_details.'),
      reportData: z.object({
        minutes: z.number().describe('Number of minutes worked (e.g., 120 for 2 hours, 30 for half hour). Will be converted to hours in reports.'),
        date: z.string().describe('Date of work in format YYYY-MM-DD (e.g., "2025-10-11"). Usually today\'s date or past date for retroactive entries.'),
        description: z.string().optional().describe('Optional: Description of work performed (e.g., "Fixed login bug", "Client meeting notes"). Useful for detailed billing and reporting.')
      }).describe('Work report data')
    },
    async ({ taskId, reportData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/task/${taskId}/work-reports`, reportData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_work_report:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // Update work report
  registerToolWithMetadata(
    server,
    'update_work_report',
    'Updates an existing work report. Use this to correct time entries, update descriptions, or change the date of logged work. Useful for fixing mistakes in timesheets or adding details to previously logged work. Get work report IDs from get_work_reports.',
    {
      workReportId: z.string().describe('Unique work report identifier (numeric string, e.g., "12345"). Get from get_work_reports response.'),
      reportData: z.object({
        minutes: z.number().optional().describe('Optional: Updated number of minutes worked (e.g., 120 for 2 hours)'),
        date: z.string().optional().describe('Optional: Updated date in format YYYY-MM-DD (e.g., "2025-10-11")'),
        description: z.string().optional().describe('Optional: Updated description of work performed')
      }).describe('Updated work report data - all fields optional, only provide what needs to change')
    },
    async ({ workReportId, reportData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/work-reports/${workReportId}`, reportData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in update_work_report:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // Delete work report
  registerToolWithMetadata(
    server,
    'delete_work_report',
    'Permanently deletes a work report (time entry). WARNING: This action is irreversible! Use this to remove incorrect time entries or duplicate reports. Consider using update_work_report to fix mistakes instead of deleting. Get work report IDs from get_work_reports.',
    {
      workReportId: z.string().describe('Unique work report identifier to permanently delete (numeric string, e.g., "12345"). WARNING: This is irreversible! Get from get_work_reports response.')
    },
    async ({ workReportId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/work-reports/${workReportId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_work_report:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // ====================
  // TIME TRACKING TOOLS
  // ====================
  
  // Start time tracking
  registerToolWithMetadata(
    server,
    'start_time_tracking',
    'Starts real-time time tracking for a task or general work. Creates an active timer that runs until stopped with stop_time_tracking. Use this for live time tracking during work - when stopped, it automatically creates a work report. For manual time entry after work is done, use create_work_report instead.',
    {
      taskId: z.string().optional().describe('Optional: Task ID to track time for (numeric string, e.g., "12345"). If not provided, tracks general work time. Get from get_all_tasks or get_tasklist_tasks.')
    },
    async ({ taskId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = taskId ? { task_id: taskId } : {};
        const response = await apiClient.post('/timetracking/start', null, { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in start_time_tracking:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // Stop time tracking
  registerToolWithMetadata(
    server,
    'stop_time_tracking',
    'Stops the currently active time tracking session. Calculates elapsed time since start_time_tracking was called and automatically creates a work report with the tracked time. Use this when finishing work on a task. If no timer is running, this will return an error.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/timetracking/stop');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in stop_time_tracking:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // Edit time tracking
  registerToolWithMetadata(
    server,
    'edit_time_tracking',
    'Edits the currently active time tracking session. Use this to change which task is being tracked or add/update the description while the timer is still running. Useful when you realize you started tracking the wrong task or want to add notes. Only works with an active timer.',
    {
      trackingData: z.object({
        task_id: z.string().optional().describe('Optional: New task ID to track time for (numeric string, e.g., "12345"). Use to switch task while timer runs.'),
        description: z.string().optional().describe('Optional: Description to add to the time tracking session (e.g., "Working on feature X"). Will appear in work report when stopped.')
      }).describe('Data to edit in current time tracking - all fields optional')
    },
    async ({ trackingData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/timetracking/edit', trackingData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in edit_time_tracking:', error);
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
      outputSchema: WorkReportSchema
    }
  );
  
  // ====================
  // CUSTOM FIELDS TOOLS
  // ====================
  
  // Get custom field types
  registerToolWithMetadata(
    server,
    'get_custom_field_types',
    'Fetches all available custom field types in Freelo. Custom fields allow you to extend tasks with additional metadata like priority levels, client names, budget amounts, or any project-specific data. PREMIUM FEATURE: Requires paid Freelo plan. Use this before create_custom_field to see available field types (text, number, date, select, etc.).',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/custom-field/get-types');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_custom_field_types:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), name: z.string() }))
    }
  );
  
  // Create custom field
  registerToolWithMetadata(
    server,
    'create_custom_field',
    'Creates a new custom field for a project. Custom fields extend tasks with project-specific metadata (e.g., "Client Name", "Priority Level", "Budget"). PREMIUM FEATURE: Requires paid Freelo plan. After creation, use add_or_edit_field_value to set values on tasks. Get field types from get_custom_field_types first.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      fieldData: z.object({
        name: z.string().describe('Name of the custom field (e.g., "Client Name", "Priority Level", "Budget Amount")'),
        type: z.string().describe('Type of the custom field (e.g., "text", "number", "date", "select"). Get available types from get_custom_field_types.'),
        is_required: z.enum(['yes', 'no']).optional().describe('Whether field is required when creating/editing tasks: "yes" or "no" (default). Required fields must be filled in.')
      }).describe('Custom field data')
    },
    async ({ projectId, fieldData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/create/${projectId}`, fieldData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_custom_field:', error);
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
      outputSchema: z.object({ id: z.string(), name: z.string(), type: z.string() })
    }
  );
  
  // Rename custom field
  registerToolWithMetadata(
    server,
    'rename_custom_field',
    'Renames an existing custom field. Use this to update the display name of a custom field across the entire project. All existing values are preserved, only the field label changes. PREMIUM FEATURE: Requires paid Freelo plan. Get custom field UUIDs from get_custom_fields_by_project.',
    {
      uuid: z.string().describe('UUID of the custom field to rename (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response.'),
      name: z.string().describe('New name for the custom field (e.g., "Updated Priority Level", "New Client Field")')
    },
    async ({ uuid, name }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/rename/${uuid}`, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in rename_custom_field:', error);
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
      outputSchema: z.object({ id: z.string(), name: z.string() })
    }
  );
  
  // Delete custom field
  registerToolWithMetadata(
    server,
    'delete_custom_field',
    'Deletes a custom field from a project. The field will be removed from all tasks and hidden from views. This is reversible - use restore_custom_field to un-delete. PREMIUM FEATURE: Requires paid Freelo plan. Get custom field UUIDs from get_custom_fields_by_project. Consider renaming instead if you might need it later.',
    {
      uuid: z.string().describe('UUID of the custom field to delete (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response.')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/custom-field/delete/${uuid}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_custom_field:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Restore custom field
  registerToolWithMetadata(
    server,
    'restore_custom_field',
    'Restores a previously deleted custom field. The field will become visible again with all its values preserved. Use this to un-delete custom fields that were removed with delete_custom_field. PREMIUM FEATURE: Requires paid Freelo plan. Get deleted field UUIDs from get_custom_fields_by_project.',
    {
      uuid: z.string().describe('UUID of the deleted custom field to restore (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response (includes deleted fields).')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field/restore/${uuid}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in restore_custom_field:', error);
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
      outputSchema: z.object({ id: z.string(), name: z.string() })
    }
  );
  
  // Add or edit field value
  registerToolWithMetadata(
    server,
    'add_or_edit_field_value',
    'Sets or updates a custom field value on a task. Use this to add metadata like client names, budgets, or priorities to tasks. For enum/select fields, use add_or_edit_enum_value instead. PREMIUM FEATURE: Requires paid Freelo plan. Works with text, number, date, and other non-enum field types.',
    {
      valueData: z.object({
        task_id: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks, get_tasklist_tasks, or get_task_details.'),
        custom_field_uuid: z.string().describe('UUID of the custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project.'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('Value to set. Type depends on field: string for text, number for numeric, boolean for checkbox, "YYYY-MM-DD" for date.')
      }).describe('Field value data')
    },
    async ({ valueData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/custom-field/add-or-edit-value', valueData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in add_or_edit_field_value:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Add or edit enum value
  registerToolWithMetadata(
    server,
    'add_or_edit_enum_value',
    'Sets or updates an enum/select custom field value on a task. Use this for dropdown/select custom fields (e.g., "Priority: High/Medium/Low", "Status: Approved/Pending/Rejected"). For other field types, use add_or_edit_field_value instead. PREMIUM FEATURE: Requires paid Freelo plan. Get enum options from get_enum_options.',
    {
      valueData: z.object({
        task_id: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
        custom_field_uuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project.'),
        enum_option_uuid: z.string().describe('UUID of the enum option to select (e.g., "b2c3d4e5-f6a7-8901-bcde-f12345678901"). Get from get_enum_options.')
      }).describe('Enum value data')
    },
    async ({ valueData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/custom-field/add-or-edit-enum-value', valueData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in add_or_edit_enum_value:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Delete field value
  registerToolWithMetadata(
    server,
    'delete_field_value',
    'Deletes a custom field value from a task. Use this to clear/remove custom field data from a task. The custom field definition remains, only this specific task\'s value is removed. PREMIUM FEATURE: Requires paid Freelo plan. Get value UUIDs from task details or get_custom_fields_by_project response.',
    {
      uuid: z.string().describe('UUID of the field value to delete (e.g., "c3d4e5f6-a7b8-9012-cdef-123456789012"). Get from task details in get_task_details response or get_custom_fields_by_project.')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/custom-field/delete-value/${uuid}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_field_value:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Get custom fields by project
  registerToolWithMetadata(
    server,
    'get_custom_fields_by_project',
    'Fetches all custom fields defined in a specific project, including their UUIDs, types, and configurations. Essential for understanding which custom fields are available before setting values on tasks. PREMIUM FEATURE: Requires paid Freelo plan. Returns both active and deleted fields.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects, get_all_projects, or get_project_details.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/custom-field/find-by-project/${projectId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_custom_fields_by_project:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), name: z.string(), type: z.string() }))
    }
  );
  
  // Get enum options
  registerToolWithMetadata(
    server,
    'get_enum_options',
    'Fetches all available options for an enum/select custom field. Use this to see what values can be selected before using add_or_edit_enum_value. Returns option UUIDs, names, and colors. PREMIUM FEATURE: Requires paid Freelo plan. Only works with enum/select type fields.',
    {
      customFieldUuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project for enum-type fields.')
    },
    async ({ customFieldUuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/custom-field-enum/get-for-custom-field/${customFieldUuid}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_enum_options:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), value: z.string() }))
    }
  );
  
  // Create enum option
  registerToolWithMetadata(
    server,
    'create_enum_option',
    'Creates a new option for an enum/select custom field. Use this to add new values to dropdown fields (e.g., add "Critical" to a "Priority" field). After creation, use add_or_edit_enum_value to assign this option to tasks. PREMIUM FEATURE: Requires paid Freelo plan. Only works with enum/select type fields.',
    {
      customFieldUuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project for enum-type fields.'),
      optionData: z.object({
        name: z.string().describe('Name of the new option (e.g., "High Priority", "Approved", "Phase 2"). Will appear in dropdown.'),
        color: z.string().optional().describe('Optional: Color for the option in hex format (e.g., "#FF0000" for red, "#00FF00" for green). Used for visual distinction.')
      }).describe('Enum option data')
    },
    async ({ customFieldUuid, optionData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/custom-field-enum/create/${customFieldUuid}`, optionData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_enum_option:', error);
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
      outputSchema: z.object({ id: z.string(), value: z.string() })
    }
  );
  
  // ====================
  // INVOICING TOOLS
  // ====================
  
  // Get issued invoices
  registerToolWithMetadata(
    server,
    'get_issued_invoices',
    'Fetches issued invoices with filtering options. Use this to retrieve client invoices for accounting, billing reports, or financial analysis. Supports filtering by project and date range. Essential for tracking billable work and generating financial reports.',
    {
      filters: z.object({
        project_id: z.string().optional().describe('Filter by project ID (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
        date_from: z.string().optional().describe('Filter invoices from this date in format YYYY-MM-DD (e.g., "2025-10-01")'),
        date_to: z.string().optional().describe('Filter invoices to this date in format YYYY-MM-DD (e.g., "2025-10-31")')
      }).optional().describe('Optional filters for invoices')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/issued-invoices', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_issued_invoices:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), number: z.string(), amount: z.number() }))
    }
  );
  
  // Get invoice detail
  registerToolWithMetadata(
    server,
    'get_invoice_detail',
    'Fetches detailed information about a specific invoice, including line items, work reports, amounts, and status. Use this to review invoice details before sending to clients or for detailed accounting records. Get invoice IDs from get_issued_invoices.',
    {
      invoiceId: z.string().describe('Unique invoice identifier (numeric string, e.g., "12345"). Get from get_issued_invoices response.')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/issued-invoice/${invoiceId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_invoice_detail:', error);
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
      outputSchema: z.object({ id: z.number(), number: z.string(), amount: z.number() })
    }
  );
  
  // Download invoice reports
  registerToolWithMetadata(
    server,
    'download_invoice_reports',
    'Downloads work reports and time tracking data associated with an invoice. Use this to get detailed breakdown of billable work for client transparency or internal auditing. Returns work report data that was included in the invoice calculation.',
    {
      invoiceId: z.string().describe('Unique invoice identifier (numeric string, e.g., "12345"). Get from get_issued_invoices or get_invoice_detail.')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/issued-invoice/${invoiceId}/reports`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in download_invoice_reports:', error);
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
      outputSchema: z.object({ url: z.string().url() })
    }
  );
  
  // Mark as invoiced
  registerToolWithMetadata(
    server,
    'mark_as_invoiced',
    'Marks an invoice as invoiced (sent to client). Use this to track invoice status and indicate that the invoice has been delivered to the client. Important for invoice lifecycle management and accounting workflows. Get invoice IDs from get_issued_invoices.',
    {
      invoiceId: z.string().describe('Unique invoice identifier to mark as invoiced (numeric string, e.g., "12345"). Get from get_issued_invoices response.')
    },
    async ({ invoiceId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/issued-invoice/${invoiceId}/mark-as-invoiced`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in mark_as_invoiced:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // ====================
  // NOTIFICATIONS TOOLS
  // ====================
  
  // Get all notifications
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
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-notifications', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_all_notifications:', error);
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
      outputSchema: createArrayResponseSchema(NotificationSchema)
    }
  );
  
  // Mark notification as read
  registerToolWithMetadata(
    server,
    'mark_notification_read',
    'Marks a specific notification as read. Use this to track which notifications have been seen and reduce unread notification counts. Essential for notification management workflows. Get notification IDs from get_all_notifications.',
    {
      notificationId: z.string().describe('Unique notification identifier (numeric string, e.g., "12345"). Get from get_all_notifications response.')
    },
    async ({ notificationId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/notification/${notificationId}/mark-as-read`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in mark_notification_read:', error);
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
      outputSchema: NotificationSchema
    }
  );
  
  // Mark notification as unread
  registerToolWithMetadata(
    server,
    'mark_notification_unread',
    'Marks a specific notification as unread. Use this to flag notifications that require follow-up action or to restore notifications that were accidentally marked as read. Get notification IDs from get_all_notifications.',
    {
      notificationId: z.string().describe('Unique notification identifier (numeric string, e.g., "12345"). Get from get_all_notifications response.')
    },
    async ({ notificationId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/notification/${notificationId}/mark-as-unread`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in mark_notification_unread:', error);
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
      outputSchema: NotificationSchema
    }
  );
  
  // ====================
  // NOTES TOOLS
  // ====================
  
  // Create note
  registerToolWithMetadata(
    server,
    'create_note',
    'Creates a new note in a project. Notes are standalone documents for project documentation, meeting minutes, specifications, or any reference material. Unlike task comments, notes are top-level project items. Use this for knowledge base, documentation, or project wikis.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      noteData: z.object({
        name: z.string().describe('Title of the note (e.g., "Meeting Minutes 2025-10-11", "API Documentation", "Project Spec")'),
        content: z.string().describe('Content of the note in plain text or markdown. Can include detailed documentation, meeting notes, specifications, etc.')
      }).describe('Note data')
    },
    async ({ projectId, noteData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/project/${projectId}/note`, noteData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_note:', error);
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
      outputSchema: NoteSchema
    }
  );
  
  // Get note
  registerToolWithMetadata(
    server,
    'get_note',
    'Fetches a specific note by ID, including its title, content, and metadata. Use this to read project documentation, meeting minutes, or reference materials. Get note IDs from project details or search results.',
    {
      noteId: z.string().describe('Unique note identifier (numeric string, e.g., "12345"). Get from create_note response or project details.')
    },
    async ({ noteId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/note/${noteId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_note:', error);
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
      outputSchema: NoteSchema
    }
  );
  
  // Update note
  registerToolWithMetadata(
    server,
    'update_note',
    'Updates an existing note\'s title or content. Use this to maintain documentation, update meeting minutes, or revise project specifications. All fields are optional - only provide what needs to change. Get note IDs from get_note or project details.',
    {
      noteId: z.string().describe('Unique note identifier (numeric string, e.g., "12345"). Get from create_note, get_note, or project details.'),
      noteData: z.object({
        name: z.string().optional().describe('Optional: Updated title of the note'),
        content: z.string().optional().describe('Optional: Updated content of the note in plain text or markdown')
      }).describe('Updated note data - all fields optional, only provide what needs to change')
    },
    async ({ noteId, noteData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post(`/note/${noteId}`, noteData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in update_note:', error);
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
      outputSchema: NoteSchema
    }
  );
  
  // Delete note
  registerToolWithMetadata(
    server,
    'delete_note',
    'Permanently deletes a note from a project. WARNING: This action is irreversible! All note content will be permanently lost. Consider updating the note to archive it instead. Use this only when you are certain the note should be removed.',
    {
      noteId: z.string().describe('Unique note identifier to permanently delete (numeric string, e.g., "12345"). WARNING: This is irreversible! Get from create_note, get_note, or project details.')
    },
    async ({ noteId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/note/${noteId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_note:', error);
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
      outputSchema: NoteSchema
    }
  );
  
  // ====================
  // USERS EXTENDED TOOLS
  // ====================
  
  // Get projects where user is project manager
  registerToolWithMetadata(
    server,
    'get_project_manager_of',
    'Fetches projects where the current authenticated user is assigned as the project manager (PM). Project managers typically have elevated permissions and responsibilities for project oversight. This differs from get_projects which returns projects you own - you can be PM on projects owned by others. Useful for understanding your management responsibilities.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/users/project-manager-of');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_project_manager_of:', error);
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
      outputSchema: createArrayResponseSchema(ProjectSchema)
    }
  );
  
  // Invite users by email
  registerToolWithMetadata(
    server,
    'invite_users_by_email',
    'Invites users to a project by their email addresses. If users don\'t have Freelo accounts, they will receive invitation emails. If they already exist, they will be added to the project immediately. This is convenient when you don\'t know user IDs. For inviting existing users by ID, use invite_users_by_ids. Essential for building project teams.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      emails: z.array(z.string()).describe('Array of email addresses to invite (e.g., ["user@example.com", "colleague@company.com"]). Users will receive invitations if not registered yet.')
    },
    async ({ projectId, emails }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/users/manage-workers', {
          project_id: projectId,
          emails: emails
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in invite_users_by_email:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Invite users by IDs
  registerToolWithMetadata(
    server,
    'invite_users_by_ids',
    'Invites existing Freelo users to a project using their user IDs. Users must already have Freelo accounts. This is faster and more precise than email invitations when you know the user IDs. Get user IDs from get_users first. For inviting by email (including new users), use invite_users_by_email instead.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      userIds: z.array(z.string()).describe('Array of user IDs to invite (e.g., ["12345", "67890"]). Users must already exist in Freelo. Get IDs from get_users.')
    },
    async ({ projectId, userIds }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/users/manage-workers', {
          projects_ids: [projectId],  // API expects 'projects_ids' as array when using users_ids
          users_ids: userIds
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in invite_users_by_ids:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Get out of office
  registerToolWithMetadata(
    server,
    'get_out_of_office',
    'Fetches out-of-office (vacation/absence) information for a user. Returns dates and reason if set. Useful for checking team member availability before assigning tasks or scheduling work. Helps with resource planning and deadline setting.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Get from get_users or get_project_workers.')
    },
    async ({ userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/user/${userId}/out-of-office`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_out_of_office:', error);
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
      outputSchema: z.object({ from: z.string(), to: z.string(), message: z.string().optional() })
    }
  );
  
  // Set out of office
  registerToolWithMetadata(
    server,
    'set_out_of_office',
    'Sets out-of-office (vacation/absence) period for a user. Other team members will see when the user is unavailable. Helps with workload distribution and prevents assigning work during absences. Can include optional reason (vacation, sick leave, etc.). Delete with delete_out_of_office to cancel.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Typically the current user. Get from get_users.'),
      outOfOfficeData: z.object({
        date_from: z.string().describe('Absence start date in format YYYY-MM-DD (e.g., "2025-10-15")'),
        date_to: z.string().describe('Absence end date in format YYYY-MM-DD (e.g., "2025-10-20"). Must be after date_from.'),
        reason: z.string().optional().describe('Optional: Absence reason (e.g., "Vacation", "Sick leave", "Conference"). Visible to team members.')
      }).describe('Out-of-office configuration data')
    },
    async ({ userId, outOfOfficeData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // API expects data wrapped in 'out_of_office' key
        const response = await apiClient.post(`/user/${userId}/out-of-office`, {
          out_of_office: outOfOfficeData
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in set_out_of_office:', error);
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
      outputSchema: z.object({ from: z.string(), to: z.string(), message: z.string().optional() })
    }
  );
  
  // Delete out of office
  registerToolWithMetadata(
    server,
    'delete_out_of_office',
    'Removes out-of-office status for a user. Use this when plans change and the user becomes available earlier than expected, or to cancel mistakenly set absences. The user will appear as available immediately.',
    {
      userId: z.string().describe('Unique user identifier (numeric string, e.g., "12345"). Must have existing out-of-office status. Get from get_users.')
    },
    async ({ userId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/user/${userId}/out-of-office`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_out_of_office:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // ====================
  // EVENTS, TASKLISTS & OTHER TOOLS
  // ====================
  
  // Get events
  registerToolWithMetadata(
    server,
    'get_events',
    'Fetches activity events (audit log) with powerful filtering options. Events track all changes in Freelo: task updates, comments, status changes, assignments, file uploads, etc. Essential for activity tracking, auditing, generating reports, or building activity feeds. Supports filtering by projects, users, event types, tasks, and date ranges with pagination.',
    {
      filters: z.object({
        projects_ids: z.array(z.number()).optional().describe('Filter by project IDs (numeric array, e.g., [197352, 198000]). Get from get_projects or get_all_projects.'),
        users_ids: z.array(z.number()).optional().describe('Filter by user IDs who performed actions (numeric array, e.g., [12345, 67890]). Get from get_users.'),
        events_types: z.array(z.string()).optional().describe('Filter by event types (e.g., ["task_created", "task_finished", "comment_added"]). Common types: task_created, task_finished, task_assigned, comment_added, file_uploaded.'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort order: "desc" (newest first, default) or "asc" (oldest first)'),
        date_range: z.object({
          date_from: z.string().describe('Start date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-01")'),
          date_to: z.string().describe('End date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS (e.g., "2025-10-31")')
        }).optional().describe('Filter events within date range. Essential for period reports and historical analysis.'),
        tasks_ids: z.array(z.number()).optional().describe('Filter by task IDs (numeric array, e.g., [12345, 67890]). Use to see all activity for specific tasks.'),
        p: z.number().optional().describe('Page number for pagination, starts at 0 (default: 0). Critical for large event sets to avoid token limits.')
      }).optional().describe('Optional filters - combine multiple for precise queries')
    },
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/events', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_events:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), type: z.string(), date: z.string() }))
    }
  );
  
  // Get tasklist details
  registerToolWithMetadata(
    server,
    'get_tasklist_details',
    'Fetches detailed information about a specific tasklist including name, description, color, workers, and settings. Use this after get_project_tasklists to understand tasklist configuration before creating tasks or managing workers. Essential for understanding tasklist structure and permissions.',
    {
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists or get_all_projects.')
    },
    async ({ tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/tasklist/${tasklistId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_tasklist_details:', error);
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
      outputSchema: TasklistSchema
    }
  );
  
  // Get assignable workers
  registerToolWithMetadata(
    server,
    'get_assignable_workers',
    'Fetches the list of users who can be assigned to tasks in a specific tasklist. This considers project permissions and tasklist worker restrictions. Use this before creating or assigning tasks to ensure the assignee has access. Returns user details including names, IDs, and availability.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      tasklistId: z.string().describe('Unique tasklist identifier (numeric string, e.g., "12345"). Get from get_project_tasklists.')
    },
    async ({ projectId, tasklistId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}/tasklist/${tasklistId}/assignable-workers`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_assignable_workers:', error);
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
      outputSchema: createArrayResponseSchema(UserSchema)
    }
  );
  
  // Create tasklist from template
  registerToolWithMetadata(
    server,
    'create_tasklist_from_template',
    'Creates a new tasklist based on an existing template tasklist. The new tasklist inherits the template\'s structure, tasks, and settings. Much faster than creating tasklists manually when you have standardized workflows. Find template tasklists in template projects using get_template_projects.',
    {
      templateId: z.string().describe('Unique template tasklist identifier (numeric string, e.g., "12345"). Get from tasklists in template projects returned by get_template_projects.'),
      projectId: z.string().describe('Unique identifier of target project where tasklist will be created (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    async ({ templateId, projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // API expects flat structure (no wrapping key) with 'tasklist_id' and 'target_project_id'
        const response = await apiClient.post(`/tasklist/create-from-template/${templateId}`, {
          tasklist_id: parseInt(templateId),
          target_project_id: parseInt(projectId)
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_tasklist_from_template:', error);
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
      outputSchema: TasklistSchema
    }
  );
  
  // Get custom filters
  registerToolWithMetadata(
    server,
    'get_custom_filters',
    'Fetches all custom filters (saved task views) created by the user. Custom filters are saved search configurations that combine multiple criteria for quick access to specific task sets. Use this to get filter UUIDs before using get_tasks_by_filter_uuid or get_tasks_by_filter_name.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/dashboard/custom-filters');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_custom_filters:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ uuid: z.string(), name: z.string() }))
    }
  );
  
  // Get tasks by filter UUID
  registerToolWithMetadata(
    server,
    'get_tasks_by_filter_uuid',
    'Fetches tasks using a custom filter UUID. Custom filters are pre-configured task searches with multiple criteria. Use this to quickly retrieve task sets matching saved filter configurations. Get filter UUIDs from get_custom_filters.',
    {
      uuid: z.string().describe('UUID of the custom filter (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_filters response.')
    },
    async ({ uuid }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/dashboard/custom-filter/by-uuid/${uuid}/tasks`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_tasks_by_filter_uuid:', error);
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
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );
  
  // Get tasks by filter name
  registerToolWithMetadata(
    server,
    'get_tasks_by_filter_name',
    'Fetches tasks using a custom filter name. Alternative to get_tasks_by_filter_uuid when you know the filter name but not the UUID. Custom filters are pre-configured task searches. Get filter names from get_custom_filters.',
    {
      name: z.string().describe('Name of the custom filter (e.g., "My High Priority Tasks", "Overdue Items"). Get from get_custom_filters response.')
    },
    async ({ name }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/dashboard/custom-filter/by-name/${encodeURIComponent(name)}/tasks`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_tasks_by_filter_name:', error);
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
      outputSchema: createArrayResponseSchema(TaskSchema)
    }
  );
  
  // Find available labels
  registerToolWithMetadata(
    server,
    'find_available_labels',
    'Fetches all available task labels (tags) in Freelo, optionally filtered by project. Labels are used to categorize and filter tasks (e.g., "urgent", "bug", "feature", "design"). Essential before using get_all_tasks with label filters or when applying labels to tasks. Returns label names, colors, and usage counts.',
    {
      projectId: z.string().optional().describe('Optional: Project ID to get project-specific labels (numeric string, e.g., "197352"). If omitted, returns all labels across all projects. Get from get_projects.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const params = projectId ? { project_id: projectId } : {};
        const response = await apiClient.get('/project-labels/find-available', { params });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in find_available_labels:', error);
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
      outputSchema: createArrayResponseSchema(LabelSchema)
    }
  );
  
  // Get pinned items
  registerToolWithMetadata(
    server,
    'get_pinned_items',
    'Fetches all pinned items in a project. Pinned items are shortcuts to important tasks, notes, or files displayed prominently for quick access. Use this to see what team members have pinned as important or frequently accessed. Essential for understanding project priorities.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.')
    },
    async ({ projectId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get(`/project/${projectId}/pinned-items`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_pinned_items:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), type: z.string() }))
    }
  );
  
  // Pin item
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
    async ({ projectId, itemData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        // Ensure link field is set (API requires non-null value)
        const apiData = {
          ...itemData,
          link: itemData.link || '#'  // Use '#' instead of empty string
        };
        const response = await apiClient.post(`/project/${projectId}/pinned-items`, apiData);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in pin_item:', error);
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
      outputSchema: z.object({ success: z.boolean() })
    }
  );
  
  // Delete pinned item
  registerToolWithMetadata(
    server,
    'delete_pinned_item',
    'Removes a pinned item from a project. Use this to unpin tasks, notes, or files that are no longer priority or frequently accessed. Does not delete the underlying item (task/note/file), only removes the pin. Get pinned item IDs from get_pinned_items.',
    {
      pinnedItemId: z.string().describe('Unique pinned item identifier (numeric string, e.g., "12345"). Get from get_pinned_items response.')
    },
    async ({ pinnedItemId }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.delete(`/pinned-item/${pinnedItemId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in delete_pinned_item:', error);
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
      outputSchema: z.object({ success: z.boolean() })
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
    async ({ filters = {} }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/all-comments', { params: filters });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_all_comments:', error);
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
      outputSchema: createArrayResponseSchema(CommentSchema)
    }
  );
  
  // Create task labels
  registerToolWithMetadata(
    server,
    'create_task_labels',
    'Creates a new task label (tag) for categorizing tasks. Labels help organize and filter tasks across projects (e.g., "urgent", "bug", "feature", "design"). After creation, labels can be applied to tasks via edit_task or filtered with get_all_tasks. Use find_available_labels to see existing labels first.',
    {
      labelData: z.object({
        name: z.string().describe('Name of the label (e.g., "urgent", "bug", "feature", "design"). Should be short and descriptive for easy filtering.'),
        color: z.string().optional().describe('Optional: Color for the label in hex format (e.g., "#FF0000" for red, "#00FF00" for green). Used for visual distinction in UI.'),
        project_id: z.string().optional().describe('Optional: Project ID to associate label with specific project (numeric string, e.g., "197352"). If omitted, label is global. Get from get_projects.')
      }).describe('Label data')
    },
    async ({ labelData }) => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.post('/task-labels', { labels: [labelData] });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in create_task_labels:', error);
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
      outputSchema: LabelSchema
    }
  );
  
  // Get all states
  registerToolWithMetadata(
    server,
    'get_all_states',
    'Fetches all available task states in Freelo. States represent task lifecycle status (e.g., 1=active/open, 2=finished/completed, 3=archived). Essential for understanding state IDs before using get_all_tasks with state_id filter or when analyzing task workflows. Returns state IDs, names, and descriptions.',
    {},
    async () => {
      try {
        const auth = {
          email: process.env.FREELO_EMAIL,
          apiKey: process.env.FREELO_API_KEY,
          userAgent: process.env.FREELO_USER_AGENT
        };
        const apiClient = createApiClient(auth);
        const response = await apiClient.get('/states');
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data) }],
          structuredContent: response.data
        };
      } catch (error) {
        console.error('Error in get_all_states:', error);
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
      outputSchema: createArrayResponseSchema(z.object({ id: z.number(), name: z.string() }))
    }
  );

}
