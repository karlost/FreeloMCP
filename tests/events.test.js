/**
 * Events API Tests
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

describe('Events API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/events
  describe('GET /api/v1/events', () => {
    it('should get all events', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          events: [
            {
              id: 69,
              date_action: '2021-05-26T04:59:20+00:00',
              type: 'task_finished',
              author: {
                id: 2,
                fullname: 'Captain Freelo'
              },
              task: {
                id: 1,
                name: 'Task name'
              },
              tasklist: {
                id: 426,
                name: 'Marketing'
              },
              project: {
                id: 69,
                name: 'Project name'
              }
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/events')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered events', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          events: [
            {
              id: 69,
              date_action: '2021-05-26T04:59:20+00:00',
              type: 'task_finished',
              author: {
                id: 2,
                fullname: 'Captain Freelo'
              },
              task: {
                id: 1,
                name: 'Task name'
              },
              tasklist: {
                id: 426,
                name: 'Marketing'
              },
              project: {
                id: 69,
                name: 'Project name'
              }
            }
          ]
        }
      };

      // Setup mock API response with query parameters
      nock(API_BASE_URL)
        .get('/events')
        .query({
          'projects_ids[]': '69',
          'users_ids[]': '2',
          'events_types[]': 'task_finished',
          order: 'desc',
          'date_range[date_from]': '2021-01-01',
          'date_range[date_to]': '2021-12-31',
          'tasks_ids[]': '1'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/events')
        .query({
          'projects_ids[]': '69',
          'users_ids[]': '2',
          'events_types[]': 'task_finished',
          order: 'desc',
          'date_range[date_from]': '2021-01-01',
          'date_range[date_to]': '2021-12-31',
          'tasks_ids[]': '1'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle invalid parameters error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/events')
        .query({
          'date_range[date_from]': 'invalid-date'
        })
        .reply(400, { error: 'Invalid date format' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/events')
        .query({
          'date_range[date_from]': 'invalid-date'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid date format' });
    });
  });
});
