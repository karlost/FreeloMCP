# Bug: Output Schema Validation Error

**Status:** 🔴 Critical
**Discovered:** 2025-11-21
**Affects:** All tools with `outputSchema` (98 tools)
**Version:** v2.3.0+

## Summary

Tools that define `outputSchema` fail with validation error:

```
"Output validation error: Tool get_projects has an output schema but no structured content was provided"
```

## Root Cause

**Problem:** Mismatch between `formatResponse()` output format and SDK's `outputSchema` expectations.

### Current Implementation

**tools/projects.js** (line 14-36):
```javascript
registerToolWithMetadata(
  server,
  'get_projects',
  'Description...',
  {},
  async () => {
    const response = await apiClient.get('/projects');
    return formatResponse(response.data);  // ❌ Returns text content
  },
  {
    outputSchema: createArrayResponseSchema(ProjectSchema)  // ✅ Expects structured data
  }
);
```

**utils/responseFormatter.js** (line 34-39):
```javascript
return {
  content: [
    { type: 'text', text: 'Found 10 items\n\n' },
    { type: 'text', text: '[{...}]' }  // ❌ JSON as string
  ]
};
```

### What SDK Expects

When a tool has `outputSchema`, the SDK expects:
1. **Structured content** (not text)
2. Data matching the schema definition
3. Proper content type annotations

## Impact

- ❌ All 98 tools fail when called via MCP protocol
- ✅ HTTP transport works perfectly (not transport issue)
- ✅ Session management works
- ✅ Tool listing works
- ❌ Tool execution fails

## Reproduction

### Via stdio:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_projects","arguments":{}}}' | node mcp-server.js
```

**Result:**
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "MCP error -32602: Output validation error: Tool get_projects has an output schema but no structured content was provided"
    }],
    "isError": true
  },
  "jsonrpc": "2.0",
  "id": 2
}
```

### Via HTTP:
```bash
curl -X POST http://localhost:3000/mcp/v1/endpoint \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: test-session" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_projects","arguments":{}}}'
```

**Same error.**

## Files Affected

### Core Files
- `utils/responseFormatter.js` - Returns wrong format
- `utils/registerToolWithMetadata.js` - Registers tools with outputSchema
- `utils/schemas.js` - Defines schemas

### All Tool Files
- `tools/projects.js` (14 tools)
- `tools/tasks.js` (48 tools)
- `tools/files.js` (6 tools)
- `tools/users.js` (4 tools)
- `tools/work-reports.js` (6 tools)
- `tools/custom-fields.js` (9 tools)
- `tools/invoices.js` (4 tools)
- `tools/notifications.js` (3 tools)
- `tools/notes.js` (4 tools)

**Total:** 98 tools

## Possible Solutions

### Option 1: Remove outputSchema (Quick Fix)
```javascript
registerToolWithMetadata(
  server,
  'get_projects',
  'Description...',
  {},
  async () => {
    return formatResponse(response.data);
  }
  // Remove outputSchema option
);
```

**Pros:**
- Quick fix
- Works immediately

**Cons:**
- Loses structured output benefits
- No type safety
- Clients can't parse response programmatically

### Option 2: Fix formatResponse (Proper Fix)
```javascript
const formatResponse = (data, hasOutputSchema = false) => {
  if (hasOutputSchema) {
    // Return structured data for tools with schema
    return {
      content: [
        {
          type: 'resource',
          resource: {
            uri: 'freelo://data',
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }
        }
      ]
    };
  }

  // Return text content for tools without schema
  return {
    content: [
      { type: 'text', text: `Found ${data.length} items\n\n` },
      { type: 'text', text: JSON.stringify(data, null, 2) }
    ]
  };
};
```

**Pros:**
- Maintains outputSchema benefits
- Backward compatible
- Type-safe

**Cons:**
- Requires testing all 98 tools
- More complex

### Option 3: Return Raw Data (Simplest)
```javascript
async () => {
  const response = await apiClient.get('/projects');
  return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
}
```

**Pros:**
- Simple
- Works with outputSchema

**Cons:**
- No formatting
- No summary

## Recommended Solution

**Option 2** - Fix `formatResponse()` to detect outputSchema and return appropriate format.

### Implementation Steps

1. **Modify registerToolWithMetadata.js:**
   - Pass `hasOutputSchema` flag to handler

2. **Update responseFormatter.js:**
   - Add `hasOutputSchema` parameter
   - Return structured content when true
   - Return text content when false

3. **Update all tool files:**
   - Pass flag from registerToolWithMetadata to formatResponse

4. **Test:**
   - Verify all 98 tools work
   - Check both stdio and HTTP transports
   - Validate schema compliance

## Testing Checklist

- [ ] Test get_projects (array response)
- [ ] Test get_project_details (object response)
- [ ] Test create_project (mutation)
- [ ] Test delete_project (deletion)
- [ ] Test tools without outputSchema
- [ ] Test via stdio transport
- [ ] Test via HTTP transport
- [ ] Verify test-http-transport.js passes 100%

## Related Issues

- GitHub Issue: (to be created)
- Version introducing bug: v2.3.0 (added outputSchema)
- Related PR: #(outputSchema implementation)

## Workaround for Users

**Temporary:** Use tools without outputSchema or downgrade to v2.2.1.

## Priority

**HIGH** - Blocks all tool functionality in production.

## Timeline

- **Discovery:** 2025-11-21 during HTTP transport testing
- **Analysis:** 2025-11-21 (this document)
- **Fix Target:** v2.4.1 or v2.5.0
- **Testing:** After fix implementation

## Notes

- HTTP transport implementation is **NOT affected** - works perfectly
- This is a **tool implementation bug**, not transport bug
- 83% of HTTP transport tests pass (only tool call fails due to this)
- Session management, initialization, tool listing all work correctly

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Author:** Claude Code Analysis
