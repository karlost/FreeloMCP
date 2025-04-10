/**
 * Subtasks API Tests
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

describe('Subtasks API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/task/:taskId/subtasks
  describe('GET /api/v1/task/:taskId/subtasks', () => {
    it('should return subtasks for a task', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          subtasks: [
            {
              id: 4789,
              task_id: 5874,
              name: 'Write PR article',
              date_add: '2017-05-12T15:22:51+02:00',
              due_date: '2017-05-13T20:00:00+02:00',
              due_date_end: null,
              count_comments: 1,
              count_subtasks: 1,
              author: {
                id: 2,
                fullname: 'Captain Freelo'
              },
              worker: {
                id: 134,
                fullname: 'John Davis'
              },
              state: {
                id: 1,
                state: 'active'
              },
              project: {
                id: 88,
                name: 'My Project',
                state: {
                  id: 1,
                  state: 'active'
                }
              },
              tasklist: {
                id: 65,
                name: 'My Tasklist',
                state: {
                  id: 1,
                  state: 'active'
                }
              },
              labels: [
                {
                  uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
                  name: 'In progress',
                  color: '#f2830b'
                }
              ]
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/task/123/subtasks')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/task/123/subtasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/task/999/subtasks')
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/task/999/subtasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });

  // Test POST /api/v1/task/:taskId/subtasks
  describe('POST /api/v1/task/:taskId/subtasks', () => {
    it('should create a subtask', async () => {
      // Request data
      const requestData = {
        name: 'Write PR article',
        due_date: '2016-08-10T08:00:00+0200',
        due_date_end: '2016-09-10T08:00:00+0200',
        worker: 5836,
        priority_enum: 'h',
        comment: {
          content: 'There are ...'
        },
        labels: [
          {
            uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
            name: 'In progress',
            color: '#f2830b'
          }
        ],
        tracking_users_ids: [875]
      };

      // Mock response data
      const mockResponse = {
        id: 4789,
        task_id: 2574,
        name: 'Write PR article',
        due_date: '2016-08-11T08:00:00+0200',
        due_date_end: '2016-09-11T08:00:00+0200',
        worker: {
          id: 1,
          fullname: 'John Davis'
        },
        priority_enum: 'h',
        labels: [
          {
            uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
            name: 'In progress',
            color: '#f2830b'
          }
        ],
        tracking_users: [
          {
            id: 875,
            fullname: 'John Doe'
          }
        ]
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task/123/subtasks', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/123/subtasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/task/123/subtasks', { /* missing required fields */ })
        .reply(400, { error: 'Validation failed', message: 'Name is required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/123/subtasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({});

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'Name is required' });
    });
  });
});
