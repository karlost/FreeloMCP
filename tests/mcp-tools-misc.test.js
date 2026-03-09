/**
 * Tests for notes, notifications, events, filters, pinned items, and states MCP tools
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

describe('Notes/Notifications/Events/Filters/PinnedItems/States Tools', () => {
  let tools;

  beforeAll(() => {
    initializeMcpServer();
    tools = mockToolsRegistry;
  });

  beforeEach(() => {
    setupNock();
  });

  afterEach(() => {
    cleanupNock();
  });

  // =====================
  // NOTES
  // =====================

  describe('create_note', () => {
    it('should create a note successfully', async () => {
      const noteData = { name: 'Meeting Minutes', content: 'Discussed project roadmap.' };
      const mockResponse = { id: 1001, ...noteData, project_id: TEST_DATA.projectId };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/note`, 200, mockResponse, noteData);

      const result = await tools.create_note.handler({ projectId: TEST_DATA.projectId, noteData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 1001);
      expect(data).toHaveProperty('name', 'Meeting Minutes');
      expect(data).toHaveProperty('content', 'Discussed project roadmap.');
    });

    it('should handle errors when creating a note', async () => {
      const noteData = { name: 'Bad Note', content: '' };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/note`, 400, {
        error: 'Bad Request',
        message: 'Content cannot be empty'
      }, noteData);

      const result = await tools.create_note.handler({ projectId: TEST_DATA.projectId, noteData });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  describe('get_note', () => {
    it('should return a note successfully', async () => {
      const mockNote = { id: 1001, name: 'API Documentation', content: 'Full API docs here.' };
      mockFreeloApi('GET', '/note/1001', 200, mockNote);

      const result = await tools.get_note.handler({ noteId: '1001' });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 1001);
      expect(data).toHaveProperty('name', 'API Documentation');
      expect(data).toHaveProperty('content', 'Full API docs here.');
    });

    it('should handle not found error', async () => {
      mockFreeloApi('GET', '/note/9999', 404, {
        error: 'Not Found',
        message: 'Note not found'
      });

      const result = await tools.get_note.handler({ noteId: '9999' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
    });
  });

  describe('update_note', () => {
    it('should update a note successfully', async () => {
      const noteData = { name: 'Updated Title', content: 'Updated content.' };
      const mockResponse = { id: 1001, ...noteData };
      mockFreeloApi('POST', '/note/1001', 200, mockResponse, noteData);

      const result = await tools.update_note.handler({ noteId: '1001', noteData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 1001);
      expect(data).toHaveProperty('name', 'Updated Title');
      expect(data).toHaveProperty('content', 'Updated content.');
    });

    it('should update only the name field', async () => {
      const noteData = { name: 'Only Name Changed' };
      const mockResponse = { id: 1001, name: 'Only Name Changed', content: 'Original content.' };
      mockFreeloApi('POST', '/note/1001', 200, mockResponse, noteData);

      const result = await tools.update_note.handler({ noteId: '1001', noteData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('name', 'Only Name Changed');
    });
  });

  describe('delete_note', () => {
    it('should delete a note successfully', async () => {
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', '/note/1001', 200, mockResponse);

      const result = await tools.delete_note.handler({ noteId: '1001' });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle not found error on delete', async () => {
      mockFreeloApi('DELETE', '/note/9999', 404, {
        error: 'Not Found',
        message: 'Note not found'
      });

      const result = await tools.delete_note.handler({ noteId: '9999' });

      expect(result.isError).toBe(true);
    });
  });

  // =====================
  // NOTIFICATIONS
  // =====================

  describe('get_all_notifications', () => {
    it('should return notifications successfully', async () => {
      const mockNotifications = [
        { id: 2001, type: 'mention', read: false, message: 'You were mentioned' },
        { id: 2002, type: 'assignment', read: true, message: 'Task assigned to you' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/all-notifications')
        .query(true)
        .reply(200, mockNotifications);

      const result = await tools.get_all_notifications.handler({ filters: { page: 1, limit: 20 } });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 2001);
      expect(data[0]).toHaveProperty('type', 'mention');
    });

    it('should return notifications without filters', async () => {
      const mockNotifications = [{ id: 2003, type: 'comment', read: false }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/all-notifications')
        .query(true)
        .reply(200, mockNotifications);

      const result = await tools.get_all_notifications.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    });
  });

  describe('mark_notification_read', () => {
    it('should mark a notification as read', async () => {
      const mockResponse = { id: 2001, read: true };
      mockFreeloApi('POST', '/notification/2001/mark-as-read', 200, mockResponse);

      const result = await tools.mark_notification_read.handler({ notificationId: '2001' });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 2001);
      expect(data).toHaveProperty('read', true);
    });

    it('should handle not found error', async () => {
      mockFreeloApi('POST', '/notification/9999/mark-as-read', 404, {
        error: 'Not Found',
        message: 'Notification not found'
      });

      const result = await tools.mark_notification_read.handler({ notificationId: '9999' });

      expect(result.isError).toBe(true);
    });
  });

  describe('mark_notification_unread', () => {
    it('should mark a notification as unread', async () => {
      const mockResponse = { id: 2001, read: false };
      mockFreeloApi('POST', '/notification/2001/mark-as-unread', 200, mockResponse);

      const result = await tools.mark_notification_unread.handler({ notificationId: '2001' });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 2001);
      expect(data).toHaveProperty('read', false);
    });

    it('should handle not found error', async () => {
      mockFreeloApi('POST', '/notification/9999/mark-as-unread', 404, {
        error: 'Not Found',
        message: 'Notification not found'
      });

      const result = await tools.mark_notification_unread.handler({ notificationId: '9999' });

      expect(result.isError).toBe(true);
    });
  });

  // =====================
  // EVENTS
  // =====================

  describe('get_events', () => {
    it('should return events successfully', async () => {
      const mockEvents = [
        { id: 3001, type: 'task_created', date: '2025-10-01T10:00:00Z' },
        { id: 3002, type: 'comment_added', date: '2025-10-02T14:30:00Z' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/events')
        .query(true)
        .reply(200, mockEvents);

      const result = await tools.get_events.handler({
        filters: {
          projects_ids: [197352],
          events_types: ['task_created', 'comment_added'],
          order: 'desc',
          p: 0
        }
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 3001);
      expect(data[0]).toHaveProperty('type', 'task_created');
    });

    it('should return events without filters', async () => {
      const mockEvents = [{ id: 3003, type: 'task_finished', date: '2025-10-03T09:00:00Z' }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/events')
        .query(true)
        .reply(200, mockEvents);

      const result = await tools.get_events.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    });

    it('should support date range filtering', async () => {
      const mockEvents = [
        { id: 3004, type: 'task_assigned', date: '2025-10-15T12:00:00Z' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/events')
        .query(true)
        .reply(200, mockEvents);

      const result = await tools.get_events.handler({
        filters: {
          date_range: { date_from: '2025-10-01', date_to: '2025-10-31' }
        }
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toHaveProperty('type', 'task_assigned');
    });
  });

  // =====================
  // FILTERS
  // =====================

  describe('get_custom_filters', () => {
    it('should return custom filters successfully', async () => {
      const mockFilters = [
        { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'My High Priority Tasks' },
        { uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Overdue Items' }
      ];
      mockFreeloApi('GET', '/dashboard/custom-filters', 200, mockFilters);

      const result = await tools.get_custom_filters.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('uuid', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(data[0]).toHaveProperty('name', 'My High Priority Tasks');
    });

    it('should return empty array when no filters exist', async () => {
      mockFreeloApi('GET', '/dashboard/custom-filters', 200, []);

      const result = await tools.get_custom_filters.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('get_tasks_by_filter_uuid', () => {
    it('should return tasks by filter UUID successfully', async () => {
      const filterUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockTasks = [
        { id: 4001, name: 'Filtered Task 1' },
        { id: 4002, name: 'Filtered Task 2' }
      ];
      mockFreeloApi('GET', `/dashboard/custom-filter/by-uuid/${filterUuid}/tasks`, 200, mockTasks);

      const result = await tools.get_tasks_by_filter_uuid.handler({ uuid: filterUuid });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 4001);
      expect(data[0]).toHaveProperty('name', 'Filtered Task 1');
    });

    it('should handle not found error for invalid UUID', async () => {
      const filterUuid = 'invalid-uuid';
      mockFreeloApi('GET', `/dashboard/custom-filter/by-uuid/${filterUuid}/tasks`, 404, {
        error: 'Not Found',
        message: 'Filter not found'
      });

      const result = await tools.get_tasks_by_filter_uuid.handler({ uuid: filterUuid });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_tasks_by_filter_name', () => {
    it('should return tasks by filter name successfully', async () => {
      const filterName = 'My High Priority Tasks';
      const mockTasks = [
        { id: 4003, name: 'Priority Task 1' },
        { id: 4004, name: 'Priority Task 2' }
      ];
      // The tool uses encodeURIComponent on the name
      mockFreeloApi('GET', `/dashboard/custom-filter/by-name/${encodeURIComponent(filterName)}/tasks`, 200, mockTasks);

      const result = await tools.get_tasks_by_filter_name.handler({ name: filterName });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 4003);
      expect(data[0]).toHaveProperty('name', 'Priority Task 1');
    });

    it('should handle not found error for unknown filter name', async () => {
      const filterName = 'Nonexistent Filter';
      mockFreeloApi('GET', `/dashboard/custom-filter/by-name/${encodeURIComponent(filterName)}/tasks`, 404, {
        error: 'Not Found',
        message: 'Filter not found'
      });

      const result = await tools.get_tasks_by_filter_name.handler({ name: filterName });

      expect(result.isError).toBe(true);
    });
  });

  // =====================
  // PINNED ITEMS
  // =====================

  describe('get_pinned_items', () => {
    it('should return pinned items successfully', async () => {
      const mockPinnedItems = [
        { id: 5001, type: 'task', item_id: '100' },
        { id: 5002, type: 'note', item_id: '200' }
      ];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/pinned-items`, 200, mockPinnedItems);

      const result = await tools.get_pinned_items.handler({ projectId: TEST_DATA.projectId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 5001);
      expect(data[0]).toHaveProperty('type', 'task');
    });

    it('should return empty array when no pinned items exist', async () => {
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/pinned-items`, 200, []);

      const result = await tools.get_pinned_items.handler({ projectId: TEST_DATA.projectId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('pin_item', () => {
    it('should pin a task item successfully', async () => {
      const itemData = { type: 'task', item_id: '12345' };
      // The tool adds link: '#' when link is not provided
      const expectedBody = { type: 'task', item_id: '12345', link: '#' };
      const mockResponse = { success: true };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/pinned-items`, 200, mockResponse, expectedBody);

      const result = await tools.pin_item.handler({ projectId: TEST_DATA.projectId, itemData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should pin an item with custom link', async () => {
      const itemData = { type: 'note', item_id: '67890', link: 'https://example.com/docs' };
      const mockResponse = { success: true };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/pinned-items`, 200, mockResponse, itemData);

      const result = await tools.pin_item.handler({ projectId: TEST_DATA.projectId, itemData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when pinning an item', async () => {
      const itemData = { type: 'task', item_id: '99999' };
      const expectedBody = { type: 'task', item_id: '99999', link: '#' };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/pinned-items`, 404, {
        error: 'Not Found',
        message: 'Item not found'
      }, expectedBody);

      const result = await tools.pin_item.handler({ projectId: TEST_DATA.projectId, itemData });

      expect(result.isError).toBe(true);
    });
  });

  describe('delete_pinned_item', () => {
    it('should delete a pinned item successfully', async () => {
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', '/pinned-item/5001', 200, mockResponse);

      const result = await tools.delete_pinned_item.handler({ pinnedItemId: '5001' });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle not found error on delete', async () => {
      mockFreeloApi('DELETE', '/pinned-item/9999', 404, {
        error: 'Not Found',
        message: 'Pinned item not found'
      });

      const result = await tools.delete_pinned_item.handler({ pinnedItemId: '9999' });

      expect(result.isError).toBe(true);
    });
  });

  // =====================
  // STATES
  // =====================

  describe('get_all_states', () => {
    it('should return all states successfully', async () => {
      const mockStates = [
        { id: 1, name: 'Active' },
        { id: 2, name: 'Finished' },
        { id: 3, name: 'Archived' }
      ];
      mockFreeloApi('GET', '/states', 200, mockStates);

      const result = await tools.get_all_states.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
      expect(data[0]).toHaveProperty('id', 1);
      expect(data[0]).toHaveProperty('name', 'Active');
      expect(data[1]).toHaveProperty('id', 2);
      expect(data[1]).toHaveProperty('name', 'Finished');
      expect(data[2]).toHaveProperty('id', 3);
      expect(data[2]).toHaveProperty('name', 'Archived');
    });
  });
});
