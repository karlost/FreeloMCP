/**
 * Tests for projects/tasks/tasklists MCP tools (remaining untested)
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

describe('Projects/Tasks/Tasklists Tools', () => {
  let tools;
  beforeAll(() => { initializeMcpServer(); tools = mockToolsRegistry; });
  beforeEach(() => { setupNock(); });
  afterEach(() => { cleanupNock(); });

  // =====================
  // PROJECT TOOLS
  // =====================

  describe('get_archived_projects', () => {
    it('should return archived projects', async () => {
      const mockProjects = [
        { id: 'arch1', name: 'Archived Project 1' },
        { id: 'arch2', name: 'Archived Project 2' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/archived-projects')
        .query(true)
        .reply(200, mockProjects);

      const result = await tools.get_archived_projects.handler({});
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'arch1');
      expect(data[0]).toHaveProperty('name', 'Archived Project 1');
    });

    it('should support pagination', async () => {
      const mockProjects = [{ id: 'arch3', name: 'Archived Page 2' }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/archived-projects')
        .query({ p: 1 })
        .reply(200, mockProjects);

      const result = await tools.get_archived_projects.handler({ page: 1 });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id', 'arch3');
    });
  });

  describe('get_invited_projects', () => {
    it('should return invited projects', async () => {
      const mockProjects = [
        { id: 'inv1', name: 'Invited Project 1' },
        { id: 'inv2', name: 'Invited Project 2' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/invited-projects')
        .query(true)
        .reply(200, mockProjects);

      const result = await tools.get_invited_projects.handler({});
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'inv1');
      expect(data[0]).toHaveProperty('name', 'Invited Project 1');
    });

    it('should support pagination', async () => {
      const mockProjects = [{ id: 'inv3', name: 'Invited Page 2' }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/invited-projects')
        .query({ p: 2 })
        .reply(200, mockProjects);

      const result = await tools.get_invited_projects.handler({ page: 2 });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data[0]).toHaveProperty('id', 'inv3');
    });
  });

  describe('get_template_projects', () => {
    it('should return template projects', async () => {
      const mockTemplates = [
        { id: 'tmpl1', name: 'Template Project 1' },
        { id: 'tmpl2', name: 'Template Project 2' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/template-projects')
        .query(true)
        .reply(200, mockTemplates);

      const result = await tools.get_template_projects.handler({});
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'tmpl1');
      expect(data[0]).toHaveProperty('name', 'Template Project 1');
    });

    it('should support filters', async () => {
      const mockTemplates = [{ id: 'tmpl3', name: 'Filtered Template' }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/template-projects')
        .query(true)
        .reply(200, mockTemplates);

      const result = await tools.get_template_projects.handler({
        filters: { order_by: 'name', order: 'asc' }
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data[0]).toHaveProperty('id', 'tmpl3');
    });
  });

  describe('get_user_projects', () => {
    it('should return projects for a specific user', async () => {
      const mockProjects = [
        { id: 'uproj1', name: 'User Project 1' },
        { id: 'uproj2', name: 'User Project 2' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get(`/user/${TEST_DATA.userId}/all-projects`)
        .query(true)
        .reply(200, mockProjects);

      const result = await tools.get_user_projects.handler({ userId: TEST_DATA.userId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'uproj1');
    });

    it('should support filters and pagination', async () => {
      const mockProjects = [{ id: 'uproj3', name: 'Filtered User Project' }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get(`/user/${TEST_DATA.userId}/all-projects`)
        .query(true)
        .reply(200, mockProjects);

      const result = await tools.get_user_projects.handler({
        userId: TEST_DATA.userId,
        filters: { states_ids: [1, 4], order_by: 'name', order: 'desc', page: 0 }
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data[0]).toHaveProperty('id', 'uproj3');
    });
  });

  describe('get_project_manager_of', () => {
    it('should return projects where user is PM', async () => {
      const mockProjects = [
        { id: 'pm1', name: 'PM Project 1' },
        { id: 'pm2', name: 'PM Project 2' }
      ];
      mockFreeloApi('GET', '/users/project-manager-of', 200, mockProjects);

      const result = await tools.get_project_manager_of.handler({});
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'pm1');
      expect(data[0]).toHaveProperty('name', 'PM Project 1');
    });
  });

  describe('create_project_from_template', () => {
    it('should create a project from template', async () => {
      const templateId = 'tmpl123';
      const projectData = { name: 'New From Template', currency_iso: 'CZK' };
      const mockResponse = { id: 'newproj1', name: 'New From Template', currency_iso: 'CZK' };

      mockFreeloApi('POST', `/project/create-from-template/${templateId}`, 200, mockResponse, projectData);

      const result = await tools.create_project_from_template.handler({
        templateId,
        projectData
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 'newproj1');
      expect(data).toHaveProperty('name', 'New From Template');
    });

    it('should create a project from template without currency', async () => {
      const templateId = 'tmpl456';
      const projectData = { name: 'Template No Currency' };
      const mockResponse = { id: 'newproj2', name: 'Template No Currency' };

      mockFreeloApi('POST', `/project/create-from-template/${templateId}`, 200, mockResponse, projectData);

      const result = await tools.create_project_from_template.handler({
        templateId,
        projectData
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 'newproj2');
    });
  });

  // =====================
  // TASK TOOLS
  // =====================

  describe('get_finished_tasks', () => {
    it('should return finished tasks from a tasklist', async () => {
      const mockTasks = [
        { id: 'ft1', name: 'Finished Task 1', state_id: 2 },
        { id: 'ft2', name: 'Finished Task 2', state_id: 2 }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get(`/tasklist/${TEST_DATA.tasklistId}/finished-tasks`)
        .query(true)
        .reply(200, mockTasks);

      const result = await tools.get_finished_tasks.handler({ tasklistId: TEST_DATA.tasklistId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'ft1');
      expect(data[0]).toHaveProperty('state_id', 2);
    });

    it('should support search_query filter', async () => {
      const mockTasks = [{ id: 'ft3', name: 'Bug Fix Done', state_id: 2 }];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get(`/tasklist/${TEST_DATA.tasklistId}/finished-tasks`)
        .query({ search_query: 'bug' })
        .reply(200, mockTasks);

      const result = await tools.get_finished_tasks.handler({
        tasklistId: TEST_DATA.tasklistId,
        search_query: 'bug'
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data[0]).toHaveProperty('name', 'Bug Fix Done');
    });
  });

  describe('get_task_description', () => {
    it('should return task description', async () => {
      const mockDescription = { content: 'This is a detailed task description with **markdown**.' };
      mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/description`, 200, mockDescription);

      const result = await tools.get_task_description.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('content');
    });
  });

  describe('update_task_description', () => {
    it('should update task description', async () => {
      const newDescription = 'Updated description with new requirements.';
      const mockResponse = { content: newDescription };

      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/description`, 200, mockResponse, { content: newDescription });

      const result = await tools.update_task_description.handler({
        taskId: TEST_DATA.taskId,
        description: newDescription
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('content', newDescription);
    });

    it('should clear description with empty string', async () => {
      const mockResponse = { content: '' };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/description`, 200, mockResponse, { content: '' });

      const result = await tools.update_task_description.handler({
        taskId: TEST_DATA.taskId,
        description: ''
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('content', '');
    });
  });

  describe('get_public_link', () => {
    it('should return public link for a task', async () => {
      const mockLink = { url: 'https://app.freelo.io/public/task/abc123' };
      mockFreeloApi('GET', `/public-link/task/${TEST_DATA.taskId}`, 200, mockLink);

      const result = await tools.get_public_link.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('url');
      expect(data.url).toContain('https://');
    });
  });

  describe('delete_public_link', () => {
    it('should delete public link for a task', async () => {
      const mockResponse = { success: true };
      mockFreeloApi('DELETE', `/public-link/task/${TEST_DATA.taskId}`, 200, mockResponse);

      const result = await tools.delete_public_link.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });
  });

  describe('create_task_reminder', () => {
    it('should create a task reminder', async () => {
      const reminderData = { date: '2026-04-15T14:00:00Z' };
      const mockResponse = { id: TEST_DATA.taskId, reminder: { remind_at: '2026-04-15T14:00:00Z' } };

      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/reminder`, 200, mockResponse, {
        remind_at: '2026-04-15T14:00:00Z'
      });

      const result = await tools.create_task_reminder.handler({
        taskId: TEST_DATA.taskId,
        reminderData
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
    });

    it('should create a reminder with specific user_ids', async () => {
      const reminderData = { date: '2026-05-01T09:00:00Z', user_ids: ['111', '222'] };
      const mockResponse = { id: TEST_DATA.taskId, reminder: { remind_at: '2026-05-01T09:00:00Z' } };

      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/reminder`, 200, mockResponse, {
        remind_at: '2026-05-01T09:00:00Z',
        user_ids: ['111', '222']
      });

      const result = await tools.create_task_reminder.handler({
        taskId: TEST_DATA.taskId,
        reminderData
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
    });
  });

  describe('delete_task_reminder', () => {
    it('should delete a task reminder', async () => {
      const mockResponse = { id: TEST_DATA.taskId, name: 'Task Without Reminder' };
      mockFreeloApi('DELETE', `/task/${TEST_DATA.taskId}/reminder`, 200, mockResponse);

      const result = await tools.delete_task_reminder.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
    });
  });

  describe('delete_total_time_estimate', () => {
    it('should delete total time estimate', async () => {
      const mockResponse = { id: TEST_DATA.taskId, name: 'Task No Estimate' };
      mockFreeloApi('DELETE', `/task/${TEST_DATA.taskId}/total-time-estimate`, 200, mockResponse);

      const result = await tools.delete_total_time_estimate.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
    });
  });

  describe('delete_user_time_estimate', () => {
    it('should delete user time estimate', async () => {
      const mockResponse = { id: TEST_DATA.taskId, name: 'Task' };
      mockFreeloApi('DELETE', `/task/${TEST_DATA.taskId}/users-time-estimates/${TEST_DATA.userId}`, 200, mockResponse);

      const result = await tools.delete_user_time_estimate.handler({
        taskId: TEST_DATA.taskId,
        userId: TEST_DATA.userId
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
    });
  });

  describe('create_task_from_template', () => {
    it('should create a task from template', async () => {
      const templateId = '99001';
      const projectId = '88001';
      const tasklistId = '77001';
      const mockResponse = { id: 'newTask1', name: 'Task From Template', tasklist_id: tasklistId };

      mockFreeloApi('POST', `/task/create-from-template/${templateId}`, 200, mockResponse, {
        task_id: 99001,
        target_project_id: 88001,
        target_tasklist_id: 77001
      });

      const result = await tools.create_task_from_template.handler({
        templateId,
        projectId,
        tasklistId
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 'newTask1');
      expect(data).toHaveProperty('name', 'Task From Template');
    });
  });

  // =====================
  // TASKLIST TOOLS
  // =====================

  describe('get_assignable_workers', () => {
    it('should return assignable workers for a tasklist', async () => {
      const mockWorkers = [
        { id: 'w1', fullname: 'Worker One', email: 'w1@test.com' },
        { id: 'w2', fullname: 'Worker Two', email: 'w2@test.com' }
      ];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/tasklist/${TEST_DATA.tasklistId}/assignable-workers`, 200, mockWorkers);

      const result = await tools.get_assignable_workers.handler({
        projectId: TEST_DATA.projectId,
        tasklistId: TEST_DATA.tasklistId
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'w1');
      expect(data[0]).toHaveProperty('fullname', 'Worker One');
      expect(data[1]).toHaveProperty('email', 'w2@test.com');
    });
  });

  describe('create_tasklist_from_template', () => {
    it('should create a tasklist from template', async () => {
      const templateId = '55001';
      const projectId = '66001';
      const mockResponse = { id: 'newTl1', name: 'Tasklist From Template', project_id: projectId };

      mockFreeloApi('POST', `/tasklist/create-from-template/${templateId}`, 200, mockResponse, {
        tasklist_id: 55001,
        target_project_id: 66001
      });

      const result = await tools.create_tasklist_from_template.handler({
        templateId,
        projectId
      });
      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 'newTl1');
      expect(data).toHaveProperty('name', 'Tasklist From Template');
      expect(data).toHaveProperty('project_id', projectId);
    });
  });
});
