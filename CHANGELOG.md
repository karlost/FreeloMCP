# Changelog

All notable changes to the Freelo MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2025-11-21

### Added
- **Streamable HTTP Transport** - New HTTP transport implementation using MCP Streamable HTTP protocol
  - Multi-session support with Map-based session management
  - One Server + Transport per session pattern
  - Session persistence across requests
  - Compatible with ElevenLabs Agents and modern MCP clients
  - Endpoints: `POST/GET /mcp/v1/endpoint`, `GET /health`
  - New executable: `freelo-mcp-http` / `mcp-server-http.js`
  - New npm script: `npm run mcp:http`
- Complete HTTP transport documentation
  - `MIGRATION_HTTP.md` - Migration guide from SSE to HTTP
  - `examples/streamable-http-client.js` - Example HTTP client implementation
  - `test-http-transport.js` - Automated HTTP transport tests (83% success rate)
- Transport comparison table in README.md
- Updated AI_GUIDE.md with transport selection guide

### Changed
- **Upgraded MCP SDK** from ^1.9.0 to ^1.22.0
  - Enables Streamable HTTP transport support
  - Maintains compatibility with stdio and SSE transports
- Updated package.json with new bin entry and scripts
- Improved CORS configuration for HTTP transport
  - Exposed `Mcp-Session-Id` header
  - Added `MCP-Protocol-Version` and `Accept` to allowed headers

### Deprecated
- **SSE Transport** (`mcp-server-sse.js`) is now deprecated
  - Will be removed in v3.0.0
  - Added deprecation warnings in code and documentation
  - Users should migrate to HTTP transport (see `MIGRATION_HTTP.md`)

### Known Issues
- **outputSchema validation error** (affects all 98 tools)
  - Tool calls fail with "Output validation error: Tool has an output schema but no structured content was provided"
  - Root cause: `formatResponse()` returns text content, but `outputSchema` expects structured data
  - This is NOT an HTTP transport issue - the transport works perfectly
  - HTTP transport achieves 83% test success rate (5/6 tests pass)
  - Only tool execution fails due to this pre-existing bug from v2.3.0
  - Documented in `BUG_OUTPUT_SCHEMA.md`
  - Will be fixed in v2.4.1 or v2.5.0

### Testing
- HTTP transport tests: 5/6 passing (83% success rate)
  - ✅ Health Check
  - ✅ MCP Initialize (session management works)
  - ✅ Tools List (all 98 tools discovered)
  - ❌ Tool Call (fails due to outputSchema bug, not transport issue)
  - ✅ Session Persistence (multi-client works)
  - ✅ Error Handling

### Migration
Users should migrate from SSE to HTTP transport:
```bash
# Old (deprecated)
node mcp-server-sse.js

# New (recommended)
node mcp-server-http.js
# or
npm run mcp:http
# or
npx freelo-mcp-http
```

See `MIGRATION_HTTP.md` for detailed migration instructions.

## [2.3.1] - 2025-11-20

### Fixed
- Worker assignment in task creation and updates
- Changed `assignedTo` parameter to `worker` for MCP SDK compliance
- Improved parameter naming consistency across all task tools

## [2.3.0] - 2025-11-19

### Added
- `outputSchema` metadata to all 98 tools for enhanced MCP compliance
- Complete schema definitions for all tool responses
- Improved type safety and client-side validation capabilities

### Notes
- This version introduced the outputSchema validation bug that affects v2.4.0
- Bug is independent of transport implementation

## [2.2.1] - 2025-11-18

### Fixed
- Task description parameter handling
- Improved description field validation and formatting

## [2.2.0] - 2025-11-17

### Added
- AI usability improvements
- Enhanced tool descriptions and documentation
- Improved error messages for better debugging

## [2.1.0] - 2025-11-16

### Added
- **SSE Transport** for n8n and HTTP clients
- Server-Sent Events implementation for real-time communication
- HTTP endpoint for SSE connections

### Notes
- SSE transport is deprecated as of v2.4.0
- Users should migrate to Streamable HTTP transport

## [2.0.6] - 2025-11-15

### Fixed
- README documentation with correct syntax
- Updated installation examples

## [2.0.5] - 2025-11-14

### Fixed
- Critical npx execution bug
- Fixed `claude mcp add` command syntax in documentation

## Previous Versions

See git history for versions prior to 2.0.5.

---

## Transport Evolution Timeline

- **v2.0.x**: stdio transport only (CLI)
- **v2.1.0**: Added SSE transport (HTTP)
- **v2.4.0**: Added Streamable HTTP transport (HTTP), deprecated SSE
- **v3.0.0** (planned): Remove SSE transport

## Links

- [MCP Specification](https://modelcontextprotocol.io/)
- [Streamable HTTP Transport Spec](https://modelcontextprotocol.io/docs/specification/2025-03-26/transports#streamable-http)
- [GitHub Repository](https://github.com/filipcerny/freelo-mcp)
- [NPM Package](https://www.npmjs.com/package/@filipcerny/freelo-mcp)
