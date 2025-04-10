/**
 * Custom Fields API Tests
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

describe('Custom Fields API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/custom-field/get-types
  describe('GET /api/v1/custom-field/get-types', () => {
    it('should get custom field types', async () => {
      // Mock response data
      const mockResponse = {
        custom_field_types: [
          {
            uuid: 'b1e56fa9-a97a-429b-8ab4-82bebe58933a',
            name: 'number'
          },
          {
            uuid: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
            name: 'text'
          }
        ]
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/custom-field/get-types')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/custom-field/get-types')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test POST /api/v1/custom-field/create/:projectId
  describe('POST /api/v1/custom-field/create/:projectId', () => {
    it('should create a custom field', async () => {
      // Request data
      const requestData = {
        uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
        name: 'Phone',
        type: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f'
      };

      // Mock response data
      const mockResponse = {
        custom_field: {
          name: 'Phone',
          type: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
          date_add: '2022-10-19T09:27:31+02:00',
          author_id: 11,
          uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          project_id: 9
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/custom-field/create/9', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/create/9')
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
        uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13'
        // Missing name and type
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/custom-field/create/9', requestData)
        .reply(400, { error: 'Validation failed', message: 'name and type are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/create/9')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'name and type are required' });
    });
  });

  // Test POST /api/v1/custom-field/rename/:uuid
  describe('POST /api/v1/custom-field/rename/:uuid', () => {
    it('should rename a custom field', async () => {
      // Request data
      const requestData = {
        name: 'Email'
      };

      // Mock response data
      const mockResponse = {
        custom_field: {
          name: 'Email',
          type: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
          date_add: '2022-10-19T09:27:31+02:00',
          author_id: 11,
          uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          project_id: 9
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/custom-field/rename/b52e341f-5e45-4567-9e2b-994931b7eb13', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/rename/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle custom field not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/custom-field/rename/invalid-uuid', { name: 'Email' })
        .reply(404, { error: 'Custom field not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/rename/invalid-uuid')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ name: 'Email' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field not found' });
    });
  });

  // Test DELETE /api/v1/custom-field/delete/:uuid
  describe('DELETE /api/v1/custom-field/delete/:uuid', () => {
    it('should delete a custom field', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .delete('/custom-field/delete/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/custom-field/delete/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle custom field not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .delete('/custom-field/delete/invalid-uuid')
        .reply(404, { error: 'Custom field not found' });

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/custom-field/delete/invalid-uuid')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field not found' });
    });
  });

  // Test POST /api/v1/custom-field/restore/:uuid
  describe('POST /api/v1/custom-field/restore/:uuid', () => {
    it('should restore a custom field', async () => {
      // Mock response data
      const mockResponse = {
        custom_field: {
          name: 'Email',
          type: '2f7bfe3a-c950-470e-b910-95b4caf5dc4f',
          date_add: '2022-10-19T09:27:31+02:00',
          author_id: 11,
          uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          project_id: 9
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/custom-field/restore/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/restore/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle custom field not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/custom-field/restore/invalid-uuid')
        .reply(404, { error: 'Custom field not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/restore/invalid-uuid')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field not found' });
    });
  });

  // Test POST /api/v1/custom-field/add-or-edit-value
  describe('POST /api/v1/custom-field/add-or-edit-value', () => {
    it('should add or edit a custom field value', async () => {
      // Request data
      const requestData = {
        custom_field_uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
        task_id: 51,
        value: 'foo@email.cz'
      };

      // Mock response data
      const mockResponse = {
        custom_field_value: {
          value: 'foo@email.cz',
          date_add: '2022-10-25T18:53:11+02:00',
          date_edited_at: null,
          author_id: 11,
          uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          task_id: 51,
          custom_field_uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13'
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/custom-field/add-or-edit-value', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/add-or-edit-value')
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
        custom_field_uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13'
        // Missing task_id and value
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/custom-field/add-or-edit-value', requestData)
        .reply(400, { error: 'Validation failed', message: 'task_id and value are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/add-or-edit-value')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'task_id and value are required' });
    });
  });

  // Test POST /api/v1/custom-field/add-or-edit-enum-value
  describe('POST /api/v1/custom-field/add-or-edit-enum-value', () => {
    it('should add or edit an enum custom field value', async () => {
      // Request data
      const requestData = {
        customFieldUuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
        task_id: 51,
        value: 'uuid_of_enum_option'
      };

      // Mock response data
      const mockResponse = {
        customFieldEnum: {
          uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          task_id: 51,
          custom_field_uuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13',
          value: 'uuid_of_enum_option',
          date_add: '2022-10-25T18:53:11+02:00',
          date_edited_at: null,
          author_id: 11
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/custom-field/add-or-edit-enum-value', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/add-or-edit-enum-value')
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
        customFieldUuid: 'b52e341f-5e45-4567-9e2b-994931b7eb13'
        // Missing task_id and value
      };

      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/custom-field/add-or-edit-enum-value', requestData)
        .reply(400, { error: 'Validation failed', message: 'task_id and value are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/custom-field/add-or-edit-enum-value')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'task_id and value are required' });
    });
  });

  // Test DELETE /api/v1/custom-field/delete-value/:uuid
  describe('DELETE /api/v1/custom-field/delete-value/:uuid', () => {
    it('should delete a custom field value', async () => {
      // Mock response data
      const mockResponse = {
        result: 'success'
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .delete('/custom-field/delete-value/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/custom-field/delete-value/b52e341f-5e45-4567-9e2b-994931b7eb13')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle custom field value not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .delete('/custom-field/delete-value/invalid-uuid')
        .reply(404, { error: 'Custom field value not found' });

      // Make request to our API
      const response = await request(app)
        .delete('/api/v1/custom-field/delete-value/invalid-uuid')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Custom field value not found' });
    });
  });
});
