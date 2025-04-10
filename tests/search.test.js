/**
 * Search API Tests
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

describe('Search API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test POST /api/v1/search
  describe('POST /api/v1/search', () => {
    it('should search for items', async () => {
      // Request data
      const requestData = {
        search_query: 'repair the ship',
        state_ids: [
          'active',
          'finished',
          'archived'
        ],
        page: 0,
        limit: 100
      };

      // Mock response data
      const mockResponse = {
        total: 2,
        count: 100,
        page: 0,
        per_page: 100,
        data: {
          items: [
            {
              score: 57.562523,
              id: 157194,
              uuid: null,
              name: 'We have to repair the ship',
              author_id: 2118,
              type: 'task',
              highlight_name: [
                'We have to <em>repair</em> <em>the</em> <em>ship</em>'
              ],
              highlight_content: [],
              project: {
                id: 2621,
                name: 'Test project'
              },
              tasklist: {
                id: 11053,
                name: 'Things to repair'
              },
              state: 1,
              is_smart: false
            },
            {
              score: 31.851616,
              id: 11053,
              uuid: null,
              name: 'Things to repair',
              author_id: 2118,
              type: 'tasklist',
              highlight_name: [
                'Things to <em>repair</em>'
              ],
              highlight_content: [],
              project: {
                id: 2621,
                name: 'Test project'
              },
              tasklist: {
                id: 11053,
                name: 'Things to repair'
              },
              state: 1
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/search', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/search')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should search with filters', async () => {
      // Request data with filters
      const requestData = {
        search_query: 'repair the ship',
        projects_ids: [2621],
        tasklists_ids: [11053],
        entity_type: 'task',
        state_ids: ['active'],
        page: 0,
        limit: 10
      };

      // Mock response data
      const mockResponse = {
        total: 1,
        count: 10,
        page: 0,
        per_page: 10,
        data: {
          items: [
            {
              score: 57.562523,
              id: 157194,
              uuid: null,
              name: 'We have to repair the ship',
              author_id: 2118,
              type: 'task',
              highlight_name: [
                'We have to <em>repair</em> <em>the</em> <em>ship</em>'
              ],
              highlight_content: [],
              project: {
                id: 2621,
                name: 'Test project'
              },
              tasklist: {
                id: 11053,
                name: 'Things to repair'
              },
              state: 1,
              is_smart: false
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/search', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/search')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle empty search results', async () => {
      // Request data
      const requestData = {
        search_query: 'nonexistent item',
        page: 0,
        limit: 100
      };

      // Mock response data
      const mockResponse = {
        total: 0,
        count: 0,
        page: 0,
        per_page: 100,
        data: {
          items: []
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/search', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/search')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should handle validation errors', async () => {
      // Request data with missing required fields
      const requestData = {
        // Missing search_query
        page: 0,
        limit: 100
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/search', requestData)
        .reply(400, { error: 'Validation failed', message: 'search_query is required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/search')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'search_query is required' });
    });
  });
});
