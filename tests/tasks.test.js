const request = require('supertest');
const app = require('../server');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Tasks API', () => {
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

  describe('POST /api/v1/project/:projectId/tasklist/:tasklistId/tasks', () => {
    it('should create a task in a tasklist', async () => {
      // Mock response data
      const mockResponseData = {
        id: 123,
        name: 'Water roses',
        due_date: '2023-12-15 00:00:00',
        due_date_end: '2023-12-16 00:00:00'
      };

      // Mock axios post method
      axios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Request body
      const requestBody = {
        name: 'Water roses',
        due_date: '2023-12-15 00:00:00',
        due_date_end: '2023-12-16 00:00:00'
      };

      // Make request
      const response = await request(app)
        .post('/api/v1/project/456/tasklist/789/tasks')
        .set(authHeaders)
        .send(requestBody);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/project/:projectId/tasklist/:tasklistId/tasks', () => {
    it('should get tasks in a tasklist', async () => {
      // Mock response data
      const mockResponseData = [
        {
          id: 123,
          name: 'Water roses',
          due_date: '2023-12-15 00:00:00',
          due_date_end: '2023-12-16 00:00:00',
          worker: {
            id: 1,
            fullname: 'John Newman'
          }
        }
      ];

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/project/456/tasklist/789/tasks')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/all-tasks', () => {
    it('should get all tasks with filters', async () => {
      // Mock response data
      const mockResponseData = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          tasks: [
            {
              id: 123,
              name: 'Water roses',
              due_date: '2023-12-15 00:00:00',
              due_date_end: '2023-12-16 00:00:00',
              worker: {
                id: 1,
                fullname: 'John Newman'
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
        .get('/api/v1/all-tasks')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/task/:taskId', () => {
    it('should get task details', async () => {
      // Mock response data
      const mockResponseData = {
        id: 123,
        name: 'Water roses',
        due_date: '2023-12-15 00:00:00',
        due_date_end: '2023-12-16 00:00:00',
        worker: {
          id: 1,
          fullname: 'John Newman'
        },
        description: 'Water the roses in the garden',
        state: {
          id: 1,
          state: 'active'
        }
      };

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/task/123')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  // Add more tests for other endpoints...
});
