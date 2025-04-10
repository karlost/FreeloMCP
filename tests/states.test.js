/**
 * States API Tests
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

describe('States API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/states
  describe('GET /api/v1/states', () => {
    it('should get all states', async () => {
      // Mock response data
      const mockResponse = {
        states: [
          {
            id: 1,
            state: 'active'
          },
          {
            id: 2,
            state: 'inactive'
          }
        ]
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/states')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/states')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle API error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/states')
        .replyWithError('API error');

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/states')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'Service Unavailable');
    });
  });
});
