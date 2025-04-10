/**
 * Notifications API Tests
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

describe('Notifications API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/all-notifications
  describe('GET /api/v1/all-notifications', () => {
    it('should get all notifications', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          notifications: [
            {
              id: 14,
              type: 'comment_new',
              date_action: '2021-05-26T04:59:20+00:00',
              author: {
                id: 21,
                fullname: 'Captain Freelo'
              },
              is_unread: true,
              is_new: true,
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
        .get('/all-notifications')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-notifications')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered notifications', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          notifications: [
            {
              id: 14,
              type: 'comment_new',
              date_action: '2021-05-26T04:59:20+00:00',
              author: {
                id: 21,
                fullname: 'Captain Freelo'
              },
              is_unread: true,
              is_new: true,
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
        .get('/all-notifications')
        .query({
          'projects_ids[]': '69',
          'users_ids[]': '21',
          order: 'desc',
          only_unread: 'true'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-notifications')
        .query({
          'projects_ids[]': '69',
          'users_ids[]': '21',
          order: 'desc',
          only_unread: 'true'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test POST /api/v1/notification/:notificationId/mark-as-read
  describe('POST /api/v1/notification/:notificationId/mark-as-read', () => {
    it('should mark notification as read', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/notification/14/mark-as-read')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/notification/14/mark-as-read')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle notification not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/notification/999/mark-as-read')
        .reply(404, { error: 'Notification not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/notification/999/mark-as-read')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Notification not found' });
    });
  });

  // Test POST /api/v1/notification/:notificationId/mark-as-unread
  describe('POST /api/v1/notification/:notificationId/mark-as-unread', () => {
    it('should mark notification as unread', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/notification/14/mark-as-unread')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/notification/14/mark-as-unread')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle notification not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/notification/999/mark-as-unread')
        .reply(404, { error: 'Notification not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/notification/999/mark-as-unread')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Notification not found' });
    });
  });
});
