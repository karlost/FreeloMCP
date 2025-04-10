const request = require('supertest');
const app = require('../server');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Projects API', () => {
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

  describe('POST /api/v1/projects', () => {
    it('should create a new project', async () => {
      // Mock response data
      const mockResponseData = {
        id: 25,
        name: 'Vegetable growing'
      };

      // Mock axios post method
      axios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Request body
      const requestBody = {
        name: 'Vegetable growing',
        currency_iso: 'CZK',
        project_owner_id: 125
      };

      // Make request
      const response = await request(app)
        .post('/api/v1/projects')
        .set(authHeaders)
        .send(requestBody);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should get all own projects', async () => {
      // Mock response data
      const mockResponseData = [
        {
          id: 132,
          name: 'Project name',
          date_add: '2021-05-12T15:22:51+02:00',
          date_edited_at: '2021-10-04T09:32:00+02:00',
          tasklists: [
            {
              id: 426,
              name: 'Marketing'
            }
          ],
          client: {
            id: 12,
            email: 'client@domain.tld',
            name: 'John Davis',
            company: 'Company ltd.',
            company_id: '01234567',
            company_tax_id: 'CZ01234567',
            street: 'Main Street 123',
            town: 'Anytown',
            zip: '17101'
          }
        }
      ];

      // Mock axios get method
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponseData })
      });

      // Make request
      const response = await request(app)
        .get('/api/v1/projects')
        .set(authHeaders);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseData);
    });
  });

  // Add more tests for other endpoints...
});
