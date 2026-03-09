/**
 * Notes Tools
 * Handles note CRUD operations
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { NoteSchema } from '../utils/schemas.js';

export function registerNotesTools(server) {
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
    withErrorHandling('create_note', async ({ projectId, noteData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/project/${projectId}/note`, noteData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NoteSchema
    }
  );

  registerToolWithMetadata(
    server,
    'get_note',
    'Fetches a specific note by ID, including its title, content, and metadata. Use this to read project documentation, meeting minutes, or reference materials. Get note IDs from project details or search results.',
    {
      noteId: z.string().describe('Unique note identifier (numeric string, e.g., "12345"). Get from create_note response or project details.')
    },
    withErrorHandling('get_note', async ({ noteId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/note/${noteId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NoteSchema
    }
  );

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
    withErrorHandling('update_note', async ({ noteId, noteData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/note/${noteId}`, noteData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NoteSchema
    }
  );

  registerToolWithMetadata(
    server,
    'delete_note',
    'Permanently deletes a note from a project. WARNING: This action is irreversible! All note content will be permanently lost. Consider updating the note to archive it instead. Use this only when you are certain the note should be removed.',
    {
      noteId: z.string().describe('Unique note identifier to permanently delete (numeric string, e.g., "12345"). WARNING: This is irreversible! Get from create_note, get_note, or project details.')
    },
    withErrorHandling('delete_note', async ({ noteId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/note/${noteId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: NoteSchema
    }
  );
}
