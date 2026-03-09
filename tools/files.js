/**
 * Files Tools
 * Tools for managing files in Freelo
 */

import { z } from 'zod';
import FormData from 'form-data';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { FileSchema, DownloadFileResponseSchema, createArrayResponseSchema } from '../utils/schemas.js';

export function registerFilesTools(server) {
  // Get all files
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
    withErrorHandling('get_all_files', async ({ filters = {} }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/all-docs-and-files', { params: filters });
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(FileSchema)
    }
  );

  // Upload file
  registerToolWithMetadata(
    server,
    'upload_file',
    'Uploads a file to Freelo. The file can then be attached to tasks, comments, or stored in project files. Supports any file type. Files are encoded as base64 for transfer. After upload, use the returned file UUID with download_file or to attach to tasks. Maximum file size depends on Freelo plan.',
    {
      fileData: z.string().describe('File content encoded as base64 string. Convert file bytes to base64 before passing. Example in Node.js: Buffer.from(fileBytes).toString("base64")'),
      fileName: z.string().describe('Original filename with extension (e.g., "report.pdf", "screenshot.png", "document.docx"). Preserves file type and helps with identification.')
    },
    withErrorHandling('upload_file', async ({ fileData, fileName }) => {
      const apiClient = getApiClient();

      const form = new FormData();
      const fileBuffer = Buffer.from(fileData, 'base64');
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });

      const response = await apiClient.post('/file/upload', form, {
        headers: form.getHeaders()
      });
      return formatResponse(response.data);
    }),
    {
      outputSchema: FileSchema
    }
  );

  // Download file
  registerToolWithMetadata(
    server,
    'download_file',
    'Downloads a file from Freelo by its UUID. Returns the file content which can be saved locally or processed. Use this after finding files with get_all_files to retrieve the actual file data. The UUID is returned when uploading files or found in file listings.',
    {
      fileUuid: z.string().describe('Unique file identifier (UUID format, e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_all_files or after upload_file.')
    },
    withErrorHandling('download_file', async ({ fileUuid }) => {
      const apiClient = getApiClient();

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

      return formatResponse({
        filename,
        contentType,
        data: base64Data
      });
    }),
    {
      outputSchema: DownloadFileResponseSchema
    }
  );
}
