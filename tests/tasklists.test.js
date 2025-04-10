const request = require('supertest');
const app = require('../server');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Tasklists API', () => {
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

  describe('POST /api/v1/project/:projectId/tasklists', () => {
    it('should create a tasklist in a project', async () => {
      // Mock response data
      const mockResponseData = {
        id: 98,
        name: 'Water the plants',
        budget: {
          amount: '1025',
          currency: 'CZK'
        }
      };

      // Mock axios post method
      axios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Request body
      const requestBody = {
        name: 'Water the plants',
        budget: '1025'
      };

      // Make request
      const response = await request(app)
        .post('/api/v1/project/123/tasklists')
        .set(authHeaders)
        .send(requestBody);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/all-tasklists', () => {
    it('should get all tasklists', async () => {
      // Mock response data
      const mockResponseData = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          tasklists: [
            {
              id: 98,
              name: 'Water the plants',
              project: {
                id: 123,
                name: 'Garden Project'
              }
            }
          ]
        }
      };

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/all-tasklists')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/project/:projectId/tasklist/:tasklistId/assignable-workers', () => {
    it('should get assignable workers for a tasklist', async () => {
      // Mock response data
      const mockResponseData = [
        {
          id: 69,
          fullname: 'Robert Miles'
        }
      ];

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/project/123/tasklist/456/assignable-workers')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/tasklist/:tasklistId', () => {
    it('should get tasklist details', async () => {
      // Mock response data
      const mockResponseData = {
        id: 98,
        name: 'Water the plants',
        budget: {
          amount: '1025',
          currency: 'CZK'
        },
        project: {
          id: 123,
          name: 'Garden Project'
        },
        tasks: [
          {
            id: 456,
            name: 'Water roses'
          }
        ]
      };

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/tasklist/98')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('POST /api/v1/tasklist/create-from-template/:templateId', () => {
    it('should create a tasklist from template', async () => {
      // Mock response data
      const mockResponseData = {
        id: 98,
        name: 'Water the plants',
        budget: {
          amount: '1025',
          currency: 'CZK'
        }
      };

      // Mock axios post method
      axios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Request body
      const requestBody = {
        project_id: 123,
        name: 'Water the plants',
        budget: '1025'
      };

      // Make request
      const response = await request(app)
        .post('/api/v1/tasklist/create-from-template/789')
        .set(authHeaders)
        .send(requestBody);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });
});
