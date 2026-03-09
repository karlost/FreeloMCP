# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Freelo MCP Server is an unofficial community MCP (Model Context Protocol) server for the [Freelo](https://www.freelo.io/cs) Czech project management API. It exposes two servers:

1. **MCP Server** (`mcp-server.js`) — primary deliverable; uses stdio transport for AI assistant integration
2. **REST API Server** (`server.js`) — Express proxy to the Freelo API

## Commands

```bash
# Install dependencies
npm install

# Run MCP server (production)
npm run mcp

# Run MCP server (development, with auto-reload)
npm run mcp:dev

# Run REST API server
npm start          # production
npm run dev        # development with nodemon

# Tests
npm test                                        # all tests
npm test -- tests/mcp-tools-simple.test.js      # single test file
npm test -- --coverage                          # with coverage report
```

## Architecture

### MCP Server (`mcp-server.js`)
Entry point that initializes the MCP server and registers all tool categories. The `initializeMcpServer()` function is exported for testability; it only connects to stdio transport when run as main module. Version is read from `package.json`.

### Tool Modules (`tools/`)
Tools are organized by domain into 18 category files:

| File | Tools | Domain |
|------|-------|--------|
| `projects.js` | 12 | Projects CRUD, archive, templates |
| `tasks.js` | 21 | Tasks CRUD, finish/activate, time estimates, reminders |
| `tasklists.js` | 5 | Tasklists CRUD, assignable workers, templates |
| `subtasks.js` | 2 | Create/list subtasks |
| `comments.js` | 3 | Create/edit/list comments |
| `files.js` | 3 | List/upload/download files |
| `users.js` | 8 | Users, workers, invitations, out-of-office |
| `labels.js` | 8 | Task labels, project labels CRUD |
| `custom-fields.js` | 14 | Custom field types, values, enum options |
| `time-tracking.js` | 3 | Start/stop/edit time tracking |
| `work-reports.js` | 4 | Work reports CRUD |
| `invoices.js` | 5 | Invoices, reports, mark as invoiced |
| `notifications.js` | 3 | Notifications read/unread |
| `notes.js` | 4 | Notes CRUD |
| `events.js` | 1 | Calendar events |
| `filters.js` | 3 | Custom filters, tasks by filter |
| `pinned-items.js` | 3 | Pinned items CRUD |
| `states.js` | 1 | Task states |
| `search.js` | 1 | Elasticsearch full-text search |

Each tool follows the pattern:
```js
registerToolWithMetadata(server, 'tool_name', description, zodSchema, withErrorHandling('tool_name', async (args) => {
  const apiClient = getApiClient();
  const response = await apiClient.method('/endpoint', data);
  return formatResponse(response.data);
}), { outputSchema });
```

### Shared Utilities (`utils/`)
- `authHelper.js` — `getApiClient()` creates authenticated axios instance from env vars (eliminates auth boilerplate)
- `errorHandler.js` — `handleToolError()` + `withErrorHandling()` wrapper for standardized error handling
- `responseFormatter.js` — wraps API responses in MCP content format (arrays wrapped in `{ items: [...] }`)
- `schemas.js` — shared Zod schemas for input/output validation
- `toolAnnotations.js` — behavioral hints (readOnly, destructive, idempotent) for each tool
- `registerToolWithMetadata.js` — registers tools with annotations and output schemas

### REST API Server (`server.js`)
Express server with helmet, CORS, rate limiting. Routes are in `routes/`, business logic in `controllers/`. Exported for supertest-based testing.

### Testing
Tests use Jest (ESM mode with `NODE_OPTIONS=--experimental-vm-modules`) and `nock` to mock HTTP requests to `https://api.freelo.io/v1`. No real credentials needed.

- `tests/mcp-tools-simple.test.js` — 20 targeted tool tests
- `tests/mcp-tools.test.js` — 30 comprehensive tests including workflow scenarios
- `tests/test-helpers.js` — shared test utilities, nock setup, mock data

Uses `jest.unstable_mockModule` for ESM-compatible mocking of `@modelcontextprotocol/sdk`.

## Authentication

Set these environment variables (via `.env` file or shell):
```
FREELO_EMAIL=your@email.com
FREELO_API_KEY=your_api_key
FREELO_USER_AGENT=freelo-mcp
```

## Known Issues

- `get_all_tasks` with `projectId` filter returns tasks from all projects (Freelo API limitation)
- `upload_file` may fail (API expects Blob, not Base64)
- `create_subtask` returns incorrect `task_id` in response
- `get_subtasks` returns subtasks from entire project instead of filtering by `taskId`

## Module System

The project uses ESM (`"type": "module"` in package.json). All imports use `.js` extensions. Jest runs with `NODE_OPTIONS=--experimental-vm-modules`.
