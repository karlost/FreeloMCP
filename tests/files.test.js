/**
 * Files API Tests
 */

const request = require('supertest');
const app = require('../server');
const nock = require('nock');
const { Readable } = require('stream');

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

describe('Files API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/file/:fileUuid
  describe('GET /api/v1/file/:fileUuid', () => {
    it('should download a file', async () => {
      // Create a mock file content
      const fileContent = Buffer.from('Mock file content');
      
      // Create a readable stream from the file content
      const fileStream = new Readable();
      fileStream.push(fileContent);
      fileStream.push(null); // End of stream
      
      // Setup mock API response
      nock(API_BASE_URL)
        .get('/file/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .reply(200, fileStream, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="test-file.txt"'
        });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/file/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('application/octet-stream');
      expect(response.header['content-disposition']).toContain('attachment; filename="test-file.txt"');
      expect(response.body.toString()).toBe(fileContent.toString());
    });

    it('should handle file not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/file/invalid-uuid')
        .replyWithError('File not found');

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/file/invalid-uuid')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test POST /api/v1/file/upload
  describe('POST /api/v1/file/upload', () => {
    it('should upload a file', async () => {
      // Mock response data
      const mockResponse = {
        uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/file/upload')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/file/upload')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .attach('file', Buffer.from('Mock file content'), 'test-file.txt');

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle missing file error', async () => {
      // Make request to our API without attaching a file
      const response = await request(app)
        .post('/api/v1/file/upload')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message', 'No file provided');
    });
  });

  // Test GET /api/v1/all-docs-and-files
  describe('GET /api/v1/all-docs-and-files', () => {
    it('should get all items', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          items: [
            {
              uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
              name: 'Item name',
              author: {
                id: 2,
                fullname: 'Captain Freelo'
              },
              project: {
                id: 69,
                name: 'Project name'
              },
              directory_uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
              date_add: '2021-10-07T09:09:42+02:00',
              order: 12,
              type: 'file',
              filename: 'file name',
              caption: 'file caption',
              mime_type: 'image/png',
              extension: 'png',
              size: 93461,
              color: '#77787a',
              items_count: 0,
              link: null,
              link_type: null,
              note: null
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/all-docs-and-files')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-docs-and-files')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered items', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          items: [
            {
              uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
              name: 'Item name',
              author: {
                id: 2,
                fullname: 'Captain Freelo'
              },
              project: {
                id: 69,
                name: 'Project name'
              },
              directory_uuid: null,
              date_add: '2021-10-07T09:09:42+02:00',
              order: 12,
              type: 'file',
              filename: 'file name',
              caption: 'file caption',
              mime_type: 'image/png',
              extension: 'png',
              size: 93461,
              color: '#77787a',
              items_count: 0,
              link: null,
              link_type: null,
              note: null
            }
          ]
        }
      };

      // Setup mock API response with query parameters
      nock(API_BASE_URL)
        .get('/all-docs-and-files')
        .query({
          'projects_ids[]': '69',
          type: 'file'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/all-docs-and-files')
        .query({
          'projects_ids[]': '69',
          type: 'file'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });
});
