/**
 * Work Reports API Tests
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

describe('Work Reports API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/work-reports
  describe('GET /api/v1/work-reports', () => {
    it('should get all work reports', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          reports: [
            {
              id: 5476,
              date_add: '2018-08-08T11:34:57+02:00',
              date_reported: '2018-08-08T11:34:57+02:00',
              date_edited_at: '2018-08-09T12:14:00+02:00',
              note: null,
              minutes: 60,
              cost: {
                amount: '0',
                currency: 'CZK'
              },
              task: {
                id: 26518,
                name: 'task name',
                minutes: 60,
                parent_task_id: 24510,
                cost: {
                  amount: '400',
                  currency: 'CZK'
                },
                labels: [
                  {
                    uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
                    name: 'Work in progress',
                    color: '#77787a'
                  }
                ],
                total_time_estimate: {
                  minutes: 60
                },
                users_time_estimates: [
                  {
                    minutes: 30,
                    user: {
                      id: 136,
                      fullname: 'Karel Borkovec'
                    }
                  }
                ]
              },
              tasklist: {
                id: 6271,
                name: 'Marketing'
              },
              project: {
                id: 5137,
                name: 'Project name',
                labels: [
                  'devs'
                ]
              },
              author: {
                id: 136,
                fullname: 'Karel Borkovec'
              },
              worker: {
                id: 136,
                fullname: 'Karel Borkovec'
              }
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/work-reports')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/work-reports')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered work reports', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          reports: [
            {
              id: 5476,
              date_add: '2018-08-08T11:34:57+02:00',
              date_reported: '2018-08-08T11:34:57+02:00',
              date_edited_at: '2018-08-09T12:14:00+02:00',
              note: null,
              minutes: 60,
              cost: {
                amount: '0',
                currency: 'CZK'
              },
              task: {
                id: 26518,
                name: 'task name',
                minutes: 60,
                parent_task_id: 24510,
                cost: {
                  amount: '400',
                  currency: 'CZK'
                },
                labels: []
              },
              tasklist: {
                id: 6271,
                name: 'Marketing'
              },
              project: {
                id: 5137,
                name: 'Project name',
                labels: []
              },
              author: {
                id: 136,
                fullname: 'Karel Borkovec'
              },
              worker: {
                id: 136,
                fullname: 'Karel Borkovec'
              }
            }
          ]
        }
      };

      // Setup mock API response with query parameters
      nock(API_BASE_URL)
        .get('/work-reports')
        .query({
          'projects_ids[]': '5137',
          'users_ids[]': '136',
          'date_reported_range[date_from]': '2018-08-01',
          'date_reported_range[date_to]': '2018-08-31'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/work-reports')
        .query({
          'projects_ids[]': '5137',
          'users_ids[]': '136',
          'date_reported_range[date_from]': '2018-08-01',
          'date_reported_range[date_to]': '2018-08-31'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
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
