/**
 * MCP Server for Freelo API
 * This server implements the Model Context Protocol for Freelo API integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate environment variables
// Note: MCP servers communicate via stdio, so we cannot use console.log/warn
// Missing env vars will cause authentication errors when tools are called
if (!process.env.FREELO_EMAIL || !process.env.FREELO_API_KEY || !process.env.FREELO_USER_AGENT) {
  // Env vars missing - tools will fail if auth params not provided
}

// Import tool registrations
import { registerProjectsTools } from './tools/projects.js';
import { registerTasksTools } from './tools/tasks.js';
import { registerTasklistsTools } from './tools/tasklists.js';
import { registerSubtasksTools } from './tools/subtasks.js';
import { registerCommentsTools } from './tools/comments.js';
import { registerFilesTools } from './tools/files.js';
import { registerUsersTools } from './tools/users.js';
import { registerTimeTrackingTools } from './tools/time-tracking.js';
import { registerWorkReportsTools } from './tools/work-reports.js';
import { registerCustomFieldsTools } from './tools/custom-fields.js';
import { registerInvoicesTools } from './tools/invoices.js';
import { registerNotificationsTools } from './tools/notifications.js';
import { registerNotesTools } from './tools/notes.js';
import { registerEventsTools } from './tools/events.js';
import { registerFiltersTools } from './tools/filters.js';
import { registerLabelsTools } from './tools/labels.js';
import { registerPinnedItemsTools } from './tools/pinned-items.js';
import { registerStatesTools } from './tools/states.js';
import { registerSearchTools } from './tools/search.js';
import { registerCoreTools } from './tools/core.js';

// Function to initialize the server and register tools
export function initializeMcpServer() {
  const server = new McpServer({
    name: 'freelo-mcp',
    version: '1.0.0',
    description: 'MCP Server for Freelo API v1'
  });

  // Register all tool categories
  registerProjectsTools(server);
  registerTasksTools(server);
  registerTasklistsTools(server);
  registerSubtasksTools(server);
  registerCommentsTools(server);
  registerFilesTools(server);
  registerUsersTools(server);
  registerTimeTrackingTools(server);
  registerWorkReportsTools(server);
  registerCustomFieldsTools(server);
  registerInvoicesTools(server);
  registerNotificationsTools(server);
  registerNotesTools(server);
  registerEventsTools(server);
  registerFiltersTools(server);
  registerLabelsTools(server);
  registerPinnedItemsTools(server);
  registerStatesTools(server);
  registerSearchTools(server);
  registerCoreTools(server);  // Core contains all tools not yet split into categories

  return server;
}

// Only initialize and start listening if the script is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const serverInstance = initializeMcpServer();
  const transport = new StdioServerTransport();

  (async () => {
    try {
      await serverInstance.connect(transport);
      // MCP komunikuje přes stdio - nepoužívat console.log()!
    } catch (error) {
      // Log pouze do stderr v případě kritické chyby
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  })();
}
