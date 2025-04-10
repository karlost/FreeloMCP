/**
 * Task Labels API Tests
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

describe('Task Labels API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test POST /api/v1/task-labels
  describe('POST /api/v1/task-labels', () => {
    it('should create task labels', async () => {
      // Request data
      const requestData = {
        labels: [
          {
            name: 'In progress',
            color: '#f2830b'
          }
        ]
      };

      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task-labels', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels')
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
        .post('/task-labels', { /* missing required fields */ })
        .reply(400, { error: 'Validation failed', message: 'Labels are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({});

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'Labels are required' });
    });
  });

  // Test POST /api/v1/task-labels/add-to-task/:taskId
  describe('POST /api/v1/task-labels/add-to-task/:taskId', () => {
    it('should add labels to a task', async () => {
      // Request data
      const requestData = {
        labels: [
          {
            name: 'Label text'
          },
          {
            name: 'Label text with specified color',
            color: '#15acc0'
          },
          {
            uuid: '5541a8c9-fb00-4385-9ead-d7baccd24d76'
          }
        ]
      };

      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task-labels/add-to-task/123', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels/add-to-task/123')
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
        .post('/task-labels/add-to-task/999', { labels: [] })
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels/add-to-task/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ labels: [] });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });

  // Test POST /api/v1/task-labels/remove-from-task/:taskId
  describe('POST /api/v1/task-labels/remove-from-task/:taskId', () => {
    it('should remove labels from a task', async () => {
      // Request data
      const requestData = {
        labels: [
          {
            name: 'Label text'
          },
          {
            name: 'Label text with specified color',
            color: '#15acc0'
          },
          {
            uuid: '5541a8c9-fb00-4385-9ead-d7baccd24d76'
          }
        ]
      };

      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task-labels/remove-from-task/123', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels/remove-from-task/123')
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
        .post('/task-labels/remove-from-task/999', { labels: [] })
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task-labels/remove-from-task/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ labels: [] });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });
});
