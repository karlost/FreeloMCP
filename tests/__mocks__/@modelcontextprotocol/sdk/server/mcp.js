// tests/__mocks__/@modelcontextprotocol/sdk/server/mcp.js
import { jest } from '@jest/globals';

// Internal registry
const internalMockToolsRegistry = {};

export const McpServer = jest.fn().mockImplementation(() => {
  // Clear the registry for each new instance if needed, or keep it shared
  // Object.keys(mockToolsRegistry).forEach(key => delete mockToolsRegistry[key]);

  return {
    tool: (name, schema, handler) => {
      internalMockToolsRegistry[name] = { schema, handler };
    },
    getTools: () => internalMockToolsRegistry,
    // Add other necessary mocked methods if any
  };
});
// Export a function to get the registry
export const getMockToolsRegistry = () => internalMockToolsRegistry;

// Helper to clear the registry between tests if necessary
export const clearMockRegistry = () => {
  // Use the internal registry here
  Object.keys(internalMockToolsRegistry).forEach(key => delete internalMockToolsRegistry[key]);
};