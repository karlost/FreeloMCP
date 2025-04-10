const request = require('supertest');
const app = require('../server');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Pinned Items API', () => {
  // Mock auth data
  const mockAuth = {
    email: 'test@example.com',
    apiKey: 'test-api-key',
    userAgent: 'Test App (test@example.com)'
  };

  // Mock auth headers
  const authHeaders = {
    'Authorization': `Basic ${Buffer.from(`${mockAuth.email}:${mockAuth.apiKey}`).toString('base64')}`,
    'User-Agent': mockAuth.userAgent
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/v1/project/:projectId/pinned-items', () => {
    it('should get all pinned items in a project', async () => {
      // Mock response data
      const mockResponseData = [
        {
          id: 98,
          link: 'https://www.freelo.io',
          title: 'Project and task management application'
        }
      ];

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/project/123/pinned-items')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('POST /api/v1/project/:projectId/pinned-items', () => {
    it('should pin an item to a project', async () => {
      // Mock response data
      const mockResponseData = {
        id: 98,
        link: 'https://www.freelo.io',
        title: 'Project and task management application'
      };

      // Mock axios post method
      axios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Request body
      const requestBody = {
        link: 'https://www.freelo.io',
        title: 'Project and task management application'
      };

      // Make request
      const response = await request(app)
        .post('/api/v1/project/123/pinned-items')
        .set(authHeaders)
        .send(requestBody);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('DELETE /api/v1/pinned-item/:pinnedItemId', () => {
    it('should delete a pinned item', async () => {
      // Mock response data
      const mockResponseData = {
        result: 'success'
      };

      // Mock axios delete method
      axios.create.mockReturnValue({
        delete: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .delete('/api/v1/pinned-item/123')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });
});
