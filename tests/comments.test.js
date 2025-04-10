/**
 * Comments API Tests
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

describe('Comments API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test POST /api/v1/task/:taskId/comments
  describe('POST /api/v1/task/:taskId/comments', () => {
    it('should create a comment for a task', async () => {
      // Request data
      const requestData = {
        content: 'Comment content...',
        files: [
          {
            download_url: 'http://www.domain.tld/galery/max_1352239.jpg',
            filename: 'max_1352239.jpg'
          }
        ]
      };

      // Mock response data
      const mockResponse = {
        id: 1677,
        content: '<p>Comment content...</p>',
        date_add: '2016-08-30T18:35:53+0200',
        files: [
          {
            id: 1135,
            filename: 'max_1352239.jpg',
            size: 93461
          }
        ]
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/task/123/comments', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/123/comments')
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
        .post('/task/999/comments', { content: 'Comment content...' })
        .reply(404, { error: 'Task not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/task/999/comments')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ content: 'Comment content...' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });
  });

  // Test POST /api/v1/comment/:commentId
  describe('POST /api/v1/comment/:commentId', () => {
    it('should update a comment', async () => {
      // Request data
      const requestData = {
        content: 'New comment content...',
        files: [
          {
            download_url: 'http://www.domain.tld/galery/max_1352239.jpg',
            filename: 'max_1352239.jpg'
          }
        ]
      };

      // Mock response data
      const mockResponse = {
        id: 1677,
        content: '<p>New comment content...</p>',
        date_add: '2016-08-30T18:35:53+0200',
        files: [
          {
            id: 1135,
            filename: 'max_1352239.jpg',
            size: 93461
          }
        ]
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/comment/456', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/comment/456')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle comment not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/comment/999', { content: 'New comment content...' })
        .reply(404, { error: 'Comment not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/comment/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ content: 'New comment content...' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Comment not found' });
    });
  });

  // Test GET /api/v1/all-comments
  describe('GET /api/v1/all-comments', () => {
    it('should get all comments', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          comments: [
            {
              id: 5476,
              uuid: null,
              content: 'Comment content',
              date_add: '2018-08-08T11:34:57+02:00',
              date_edited_at: '2018-08-09T12:14:00+02:00',
              author: {
                id: 2,
                fullname: 'Karel Borkovec'
              },
              task: {
                id: 54,
                name: 'Advertisement'
              },
              tasklist: {
                id: 426,
                name: 'Marketing'
              },
              project: {
                id: 23,
                name: 'My project'
              },
              document: null,
              link: null,
              file: null,
              files: [
                {
                  uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
                  filename: 'max_1352239.jpg',
                  caption: 'File caption',
                  description: 'File description',
                  date_add: '2018-08-08T11:34:57+02:00',
                  date_edited_at: '2018-08-09T12:14:00+02:00',
                  size: 93461
                }
              ]
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/all-comments')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-comments')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered comments', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          comments: [
            {
              id: 5476,
              uuid: null,
              content: 'Comment content',
              date_add: '2018-08-08T11:34:57+02:00',
              date_edited_at: '2018-08-09T12:14:00+02:00',
              author: {
                id: 2,
                fullname: 'Karel Borkovec'
              },
              task: {
                id: 54,
                name: 'Advertisement'
              },
              tasklist: {
                id: 426,
                name: 'Marketing'
              },
              project: {
                id: 23,
                name: 'My project'
              },
              document: null,
              link: null,
              file: null,
              files: []
            }
          ]
        }
      };

      // Setup mock API response with query parameters
      nock(API_BASE_URL)
        .get('/all-comments')
        .query({
          'projects_ids[]': '23',
          type: 'task',
          order_by: 'date_add',
          order: 'desc'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-comments')
        .query({
          'projects_ids[]': '23',
          type: 'task',
          order_by: 'date_add',
          order: 'desc'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });
});
