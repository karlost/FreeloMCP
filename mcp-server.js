/**
 * MCP Server for Freelo API
 * This server implements the Model Context Protocol for Freelo API integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

// Validate environment variables
if (!process.env.FREELO_EMAIL || !process.env.FREELO_API_KEY || !process.env.FREELO_USER_AGENT) {
  console.error('Warning: Missing FREELO_EMAIL, FREELO_API_KEY, or FREELO_USER_AGENT environment variables. Tools will fail.');
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

// Function to initialize the server and register tools
export function initializeMcpServer() {
  const server = new McpServer({
    name: 'freelo-mcp',
    version: pkg.version,
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

  return server;
}

// Function to start stdio server (for bin/npx usage)
export async function startStdioServer() {
  const serverInstance = initializeMcpServer();
  const transport = new StdioServerTransport();

  try {
    await serverInstance.connect(transport);
    // MCP komunikuje přes stdio - nepoužívat console.log()!
  } catch (error) {
    // Log pouze do stderr v případě kritické chyby
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Auto-start only when run directly (not imported)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  startStdioServer();
}
