/**
 * Notes API Tests
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

describe('Notes API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test POST /api/v1/project/:projectId/note
  describe('POST /api/v1/project/:projectId/note', () => {
    it('should create a new note', async () => {
      // Request data
      const requestData = {
        name: 'My note',
        content: 'Note content ...'
      };

      // Mock response data
      const mockResponse = {
        id: 34,
        name: 'My note',
        date_add: '2022-10-19T09:27:31+02:00',
        date_edited_at: '2022-10-19T09:27:31+02:00',
        state: {
          id: 1,
          state: 'active'
        },
        content: '<p>Note content ...</p>',
        author: {
          id: 2,
          fullname: 'Captain Freelo'
        },
        project: {
          id: 8,
          name: 'Project name'
        },
        files: [],
        comments: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/project/8/note', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/project/8/note')
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
        content: 'Note content ...'
        // Missing name
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/project/8/note', requestData)
        .reply(400, { error: 'Validation failed', message: 'name is required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/project/8/note')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'name is required' });
    });
  });

  // Test GET /api/v1/note/:noteId
  describe('GET /api/v1/note/:noteId', () => {
    it('should get note details', async () => {
      // Mock response data
      const mockResponse = {
        id: 34,
        name: 'My note',
        date_add: '2022-10-19T09:27:31+02:00',
        date_edited_at: '2022-10-19T09:27:31+02:00',
        state: {
          id: 1,
          state: 'active'
        },
        content: '<p>Note content ...</p>',
        author: {
          id: 2,
          fullname: 'Captain Freelo'
        },
        project: {
          id: 8,
          name: 'Project name'
        },
        files: [],
        comments: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/note/34')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/note/34')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle note not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/note/999')
        .reply(404, { error: 'Note not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/note/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Note not found' });
    });
  });

  // Test POST /api/v1/note/:noteId
  describe('POST /api/v1/note/:noteId', () => {
    it('should update an existing note', async () => {
      // Request data
      const requestData = {
        name: 'Updated note',
        content: 'Updated content ...'
      };

      // Mock response data
      const mockResponse = {
        id: 34,
        name: 'Updated note',
        date_add: '2022-10-19T09:27:31+02:00',
        date_edited_at: '2022-10-20T10:30:45+02:00',
        state: {
          id: 1,
          state: 'active'
        },
        content: '<p>Updated content ...</p>',
        author: {
          id: 2,
          fullname: 'Captain Freelo'
        },
        project: {
          id: 8,
          name: 'Project name'
        },
        files: [],
        comments: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/note/34', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/note/34')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle note not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/note/999', { name: 'Updated note', content: 'Updated content ...' })
        .reply(404, { error: 'Note not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/note/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ name: 'Updated note', content: 'Updated content ...' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Note not found' });
    });
  });

  // Test DELETE /api/v1/note/:noteId
  describe('DELETE /api/v1/note/:noteId', () => {
    it('should delete an existing note', async () => {
      // Mock response data
      const mockResponse = {
        id: 34,
        name: 'My note',
        date_add: '2022-10-19T09:27:31+02:00',
        date_edited_at: '2022-10-19T09:27:31+02:00',
        state: {
          id: 4,
          state: 'deleted'
        },
        content: '<p>Note content ...</p>',
        author: {
          id: 2,
          fullname: 'Captain Freelo'
        },
        project: {
          id: 8,
          name: 'Project name'
        },
        files: [],
        comments: []
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .delete('/note/34')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/note/34')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(response.body.state.id).toBe(4);
      expect(response.body.state.state).toBe('deleted');
    });

    it('should handle note not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .delete('/note/999')
        .reply(404, { error: 'Note not found' });

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/note/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Note not found' });
    });
  });
});
