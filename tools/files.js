/**
 * Files Tools
 * Tools for managing files in Freelo
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
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
    'Uploads a file to Freelo (max 100MB). Supports two modes: (1) filePath — reads file directly from disk, best for large files and avoids base64 overhead; (2) fileData — accepts base64-encoded content, useful when file data is already in memory. Provide either filePath or fileData (not both). After upload, use the returned UUID to attach the file to tasks or comments via the files parameter.',
    {
      filePath: z.string().optional().describe('Absolute path to a local file to upload (e.g., "/Users/me/docs/report.pdf"). Preferred for large files — reads directly from disk with no base64 overhead. Mutually exclusive with fileData.'),
      fileData: z.string().optional().describe('File content encoded as base64 string. Use for small files or when file data is already in memory. Mutually exclusive with filePath.'),
      fileName: z.string().optional().describe('Filename with extension (e.g., "report.pdf"). Required when using fileData. Optional when using filePath — defaults to the original filename from the path.')
    },
    withErrorHandling('upload_file', async ({ filePath, fileData, fileName }) => {
      // Validate: exactly one of filePath or fileData must be provided
      if (!filePath && !fileData) {
        throw new Error('Either filePath or fileData must be provided.');
      }
      if (filePath && fileData) {
        throw new Error('Provide either filePath or fileData, not both.');
      }

      const apiClient = getApiClient();
      const form = new FormData();

      if (filePath) {
        // File path mode: read directly from disk (streaming, no base64 overhead)
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`File not found: ${resolvedPath}`);
        }
        const stat = fs.statSync(resolvedPath);
        if (stat.size > 100 * 1024 * 1024) {
          throw new Error(`File exceeds 100MB limit: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
        }
        const resolvedFileName = fileName || path.basename(resolvedPath);
        form.append('file', fs.createReadStream(resolvedPath), {
          filename: resolvedFileName,
          contentType: 'application/octet-stream'
        });
      } else {
        // Base64 mode: decode and upload (backward compatible)
        if (!fileName) {
          throw new Error('fileName is required when using fileData.');
        }
        const fileBuffer = Buffer.from(fileData, 'base64');
        if (fileBuffer.length > 100 * 1024 * 1024) {
          throw new Error(`File exceeds 100MB limit: ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`);
        }
        form.append('file', fileBuffer, {
          filename: fileName,
          contentType: 'application/octet-stream'
        });
      }

      const response = await apiClient.post('/file/upload', form, {
        headers: form.getHeaders(),
        maxContentLength: 105 * 1024 * 1024,
        maxBodyLength: 105 * 1024 * 1024
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
