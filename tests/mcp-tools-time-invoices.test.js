/**
 * Tests for time tracking, work reports, and invoices MCP tools
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

describe('Time Tracking/Work Reports/Invoices Tools', () => {
  let tools;

  beforeAll(() => {
    initializeMcpServer();
    tools = mockToolsRegistry;
  });

  beforeEach(() => { setupNock(); });
  afterEach(() => { cleanupNock(); });

  // =============================================
  // Time Tracking Tools
  // =============================================

  describe('start_time_tracking', () => {
    it('should start time tracking for a task', async () => {
      const mockResponse = {
        id: 1001,
        task_id: TEST_DATA.taskId,
        started_at: '2026-03-09T10:00:00Z',
        status: 'running'
      };
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post('/timetracking/start')
        .reply(200, mockResponse);

      const result = await tools.start_time_tracking.handler({ taskId: TEST_DATA.taskId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 1001);
      expect(data).toHaveProperty('task_id', TEST_DATA.taskId);
    });

    it('should start general time tracking without taskId', async () => {
      const mockResponse = {
        id: 1002,
        started_at: '2026-03-09T10:00:00Z',
        status: 'running'
      };
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post('/timetracking/start', {})
        .reply(200, mockResponse);

      const result = await tools.start_time_tracking.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 1002);
    });

    it('should handle errors when starting time tracking', async () => {
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post('/timetracking/start')
        .reply(409, { error: 'Conflict', message: 'Timer already running' });

      const result = await tools.start_time_tracking.handler({ taskId: TEST_DATA.taskId });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
    });
  });

  describe('stop_time_tracking', () => {
    it('should stop the active time tracking session', async () => {
      const mockResponse = {
        id: 2001,
        task_id: TEST_DATA.taskId,
        minutes: 45,
        date: '2026-03-09',
        description: 'Work session'
      };
      mockFreeloApi('POST', '/timetracking/stop', 200, mockResponse);

      const result = await tools.stop_time_tracking.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 2001);
      expect(data).toHaveProperty('minutes', 45);
    });

    it('should handle errors when no timer is running', async () => {
      mockFreeloApi('POST', '/timetracking/stop', 404, {
        error: 'Not Found',
        message: 'No active time tracking session'
      });

      const result = await tools.stop_time_tracking.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
    });
  });

  describe('edit_time_tracking', () => {
    it('should edit the active time tracking session', async () => {
      const trackingData = {
        task_id: TEST_DATA.taskId,
        description: 'Updated work description'
      };
      const mockResponse = {
        id: 3001,
        task_id: TEST_DATA.taskId,
        description: 'Updated work description',
        status: 'running'
      };
      mockFreeloApi('POST', '/timetracking/edit', 200, mockResponse, trackingData);

      const result = await tools.edit_time_tracking.handler({ trackingData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 3001);
      expect(data).toHaveProperty('description', 'Updated work description');
      expect(data).toHaveProperty('task_id', TEST_DATA.taskId);
    });

    it('should edit only description without changing task', async () => {
      const trackingData = {
        description: 'Just updating the description'
      };
      const mockResponse = {
        id: 3002,
        description: 'Just updating the description',
        status: 'running'
      };
      mockFreeloApi('POST', '/timetracking/edit', 200, mockResponse, trackingData);

      const result = await tools.edit_time_tracking.handler({ trackingData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('description', 'Just updating the description');
    });

    it('should handle errors when no timer is active', async () => {
      const trackingData = { description: 'Update' };
      mockFreeloApi('POST', '/timetracking/edit', 404, {
        error: 'Not Found',
        message: 'No active time tracking session'
      }, trackingData);

      const result = await tools.edit_time_tracking.handler({ trackingData });

      expect(result.isError).toBe(true);
    });
  });

  // =============================================
  // Work Reports Tools
  // =============================================

  describe('get_work_reports', () => {
    it('should return work reports without filters', async () => {
      const mockReports = [
        { id: 4001, task_id: TEST_DATA.taskId, minutes: 120, date: '2026-03-09', description: 'Feature work' },
        { id: 4002, task_id: TEST_DATA.taskId, minutes: 60, date: '2026-03-08', description: 'Bug fix' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/work-reports')
        .query(true)
        .reply(200, mockReports);

      const result = await tools.get_work_reports.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 4001);
      expect(data[0]).toHaveProperty('minutes', 120);
    });

    it('should return work reports with filters', async () => {
      const filters = {
        projects_ids: [TEST_DATA.projectId],
        users_ids: [TEST_DATA.userId],
        date_reported_range: {
          date_from: '2026-03-01',
          date_to: '2026-03-31'
        }
      };
      const mockReports = [
        { id: 4003, task_id: TEST_DATA.taskId, minutes: 90, date: '2026-03-05', description: 'Filtered report' }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/work-reports')
        .query(true)
        .reply(200, mockReports);

      const result = await tools.get_work_reports.handler({ filters });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toHaveProperty('id', 4003);
    });

    it('should return empty array when no reports match', async () => {
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/work-reports')
        .query(true)
        .reply(200, []);

      const result = await tools.get_work_reports.handler({ filters: {} });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('create_work_report', () => {
    it('should create a work report successfully', async () => {
      const reportData = {
        minutes: 120,
        date: '2026-03-09',
        description: 'Implemented new feature'
      };
      const mockResponse = {
        id: 5001,
        task_id: TEST_DATA.taskId,
        ...reportData
      };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/work-reports`, 200, mockResponse, reportData);

      const result = await tools.create_work_report.handler({
        taskId: TEST_DATA.taskId,
        reportData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 5001);
      expect(data).toHaveProperty('task_id', TEST_DATA.taskId);
      expect(data).toHaveProperty('minutes', 120);
      expect(data).toHaveProperty('date', '2026-03-09');
      expect(data).toHaveProperty('description', 'Implemented new feature');
    });

    it('should create a work report without description', async () => {
      const reportData = {
        minutes: 30,
        date: '2026-03-09'
      };
      const mockResponse = {
        id: 5002,
        task_id: TEST_DATA.taskId,
        ...reportData
      };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/work-reports`, 200, mockResponse, reportData);

      const result = await tools.create_work_report.handler({
        taskId: TEST_DATA.taskId,
        reportData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 5002);
      expect(data).toHaveProperty('minutes', 30);
    });

    it('should handle errors when creating a work report', async () => {
      const reportData = {
        minutes: 120,
        date: '2026-03-09'
      };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/work-reports`, 400, {
        error: 'Bad Request',
        message: 'Invalid task ID'
      }, reportData);

      const result = await tools.create_work_report.handler({
        taskId: TEST_DATA.taskId,
        reportData
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('update_work_report', () => {
    const workReportId = '5001';

    it('should update a work report successfully', async () => {
      const reportData = {
        minutes: 150,
        description: 'Updated description'
      };
      const mockResponse = {
        id: Number(workReportId),
        task_id: TEST_DATA.taskId,
        minutes: 150,
        date: '2026-03-09',
        description: 'Updated description'
      };
      mockFreeloApi('POST', `/work-reports/${workReportId}`, 200, mockResponse, reportData);

      const result = await tools.update_work_report.handler({
        workReportId,
        reportData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', Number(workReportId));
      expect(data).toHaveProperty('minutes', 150);
      expect(data).toHaveProperty('description', 'Updated description');
    });

    it('should update only the date of a work report', async () => {
      const reportData = {
        date: '2026-03-08'
      };
      const mockResponse = {
        id: Number(workReportId),
        task_id: TEST_DATA.taskId,
        minutes: 120,
        date: '2026-03-08',
        description: 'Original description'
      };
      mockFreeloApi('POST', `/work-reports/${workReportId}`, 200, mockResponse, reportData);

      const result = await tools.update_work_report.handler({
        workReportId,
        reportData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('date', '2026-03-08');
    });

    it('should handle errors when updating a non-existent work report', async () => {
      const reportData = { minutes: 60 };
      mockFreeloApi('POST', '/work-reports/99999', 404, {
        error: 'Not Found',
        message: 'Work report not found'
      }, reportData);

      const result = await tools.update_work_report.handler({
        workReportId: '99999',
        reportData
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('delete_work_report', () => {
    const workReportId = '5001';

    it('should delete a work report successfully', async () => {
      const mockResponse = { status: 'success' };
      mockFreeloApi('DELETE', `/work-reports/${workReportId}`, 200, mockResponse);

      const result = await tools.delete_work_report.handler({ workReportId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('status', 'success');
    });

    it('should handle errors when deleting a non-existent work report', async () => {
      mockFreeloApi('DELETE', '/work-reports/99999', 404, {
        error: 'Not Found',
        message: 'Work report not found'
      });

      const result = await tools.delete_work_report.handler({ workReportId: '99999' });

      expect(result.isError).toBe(true);
    });
  });

  // =============================================
  // Invoices Tools
  // =============================================

  describe('get_issued_invoices', () => {
    it('should return invoices without filters', async () => {
      const mockInvoices = [
        { id: 6001, number: 'INV-2026-001', amount: 15000 },
        { id: 6002, number: 'INV-2026-002', amount: 22000 }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/issued-invoices')
        .query(true)
        .reply(200, mockInvoices);

      const result = await tools.get_issued_invoices.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 6001);
      expect(data[0]).toHaveProperty('number', 'INV-2026-001');
      expect(data[0]).toHaveProperty('amount', 15000);
    });

    it('should return invoices with filters', async () => {
      const filters = {
        project_id: TEST_DATA.projectId,
        date_from: '2026-01-01',
        date_to: '2026-03-31'
      };
      const mockInvoices = [
        { id: 6003, number: 'INV-2026-003', amount: 8500 }
      ];
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/issued-invoices')
        .query(true)
        .reply(200, mockInvoices);

      const result = await tools.get_issued_invoices.handler({ filters });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toHaveProperty('id', 6003);
    });

    it('should return empty array when no invoices match', async () => {
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/issued-invoices')
        .query(true)
        .reply(200, []);

      const result = await tools.get_issued_invoices.handler({ filters: {} });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('get_invoice_detail', () => {
    const invoiceId = '6001';

    it('should return invoice details', async () => {
      const mockInvoice = {
        id: 6001,
        number: 'INV-2026-001',
        amount: 15000,
        status: 'draft',
        line_items: [
          { description: 'Development work', hours: 10, rate: 1500 }
        ]
      };
      mockFreeloApi('GET', `/issued-invoice/${invoiceId}`, 200, mockInvoice);

      const result = await tools.get_invoice_detail.handler({ invoiceId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 6001);
      expect(data).toHaveProperty('number', 'INV-2026-001');
      expect(data).toHaveProperty('amount', 15000);
      expect(data).toHaveProperty('line_items');
      expect(data.line_items.length).toBe(1);
    });

    it('should handle errors for non-existent invoice', async () => {
      mockFreeloApi('GET', '/issued-invoice/99999', 404, {
        error: 'Not Found',
        message: 'Invoice not found'
      });

      const result = await tools.get_invoice_detail.handler({ invoiceId: '99999' });

      expect(result.isError).toBe(true);
    });
  });

  describe('download_invoice_reports', () => {
    const invoiceId = '6001';

    it('should download invoice reports', async () => {
      const mockResponse = {
        url: 'https://api.freelo.io/v1/download/invoice-report-6001.csv'
      };
      mockFreeloApi('GET', `/issued-invoice/${invoiceId}/reports`, 200, mockResponse);

      const result = await tools.download_invoice_reports.handler({ invoiceId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('url');
    });

    it('should handle errors for non-existent invoice', async () => {
      mockFreeloApi('GET', '/issued-invoice/99999/reports', 404, {
        error: 'Not Found',
        message: 'Invoice not found'
      });

      const result = await tools.download_invoice_reports.handler({ invoiceId: '99999' });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_invoice_reports_json', () => {
    const invoiceId = '6001';

    it('should return invoice reports as JSON', async () => {
      const mockReports = [
        {
          work_report_id: 5001,
          project: { id: 100, name: 'Project Alpha' },
          tasklist: { id: 200, name: 'Development' },
          minutes: 120,
          date: '2026-03-05'
        },
        {
          work_report_id: 5002,
          project: { id: 100, name: 'Project Alpha' },
          tasklist: { id: 201, name: 'Testing' },
          minutes: 60,
          date: '2026-03-06'
        }
      ];
      mockFreeloApi('GET', `/issued-invoice/${invoiceId}/reports-json`, 200, mockReports);

      const result = await tools.get_invoice_reports_json.handler({ invoiceId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('work_report_id', 5001);
      expect(data[0]).toHaveProperty('project');
      expect(data[0].project).toHaveProperty('name', 'Project Alpha');
      expect(data[0]).toHaveProperty('tasklist');
    });

    it('should handle empty reports', async () => {
      mockFreeloApi('GET', `/issued-invoice/${invoiceId}/reports-json`, 200, []);

      const result = await tools.get_invoice_reports_json.handler({ invoiceId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should handle errors for non-existent invoice', async () => {
      mockFreeloApi('GET', '/issued-invoice/99999/reports-json', 404, {
        error: 'Not Found',
        message: 'Invoice not found'
      });

      const result = await tools.get_invoice_reports_json.handler({ invoiceId: '99999' });

      expect(result.isError).toBe(true);
    });
  });

  describe('mark_as_invoiced', () => {
    const invoiceId = '6001';

    it('should mark an invoice as invoiced', async () => {
      const mockResponse = { success: true };
      mockFreeloApi('POST', `/issued-invoice/${invoiceId}/mark-as-invoiced`, 200, mockResponse);

      const result = await tools.mark_as_invoiced.handler({ invoiceId });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when marking non-existent invoice', async () => {
      mockFreeloApi('POST', '/issued-invoice/99999/mark-as-invoiced', 404, {
        error: 'Not Found',
        message: 'Invoice not found'
      });

      const result = await tools.mark_as_invoiced.handler({ invoiceId: '99999' });

      expect(result.isError).toBe(true);
    });

    it('should handle errors when invoice is already marked', async () => {
      mockFreeloApi('POST', `/issued-invoice/${invoiceId}/mark-as-invoiced`, 409, {
        error: 'Conflict',
        message: 'Invoice already marked as invoiced'
      });

      const result = await tools.mark_as_invoiced.handler({ invoiceId });

      expect(result.isError).toBe(true);
    });
  });

  // =============================================
  // Integration / Workflow Tests
  // =============================================

  describe('time tracking workflow', () => {
    it('should handle start, edit, and stop time tracking', async () => {
      // Start tracking
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .post('/timetracking/start')
        .reply(200, { id: 7001, task_id: TEST_DATA.taskId, status: 'running' });

      const startResult = await tools.start_time_tracking.handler({ taskId: TEST_DATA.taskId });
      expect(isValidResponse(startResult)).toBe(true);
      const startData = getResponseData(startResult);
      expect(startData).toHaveProperty('status', 'running');

      // Edit tracking
      const editData = { description: 'Working on feature X' };
      mockFreeloApi('POST', '/timetracking/edit', 200, {
        id: 7001,
        task_id: TEST_DATA.taskId,
        description: 'Working on feature X',
        status: 'running'
      }, editData);

      const editResult = await tools.edit_time_tracking.handler({ trackingData: editData });
      expect(isValidResponse(editResult)).toBe(true);
      const editResultData = getResponseData(editResult);
      expect(editResultData).toHaveProperty('description', 'Working on feature X');

      // Stop tracking
      mockFreeloApi('POST', '/timetracking/stop', 200, {
        id: 8001,
        task_id: TEST_DATA.taskId,
        minutes: 30,
        date: '2026-03-09',
        description: 'Working on feature X'
      });

      const stopResult = await tools.stop_time_tracking.handler({});
      expect(isValidResponse(stopResult)).toBe(true);
      const stopData = getResponseData(stopResult);
      expect(stopData).toHaveProperty('minutes', 30);
    });
  });

  describe('work report CRUD workflow', () => {
    it('should create, read, update, and delete a work report', async () => {
      // Create
      const createData = { minutes: 120, date: '2026-03-09', description: 'Initial work' };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/work-reports`, 200, {
        id: 9001, task_id: TEST_DATA.taskId, ...createData
      }, createData);

      const createResult = await tools.create_work_report.handler({
        taskId: TEST_DATA.taskId,
        reportData: createData
      });
      expect(isValidResponse(createResult)).toBe(true);
      const created = getResponseData(createResult);
      expect(created).toHaveProperty('id', 9001);

      // Read (via get_work_reports)
      nock(TEST_ENV.FREELO_API_BASE_URL)
        .get('/work-reports')
        .query(true)
        .reply(200, [{ id: 9001, task_id: TEST_DATA.taskId, minutes: 120, date: '2026-03-09', description: 'Initial work' }]);

      const readResult = await tools.get_work_reports.handler({});
      expect(isValidResponse(readResult)).toBe(true);
      const readData = getResponseData(readResult);
      expect(readData.length).toBe(1);
      expect(readData[0]).toHaveProperty('id', 9001);

      // Update
      const updateData = { minutes: 150, description: 'Updated work' };
      mockFreeloApi('POST', '/work-reports/9001', 200, {
        id: 9001, task_id: TEST_DATA.taskId, minutes: 150, date: '2026-03-09', description: 'Updated work'
      }, updateData);

      const updateResult = await tools.update_work_report.handler({
        workReportId: '9001',
        reportData: updateData
      });
      expect(isValidResponse(updateResult)).toBe(true);
      const updated = getResponseData(updateResult);
      expect(updated).toHaveProperty('minutes', 150);
      expect(updated).toHaveProperty('description', 'Updated work');

      // Delete
      mockFreeloApi('DELETE', '/work-reports/9001', 200, { status: 'success' });

      const deleteResult = await tools.delete_work_report.handler({ workReportId: '9001' });
      expect(isValidResponse(deleteResult)).toBe(true);
      const deleted = getResponseData(deleteResult);
      expect(deleted).toHaveProperty('status', 'success');
    });
  });
});
