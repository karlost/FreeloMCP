/**
 * Tests for comment MCP tools (inline file attachments, #12)
 */
import { jest } from '@jest/globals';

const mockToolsRegistry = {};

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    tool: (name, schema, handler) => { mockToolsRegistry[name] = { schema, handler }; },
    registerTool: (name, config, handler) => { mockToolsRegistry[name] = { config, handler }; },
    getTools: () => mockToolsRegistry,
  }))
}));

import {
  setupTestEnv, isValidResponse, getResponseData,
  setupNock, cleanupNock, mockFreeloApi
} from './test-helpers.js';

setupTestEnv();
const { initializeMcpServer } = await import('../mcp-server.js');

const UUID = 'c3117783-970b-4f7d-888c-f8a43932f566';

describe('Comments Tools', () => {
  let tools;
  beforeAll(() => { initializeMcpServer(); tools = mockToolsRegistry; });
  beforeEach(() => { setupNock(); });
  afterEach(() => { cleanupNock(); });

  describe('create_comment', () => {
    it('should send plain content when no files are given', async () => {
      const expectedBody = { content: '<div>Hello</div>' };
      mockFreeloApi('POST', '/task/123/comments', 200, { id: 1, ...expectedBody }, expectedBody);

      const result = await tools.create_comment.handler({ taskId: '123', commentData: { content: '<div>Hello</div>' } });

      expect(isValidResponse(result)).toBe(true);
      expect(getResponseData(result)).toHaveProperty('id', 1);
    });

    it('should embed a UUID string inline instead of using the files array', async () => {
      const expectedBody = { content: `<div>Report</div><a data-freelo-uuid="${UUID}">${UUID}</a>` };
      mockFreeloApi('POST', '/task/123/comments', 200, { id: 1, ...expectedBody }, expectedBody);

      const result = await tools.create_comment.handler({
        taskId: '123',
        commentData: { content: '<div>Report</div>', fileUuids: [UUID] }
      });

      expect(isValidResponse(result)).toBe(true);
    });

    it('should use the given name as the attachment label and escape it', async () => {
      const expectedBody = {
        content: `<div>Report</div><a data-freelo-uuid="${UUID}">Q3 &lt;draft&gt; &amp; notes.pdf</a>`
      };
      mockFreeloApi('POST', '/task/123/comments', 200, { id: 1, ...expectedBody }, expectedBody);

      const result = await tools.create_comment.handler({
        taskId: '123',
        commentData: { content: '<div>Report</div>', fileUuids: [{ uuid: UUID, name: 'Q3 <draft> & notes.pdf' }] }
      });

      expect(isValidResponse(result)).toBe(true);
    });
  });

  describe('edit_comment', () => {
    it('should send content as-is so existing inline attachments are kept', async () => {
      const content = `<div>Edited</div><a data-freelo-file='{"uuid":"${UUID}"}'>report.pdf</a>`;
      const expectedBody = { content };
      mockFreeloApi('POST', '/comment/456', 200, { id: 456, content }, expectedBody);

      const result = await tools.edit_comment.handler({ commentId: '456', commentData: { content } });

      expect(isValidResponse(result)).toBe(true);
      expect(getResponseData(result)).toHaveProperty('content', content);
    });

    it('should append new files inline', async () => {
      const expectedBody = { content: `<div>Edited</div><a data-freelo-uuid="${UUID}">report.pdf</a>` };
      mockFreeloApi('POST', '/comment/456', 200, { id: 456, ...expectedBody }, expectedBody);

      const result = await tools.edit_comment.handler({
        commentId: '456',
        commentData: { content: '<div>Edited</div>', fileUuids: [{ uuid: UUID, name: 'report.pdf' }] }
      });

      expect(isValidResponse(result)).toBe(true);
    });
  });
});
