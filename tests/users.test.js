/**
 * Users API Tests
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

describe('Users API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/users
  describe('GET /api/v1/users', () => {
    it('should get all users', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          users: [
            {
              id: 69,
              fullname: 'Robert Miles'
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/users')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test GET /api/v1/users/project-manager-of
  describe('GET /api/v1/users/project-manager-of', () => {
    it('should get users who promoted me as project manager', async () => {
      // Mock response data
      const mockResponse = [
        {
          id: 69,
          fullname: 'Robert Miles'
        }
      ];

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/users/project-manager-of')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/users/project-manager-of')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test POST /api/v1/users/manage-workers (with emails)
  describe('POST /api/v1/users/manage-workers (with emails)', () => {
    it('should invite users to projects by emails', async () => {
      // Request data
      const requestData = {
        projects_ids: [25],
        emails: ['user@domain.tld']
      };

      // Mock response data
      const mockResponse = {
        newly_invited_users_to_projects: [],
        newly_created_users: [
          {
            id: 1,
            email: 'user@freelo.io'
          }
        ],
        newly_invited_users: [
          {
            id: 1,
            projects_ids: [3],
            email: 'user@freelo.io'
          }
        ],
        removed_users_from_projects: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/users/manage-workers', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/users/manage-workers')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test POST /api/v1/users/manage-workers (with user IDs)
  describe('POST /api/v1/users/manage-workers (with user IDs)', () => {
    it('should invite users to projects by user IDs', async () => {
      // Request data
      const requestData = {
        projects_ids: [25],
        users_ids: [134]
      };

      // Mock response data
      const mockResponse = {
        newly_invited_users_to_projects: [],
        newly_created_users: [
          {
            id: 1,
            email: 'user@freelo.io'
          }
        ],
        newly_invited_users: [
          {
            id: 1,
            projects_ids: [3],
            email: 'user@freelo.io'
          }
        ],
        removed_users_from_projects: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/users/manage-workers', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/users/manage-workers')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test GET /api/v1/user/:userId/out-of-office
  describe('GET /api/v1/user/:userId/out-of-office', () => {
    it('should get out of office status for a user', async () => {
      // Mock response data
      const mockResponse = {
        out_of_office: {
          date_from: '2024-05-20T22:00:00Z',
          date_to: '2024-05-21T21:59:59Z'
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/user/123/out-of-office')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/user/123/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle user not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/user/999/out-of-office')
        .reply(404, { error: 'User not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/user/999/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  // Test POST /api/v1/user/:userId/out-of-office
  describe('POST /api/v1/user/:userId/out-of-office', () => {
    it('should set out of office status for a user', async () => {
      // Request data
      const requestData = {
        out_of_office: {
          date_from: '2024-05-20T22:00:00Z',
          date_to: '2024-05-21T21:59:59Z'
        }
      };

      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/user/123/out-of-office', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/user/123/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      // Request data with missing required fields
      const requestData = {
        out_of_office: {
          // Missing date_from and date_to
        }
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/user/123/out-of-office', requestData)
        .reply(400, { error: 'Validation failed', message: 'date_from and date_to are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/user/123/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'date_from and date_to are required' });
    });
  });

  // Test DELETE /api/v1/user/:userId/out-of-office
  describe('DELETE /api/v1/user/:userId/out-of-office', () => {
    it('should delete out of office status for a user', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .delete('/user/123/out-of-office')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/user/123/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle user not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .delete('/user/999/out-of-office')
        .reply(404, { error: 'User not found' });

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/user/999/out-of-office')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});
