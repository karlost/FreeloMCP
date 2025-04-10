/**
 * Time Tracking API Tests
 */

const request = require('supertest');
const app = require('../server');
const nock = require('nock');

// Mock API base URL
const API_BASE_URL = 'https://api.freelo.io/v1';

// Test authentication credentials
const testAuth = {
  email: 'test@example.com',
  apiKey: 'test-api-key',
  userAgent: 'Test-Agent'
};

// Base64 encoded auth string
const authString = Buffer.from(`${testAuth.email}:${testAuth.apiKey}`).toString('base64');

describe('Time Tracking API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test POST /api/v1/timetracking/start
  describe('POST /api/v1/timetracking/start', () => {
    it('should start time tracking', async () => {
      // Mock response data
      const mockResponse = {
        uuid: '39bb2869-4e84-4e85-a11f-555567d0939c'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/timetracking/start')
        .query({ task_id: '123', note: 'Working on task' })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/start')
        .query({ task_id: '123', note: 'Working on task' })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle error when starting time tracking', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/timetracking/start')
        .query({ task_id: '999' })
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/start')
        .query({ task_id: '999' })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });

  // Test POST /api/v1/timetracking/stop
  describe('POST /api/v1/timetracking/stop', () => {
    it('should stop time tracking', async () => {
      // Mock response data
      const mockResponse = {
        id: 1677,
        date_add: '2016-09-05T09:16:32+01:00',
        date_reported: '2016-08-30',
        note: 'Note…',
        minutes: 60,
        cost: {
          amount: '20000',
          currency: 'CZK'
        },
        author: {
          id: 2,
          fullname: 'Robert Miles'
        },
        worker: {
          id: 1,
          fullname: 'John Davis'
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/timetracking/stop')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/stop')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle error when no time tracking is active', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/timetracking/stop')
        .reply(400, { error: 'No active time tracking' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/stop')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No active time tracking' });
    });
  });

  // Test POST /api/v1/timetracking/edit
  describe('POST /api/v1/timetracking/edit', () => {
    it('should edit time tracking', async () => {
      // Mock response data
      const mockResponse = {
        uuid: '39bb2869-4e84-4e85-a11f-555567d0939c'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/timetracking/edit')
        .query({ task_id: '123', note: 'Updated note' })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/edit')
        .query({ task_id: '123', note: 'Updated note' })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle error when no time tracking is active', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/timetracking/edit')
        .query({ task_id: '123' })
        .reply(400, { error: 'No active time tracking' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/timetracking/edit')
        .query({ task_id: '123' })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No active time tracking' });
    });
  });

  // Test POST /api/v1/task/:taskId/work-reports
  describe('POST /api/v1/task/:taskId/work-reports', () => {
    it('should create a work report for a task', async () => {
      // Request data
      const requestData = {
        date_reported: '2016-08-30',
        worker_id: 1,
        minutes: 60,
        cost: '20000',
        note: 'Note…'
      };

      // Mock response data
      const mockResponse = {
        id: 1677,
        date_add: '2016-09-05T09:16:32+01:00',
        date_reported: '2016-08-30',
        note: 'Note…',
        minutes: 60,
        cost: {
          amount: '20000',
          currency: 'CZK'
        },
        author: {
          id: 2,
          fullname: 'Robert Miles'
        },
        worker: {
          id: 1,
          fullname: 'John Davis'
        },
        task: {
          id: 51,
          name: 'Task name'
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task/123/work-reports', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/123/work-reports')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle task not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/task/999/work-reports', { minutes: 60, cost: '20000' })
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/999/work-reports')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ minutes: 60, cost: '20000' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });

  // Test POST /api/v1/work-reports/:workReportId
  describe('POST /api/v1/work-reports/:workReportId', () => {
    it('should update a work report', async () => {
      // Request data
      const requestData = {
        minutes: 60,
        cost: '20000',
        date_reported: '2016-08-30',
        note: 'Updated note',
        task_id: 51
      };

      // Mock response data
      const mockResponse = {
        id: 1677,
        date_add: '2016-09-05T09:16:32+01:00',
        date_reported: '2016-08-30',
        note: 'Updated note',
        minutes: 60,
        cost: {
          amount: '20000',
          currency: 'CZK'
        },
        author: {
          id: 2,
          fullname: 'Robert Miles'
        },
        worker: {
          id: 1,
          fullname: 'John Davis'
        },
        task: {
          id: 51,
          name: 'Task name'
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/work-reports/456', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/work-reports/456')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle work report not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/work-reports/999', { minutes: 60 })
        .reply(404, { error: 'Work report not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/work-reports/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ minutes: 60 });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Work report not found' });
    });
  });

  // Test DELETE /api/v1/work-reports/:workReportId
  describe('DELETE /api/v1/work-reports/:workReportId', () => {
    it('should delete a work report', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .delete('/work-reports/456')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/work-reports/456')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle work report not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .delete('/work-reports/999')
        .reply(404, { error: 'Work report not found' });

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/work-reports/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Work report not found' });
    });
  });
});
