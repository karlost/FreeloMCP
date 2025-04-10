/**
 * Custom Filters API Tests
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

describe('Custom Filters API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/dashboard/custom-filters
  describe('GET /api/v1/dashboard/custom-filters', () => {
    it('should get all custom filters', async () => {
      // Mock response data
      const mockResponse = [
        {
          uuid: '4c5fa4c0-debf-4509-8c3e-2c26011bc857',
          name: 'My own with passed deadline',
          name_webalized: 'my-own-with-passed-deadline'
        },
        {
          uuid: '24fa4db2-7d02-4647-be8a-2387b9375f4a',
          name: 'Work in progress',
          name_webalized: 'work-in-progress'
        }
      ];

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/dashboard/custom-filters')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/dashboard/custom-filters')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test GET /api/v1/dashboard/custom-filter/by-uuid/:uuid/tasks
  describe('GET /api/v1/dashboard/custom-filter/by-uuid/:uuid/tasks', () => {
    it('should get tasks by filter UUID', async () => {
      // Mock response data
      const mockResponse = [
        {
          id: 4955,
          name: 'Write PR article',
          date_add: '2021-08-04T07:33:47+02:00',
          date_edited_at: '2021-10-04T09:32:00+02:00',
          due_date: '2021-10-10T12:00:00+02:00',
          due_date_end: '2021-10-15T12:00:00+02:00',
          parent_task_id: 4900,
          count_subtasks: 0,
          count_comments: 14,
          author: {
            id: 2,
            name: 'Captain Freelo'
          },
          worker: {
            id: 1,
            name: 'Karel Borkovec'
          },
          state: {
            id: 1,
            state: 'active'
          },
          project: {
            id: 8,
            name: 'Project name',
            state: {
              id: 1,
              state: 'active'
            }
          },
          tasklist: {
            id: 98,
            name: 'Water the plants',
            state: {
              id: 1,
              state: 'active'
            }
          },
          labels: [
            {
              uuid: '39bb2869-4e84-4e85-a11f-555567d0939c',
              name: 'in progress',
              color: '#f2830b'
            }
          ],
          custom_fields: [
            {
              field_uuid: '133c3793-f5cc-4302-b20b-63db0365f87c',
              custom_fields_types_uuid: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
              project_id: 9,
              name: 'CF',
              priority: 0,
              field_date_add: '2022-07-28 11:25:27',
              value_uuid: 'e56e4be9-9c3d-4cdc-a43f-2d65e11a81b7',
              value_author_id: 11,
              value: 'value',
              value_date_add: '2022-09-15 08:59:59',
              value_date_edited_at: null
            }
          ],
          total_time_estimate: null,
          users_time_estimates: []
        }
      ];

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/dashboard/custom-filter/by-uuid/4c5fa4c0-debf-4509-8c3e-2c26011bc857/tasks')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/dashboard/custom-filter/by-uuid/4c5fa4c0-debf-4509-8c3e-2c26011bc857/tasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle filter not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/dashboard/custom-filter/by-uuid/invalid-uuid/tasks')
        .reply(404, { error: 'Custom filter not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/dashboard/custom-filter/by-uuid/invalid-uuid/tasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom filter not found' });
    });
  });

  // Test GET /api/v1/dashboard/custom-filter/by-name/:nameWebalized/tasks
  describe('GET /api/v1/dashboard/custom-filter/by-name/:nameWebalized/tasks', () => {
    it('should get tasks by filter name', async () => {
      // Mock response data
      const mockResponse = [
        {
          id: 4955,
          name: 'Write PR article',
          date_add: '2021-08-04T07:33:47+02:00',
          date_edited_at: '2021-10-04T09:32:00+02:00',
          due_date: '2021-10-10T12:00:00+02:00',
          due_date_end: '2021-10-15T12:00:00+02:00',
          parent_task_id: 4900,
          count_subtasks: 0,
          count_comments: 14,
          author: {
            id: 2,
            name: 'Captain Freelo'
          },
          worker: {
            id: 1,
            name: 'Karel Borkovec'
          },
          state: {
            id: 1,
            state: 'active'
          },
          project: {
            id: 8,
            name: 'Project name',
            state: {
              id: 1,
              state: 'active'
            }
          },
          tasklist: {
            id: 98,
            name: 'Water the plants',
            state: {
              id: 1,
              state: 'active'
            }
          },
          labels: [
            {
              uuid: '39bb2869-4e84-4e85-a11f-555567d0939c',
              name: 'in progress',
              color: '#f2830b'
            }
          ],
          custom_fields: [
            {
              field_uuid: '133c3793-f5cc-4302-b20b-63db0365f87c',
              custom_fields_types_uuid: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
              project_id: 9,
              name: 'CF',
              priority: 0,
              field_date_add: '2022-07-28 11:25:27',
              value_uuid: 'e56e4be9-9c3d-4cdc-a43f-2d65e11a81b7',
              value_author_id: 11,
              value: 'value',
              value_date_add: '2022-09-15 08:59:59',
              value_date_edited_at: null
            }
          ],
          total_time_estimate: null,
          users_time_estimates: []
        }
      ];

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/dashboard/custom-filter/by-name/my-own-with-passed-deadline/tasks')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/dashboard/custom-filter/by-name/my-own-with-passed-deadline/tasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle filter not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/dashboard/custom-filter/by-name/invalid-name/tasks')
        .reply(404, { error: 'Custom filter not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/dashboard/custom-filter/by-name/invalid-name/tasks')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom filter not found' });
    });
  });
});
