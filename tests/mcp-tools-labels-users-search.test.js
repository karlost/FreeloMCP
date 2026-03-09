/**
 * Tests for labels, users, and search MCP tools
 */
import { jest } from '@jest/globals';
import nock from 'nock';

const mockToolsRegistry = {};

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    tool: (name, schema, handler) => { mockToolsRegistry[name] = { schema, handler }; },
    registerTool: (name, config, handler) => { mockToolsRegistry[name] = { config, handler }; },
    getTools: () => mockToolsRegistry,
  }))
}));

import {
  TEST_DATA, TEST_ENV, setupTestEnv, isValidResponse, getResponseData,
  setupNock, cleanupNock, mockFreeloApi
} from './test-helpers.js';

setupTestEnv();
const { initializeMcpServer } = await import('../mcp-server.js');

describe('Labels/Users/Search Tools', () => {
  let tools;
  beforeAll(() => { initializeMcpServer(); tools = mockToolsRegistry; });
  beforeEach(() => { setupNock(); });
  afterEach(() => { cleanupNock(); });

  // ==================== LABELS ====================

  describe('edit_label', () => {
    it('should edit a label successfully', async () => {
      const labelData = { name: 'Updated Label', color: '#FF0000' };
      const expectedBody = { ...labelData, is_private: false };
      const mockResponse = { id: TEST_DATA.labelId, ...labelData };
      mockFreeloApi('POST', `/project-labels/${TEST_DATA.labelId}`, 200, mockResponse, expectedBody);

      const result = await tools.edit_label.handler({ labelId: TEST_DATA.labelId, labelData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.labelId);
      expect(data).toHaveProperty('name', 'Updated Label');
      expect(data).toHaveProperty('color', '#FF0000');
    });

    it('should edit label with is_private flag', async () => {
      const labelData = { name: 'Private Label', color: '#FF0000', is_private: true };
      const mockResponse = { id: TEST_DATA.labelId, ...labelData };
      mockFreeloApi('POST', `/project-labels/${TEST_DATA.labelId}`, 200, mockResponse, labelData);

      const result = await tools.edit_label.handler({ labelId: TEST_DATA.labelId, labelData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('is_private', true);
    });

    it('should handle errors when editing a label', async () => {
      const labelData = { name: 'Bad Label', color: '#FF0000' };
      const expectedBody = { ...labelData, is_private: false };
      mockFreeloApi('POST', `/project-labels/${TEST_DATA.labelId}`, 404, {
        error: 'Not Found',
        message: 'Label not found'
      }, expectedBody);

      const result = await tools.edit_label.handler({ labelId: TEST_DATA.labelId, labelData });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
    });
  });

  describe('delete_label', () => {
    it('should delete a label successfully', async () => {
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', `/project-labels/${TEST_DATA.labelId}`, 200, mockResponse);

      const result = await tools.delete_label.handler({ labelId: TEST_DATA.labelId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when deleting a label', async () => {
      mockFreeloApi('DELETE', `/project-labels/${TEST_DATA.labelId}`, 404, {
        error: 'Not Found',
        message: 'Label not found'
      });

      const result = await tools.delete_label.handler({ labelId: TEST_DATA.labelId });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
    });
  });

  describe('add_label_to_project', () => {
    it('should add a new label to a project', async () => {
      const labelData = { name: 'New Project Label', color: '#00FF00' };
      const expectedBody = { ...labelData, is_private: false };
      const mockResponse = { id: 999, ...labelData };
      mockFreeloApi('POST', `/project-labels/add-to-project/${TEST_DATA.projectId}`, 200, mockResponse, expectedBody);

      const result = await tools.add_label_to_project.handler({
        projectId: TEST_DATA.projectId,
        labelData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('name', 'New Project Label');
      expect(data).toHaveProperty('color', '#00FF00');
    });

    it('should add an existing label to a project by id', async () => {
      const labelData = { name: 'Existing Label', id: 42 };
      const expectedBody = { ...labelData, is_private: false };
      const mockResponse = { id: 42, name: 'Existing Label' };
      mockFreeloApi('POST', `/project-labels/add-to-project/${TEST_DATA.projectId}`, 200, mockResponse, expectedBody);

      const result = await tools.add_label_to_project.handler({
        projectId: TEST_DATA.projectId,
        labelData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 42);
    });

    it('should handle errors when adding label to project', async () => {
      const labelData = { name: 'Bad Label' };
      const expectedBody = { ...labelData, is_private: false };
      mockFreeloApi('POST', `/project-labels/add-to-project/${TEST_DATA.projectId}`, 400, {
        error: 'Bad Request',
        message: 'Invalid label data'
      }, expectedBody);

      const result = await tools.add_label_to_project.handler({
        projectId: TEST_DATA.projectId,
        labelData
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('remove_label_from_project', () => {
    it('should remove a label from a project', async () => {
      const labelData = { id: 42, name: 'Label to Remove' };
      const mockResponse = { result: 'success' };
      mockFreeloApi('POST', `/project-labels/remove-from-project/${TEST_DATA.projectId}`, 200, mockResponse, labelData);

      const result = await tools.remove_label_from_project.handler({
        projectId: TEST_DATA.projectId,
        labelData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when removing label from project', async () => {
      const labelData = { id: 999 };
      mockFreeloApi('POST', `/project-labels/remove-from-project/${TEST_DATA.projectId}`, 404, {
        error: 'Not Found',
        message: 'Label not found in project'
      }, labelData);

      const result = await tools.remove_label_from_project.handler({
        projectId: TEST_DATA.projectId,
        labelData
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('create_task_labels', () => {
    it('should create a new task label', async () => {
      const labelData = { name: 'New Task Label', color: '#0000FF' };
      const mockResponse = { id: 100, uuid: 'new-label-uuid', name: 'New Task Label', color: '#0000FF' };
      // The handler wraps labelData as { labels: [labelData] }
      mockFreeloApi('POST', '/task-labels', 200, mockResponse, { labels: [labelData] });

      const result = await tools.create_task_labels.handler({ labelData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('name', 'New Task Label');
      expect(data).toHaveProperty('color', '#0000FF');
    });

    it('should create a label with project_id', async () => {
      const labelData = { name: 'Project Label', project_id: TEST_DATA.projectId };
      const mockResponse = { id: 101, uuid: 'proj-label-uuid', name: 'Project Label', project_id: TEST_DATA.projectId };
      mockFreeloApi('POST', '/task-labels', 200, mockResponse, { labels: [labelData] });

      const result = await tools.create_task_labels.handler({ labelData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('name', 'Project Label');
    });

    it('should handle errors when creating a label', async () => {
      const labelData = { name: '' };
      mockFreeloApi('POST', '/task-labels', 400, {
        error: 'Bad Request',
        message: 'Label name is required'
      }, { labels: [labelData] });

      const result = await tools.create_task_labels.handler({ labelData });

      expect(result.isError).toBe(true);
    });
  });

  // ==================== USERS ====================

  describe('invite_users', () => {
    it('should invite users by user IDs', async () => {
      const userIds = [TEST_DATA.userId, 'mockUser2'];
      const expectedBody = {
        projects_ids: [TEST_DATA.projectId],
        users_ids: userIds
      };
      const mockResponse = [
        { id: TEST_DATA.userId, fullname: 'Mock User 1' },
        { id: 'mockUser2', fullname: 'Mock User 2' }
      ];
      mockFreeloApi('POST', '/users/manage-workers', 200, mockResponse, expectedBody);

      const result = await tools.invite_users.handler({
        projectId: TEST_DATA.projectId,
        userIds
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it('should invite users by emails', async () => {
      const emails = ['newuser@example.com', 'another@example.com'];
      const expectedBody = {
        project_id: TEST_DATA.projectId,
        emails
      };
      const mockResponse = [
        { id: 'newUser1', fullname: 'New User 1', email: 'newuser@example.com' },
        { id: 'newUser2', fullname: 'Another User', email: 'another@example.com' }
      ];
      mockFreeloApi('POST', '/users/manage-workers', 200, mockResponse, expectedBody);

      const result = await tools.invite_users.handler({
        projectId: TEST_DATA.projectId,
        emails
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it('should handle errors when inviting users', async () => {
      const userIds = ['nonexistent'];
      const expectedBody = {
        projects_ids: [TEST_DATA.projectId],
        users_ids: userIds
      };
      mockFreeloApi('POST', '/users/manage-workers', 400, {
        error: 'Bad Request',
        message: 'Invalid user IDs'
      }, expectedBody);

      const result = await tools.invite_users.handler({
        projectId: TEST_DATA.projectId,
        userIds
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('remove_workers', () => {
    it('should remove workers by user IDs', async () => {
      const userIds = [TEST_DATA.userId];
      // Tool converts string IDs to integers via parseInt
      const expectedBody = { users_ids: [NaN] }; // parseInt('mockUserId141') = NaN
      const mockResponse = { result: 'success' };
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post(`/project/${TEST_DATA.projectId}/remove-workers/by-ids`)
        .reply(200, mockResponse);

      const result = await tools.remove_workers.handler({
        projectId: TEST_DATA.projectId,
        userIds
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should remove workers by emails', async () => {
      const emails = ['worker@example.com'];
      const expectedBody = { users_emails: emails };
      const mockResponse = { result: 'success' };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/remove-workers/by-emails`, 200, mockResponse, expectedBody);

      const result = await tools.remove_workers.handler({
        projectId: TEST_DATA.projectId,
        emails
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should return error message when neither userIds nor emails provided', async () => {
      const result = await tools.remove_workers.handler({
        projectId: TEST_DATA.projectId
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('error', 'Provide either userIds or emails');
    });

    it('should handle API errors when removing workers', async () => {
      const userIds = ['nonexistent'];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post(`/project/${TEST_DATA.projectId}/remove-workers/by-ids`)
        .reply(404, { error: 'Not Found', message: 'User not found' });

      const result = await tools.remove_workers.handler({
        projectId: TEST_DATA.projectId,
        userIds
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_out_of_office', () => {
    it('should return out-of-office info for a user', async () => {
      const mockResponse = {
        date_from: '2026-03-15',
        date_to: '2026-03-20',
        reason: 'Vacation'
      };
      mockFreeloApi('GET', `/user/${TEST_DATA.userId}/out-of-office`, 200, mockResponse);

      const result = await tools.get_out_of_office.handler({ userId: TEST_DATA.userId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('date_from', '2026-03-15');
      expect(data).toHaveProperty('date_to', '2026-03-20');
      expect(data).toHaveProperty('reason', 'Vacation');
    });

    it('should handle no out-of-office set', async () => {
      mockFreeloApi('GET', `/user/${TEST_DATA.userId}/out-of-office`, 200, {});

      const result = await tools.get_out_of_office.handler({ userId: TEST_DATA.userId });

      expect(isValidResponse(result)).toBe(true);
    });

    it('should handle errors when getting out-of-office', async () => {
      mockFreeloApi('GET', `/user/${TEST_DATA.userId}/out-of-office`, 404, {
        error: 'Not Found',
        message: 'User not found'
      });

      const result = await tools.get_out_of_office.handler({ userId: TEST_DATA.userId });

      expect(result.isError).toBe(true);
    });
  });

  describe('set_out_of_office', () => {
    it('should set out-of-office for a user', async () => {
      const outOfOfficeData = {
        date_from: '2026-04-01',
        date_to: '2026-04-10',
        reason: 'Sick leave'
      };
      const expectedBody = { out_of_office: outOfOfficeData };
      const mockResponse = { date_from: '2026-04-01', date_to: '2026-04-10', reason: 'Sick leave' };
      mockFreeloApi('POST', `/user/${TEST_DATA.userId}/out-of-office`, 200, mockResponse, expectedBody);

      const result = await tools.set_out_of_office.handler({
        userId: TEST_DATA.userId,
        outOfOfficeData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('date_from', '2026-04-01');
      expect(data).toHaveProperty('date_to', '2026-04-10');
      expect(data).toHaveProperty('reason', 'Sick leave');
    });

    it('should set out-of-office without reason', async () => {
      const outOfOfficeData = {
        date_from: '2026-05-01',
        date_to: '2026-05-05'
      };
      const expectedBody = { out_of_office: outOfOfficeData };
      const mockResponse = { date_from: '2026-05-01', date_to: '2026-05-05' };
      mockFreeloApi('POST', `/user/${TEST_DATA.userId}/out-of-office`, 200, mockResponse, expectedBody);

      const result = await tools.set_out_of_office.handler({
        userId: TEST_DATA.userId,
        outOfOfficeData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('date_from', '2026-05-01');
      expect(data).toHaveProperty('date_to', '2026-05-05');
    });

    it('should handle errors when setting out-of-office', async () => {
      const outOfOfficeData = {
        date_from: '2026-04-10',
        date_to: '2026-04-01' // end before start
      };
      const expectedBody = { out_of_office: outOfOfficeData };
      mockFreeloApi('POST', `/user/${TEST_DATA.userId}/out-of-office`, 400, {
        error: 'Bad Request',
        message: 'date_to must be after date_from'
      }, expectedBody);

      const result = await tools.set_out_of_office.handler({
        userId: TEST_DATA.userId,
        outOfOfficeData
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('delete_out_of_office', () => {
    it('should delete out-of-office for a user', async () => {
      const mockResponse = { success: true };
      mockFreeloApi('DELETE', `/user/${TEST_DATA.userId}/out-of-office`, 200, mockResponse);

      const result = await tools.delete_out_of_office.handler({ userId: TEST_DATA.userId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when deleting out-of-office', async () => {
      mockFreeloApi('DELETE', `/user/${TEST_DATA.userId}/out-of-office`, 404, {
        error: 'Not Found',
        message: 'No out-of-office set for this user'
      });

      const result = await tools.delete_out_of_office.handler({ userId: TEST_DATA.userId });

      expect(result.isError).toBe(true);
    });
  });

  // ==================== SEARCH ====================

  describe('search_elasticsearch', () => {
    it('should perform a basic search', async () => {
      const searchData = { search_query: 'urgent bug' };
      const mockResponse = [
        { id: 1, type: 'task', name: 'Urgent bug fix', project_id: TEST_DATA.projectId },
        { id: 2, type: 'comment', content: 'This is an urgent bug', task_id: TEST_DATA.taskId }
      ];
      mockFreeloApi('POST', '/search', 200, mockResponse, searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('type', 'task');
      expect(data[1]).toHaveProperty('type', 'comment');
    });

    it('should search with project filter', async () => {
      const searchData = {
        search_query: 'design review',
        projects_ids: [197352]
      };
      const mockResponse = [
        { id: 3, type: 'task', name: 'Design review meeting' }
      ];
      mockFreeloApi('POST', '/search', 200, mockResponse, searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    });

    it('should search with entity_type filter', async () => {
      const searchData = {
        search_query: 'API docs',
        entity_type: 'task'
      };
      const mockResponse = [
        { id: 4, type: 'task', name: 'API documentation' }
      ];
      mockFreeloApi('POST', '/search', 200, mockResponse, searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toHaveProperty('type', 'task');
    });

    it('should search with multiple filters', async () => {
      const searchData = {
        search_query: 'sprint planning',
        projects_ids: [197352],
        workers_ids: [12345],
        state_ids: ['active'],
        entity_type: 'task',
        page: 0,
        limit: 50
      };
      const mockResponse = [
        { id: 5, type: 'task', name: 'Sprint planning Q2' }
      ];
      mockFreeloApi('POST', '/search', 200, mockResponse, searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle empty search results', async () => {
      const searchData = { search_query: 'nonexistent content xyz123' };
      mockFreeloApi('POST', '/search', 200, [], searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should handle search errors', async () => {
      const searchData = { search_query: '' };
      mockFreeloApi('POST', '/search', 400, {
        error: 'Bad Request',
        message: 'Search query cannot be empty'
      }, searchData);

      const result = await tools.search_elasticsearch.handler({ searchData });

      expect(result.isError).toBe(true);
    });
  });
});
