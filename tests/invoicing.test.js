/**
 * Invoicing API Tests
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

describe('Invoicing API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    nock.cleanAll();
  });

  // Test GET /api/v1/issued-invoices
  describe('GET /api/v1/issued-invoices', () => {
    it('should get all issued invoices', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          issued_invoices: [
            {
              id: 159,
              date_add: '2018-08-15T09:09:42+02:00',
              note: '…',
              currency: 'CZK',
              minutes: 120,
              price: {
                amount: '0',
                currency: 'CZK'
              },
              subject: {
                company_name: 'Company',
                invoice_url: '…'
              },
              inv_items: [
                {
                  id: 153,
                  name: 'Invoice item',
                  minutes: 120,
                  price: {
                    amount: '0',
                    currency: 'CZK'
                  }
                }
              ]
            }
          ]
        }
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/issued-invoices')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoices')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should get filtered issued invoices', async () => {
      // Mock response data
      const mockResponse = {
        total: 1,
        count: 1,
        page: 0,
        per_page: 100,
        data: {
          issued_invoices: [
            {
              id: 159,
              date_add: '2018-08-15T09:09:42+02:00',
              note: '…',
              currency: 'CZK',
              minutes: 120,
              price: {
                amount: '0',
                currency: 'CZK'
              },
              subject: {
                company_name: 'Company',
                invoice_url: '…'
              },
              inv_items: []
            }
          ]
        }
      };

      // Setup mock API response with query parameters
      nock(API_BASE_URL)
        .get('/issued-invoices')
        .query({
          'date_range[date_from]': '2018-08-01',
          'date_range[date_to]': '2018-08-31',
          'projects_ids[]': '25'
        })
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoices')
        .query({
          'date_range[date_from]': '2018-08-01',
          'date_range[date_to]': '2018-08-31',
          'projects_ids[]': '25'
        })
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });
  });

  // Test GET /api/v1/issued-invoice/:invoiceId
  describe('GET /api/v1/issued-invoice/:invoiceId', () => {
    it('should get issued invoice detail', async () => {
      // Mock response data
      const mockResponse = {
        id: 176,
        date_add: '2018-11-13T13:29:14+01:00',
        currency: 'CZK',
        note: '…',
        subject: {
          company_name: 'Company',
          invoice_url: '…'
        },
        inv_items: [
          {
            id: 168,
            name: 'Project 1',
            minutes: 240,
            price: {
              amount: '80000',
              currency: 'CZK'
            },
            reports: [
              {
                id: 912,
                project_name: 'Project 1',
                tasklist_name: 'Tasklist 1',
                name: 'Task name',
                price: {
                  amount: '20000',
                  currency: 'CZK'
                },
                minutes: 60
              }
            ]
          }
        ],
        price: {
          amount: '80000',
          currency: 'CZK'
        },
        minutes: 240
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/issued-invoice/176')
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoice/176')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle invoice not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/issued-invoice/999')
        .reply(404, { error: 'Invoice not found' });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoice/999')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Invoice not found' });
    });
  });

  // Test GET /api/v1/issued-invoice/:invoiceId/reports
  describe('GET /api/v1/issued-invoice/:invoiceId/reports', () => {
    it('should download issued invoice reports', async () => {
      // Create a mock CSV content
      const csvContent = 'Project,Tasklist,Task,Minutes,Price\nProject 1,Tasklist 1,Task name,60,200.00';

      // Create a readable stream from the CSV content
      const csvStream = new Readable();
      csvStream.push(csvContent);
      csvStream.push(null); // End of stream

      // Setup mock API response
      nock(API_BASE_URL)
        .get('/issued-invoice/176/reports')
        .reply(200, csvStream, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="invoice-176-reports.csv"'
        });

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoice/176/reports')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/csv');
      expect(response.header['content-disposition']).toContain('attachment; filename="invoice-176-reports.csv"');
      expect(response.text).toBe(csvContent);
    });

    it('should handle invoice not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .get('/issued-invoice/999/reports')
        .replyWithError('Invoice not found');

      // Make request to our API
      const response = await request(app)
        .get('/api/v1/issued-invoice/999/reports')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent);

      // Assert response
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test POST /api/v1/issued-invoice/:invoiceId/mark-as-invoiced
  describe('POST /api/v1/issued-invoice/:invoiceId/mark-as-invoiced', () => {
    it('should mark issued invoice as invoiced', async () => {
      // Request data
      const requestData = {
        url: 'https://www.freelo.io',
        subject: 'Company tld.'
      };

      // Mock response data
      const mockResponse = {
        id: 176,
        date_add: '2018-11-13T13:29:14+01:00',
        currency: 'CZK',
        inv_items: [
          {
            id: 168,
            name: 'Project 1',
            minutes: 240,
            price: {
              amount: '80000',
              currency: 'CZK'
            },
            reports: [
              {
                id: 912,
                project_name: 'Project 1',
                tasklist_name: 'Tasklist 1',
                name: 'Task name',
                price: {
                  amount: '20000',
                  currency: 'CZK'
                },
                minutes: 60
              }
            ]
          }
        ],
        price: {
          amount: '80000',
          currency: 'CZK'
        },
        minutes: 240
      };

      // Setup mock API response
      nock(API_BASE_URL)
        .post('/issued-invoice/176/mark-as-invoiced', requestData)
        .reply(200, mockResponse);

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/issued-invoice/176/mark-as-invoiced')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send(requestData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle invoice not found error', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/issued-invoice/999/mark-as-invoiced', { url: 'https://www.freelo.io', subject: 'Company tld.' })
        .reply(404, { error: 'Invoice not found' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/issued-invoice/999/mark-as-invoiced')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({ url: 'https://www.freelo.io', subject: 'Company tld.' });

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Invoice not found' });
    });

    it('should handle validation errors', async () => {
      // Setup mock API error response
      nock(API_BASE_URL)
        .post('/issued-invoice/176/mark-as-invoiced', { /* missing required fields */ })
        .reply(400, { error: 'Validation failed', message: 'URL and subject are required' });

      // Make request to our API
      const response = await request(app)
        .post('/api/v1/issued-invoice/176/mark-as-invoiced')
        .set('Authorization', `Basic ${authString}`)
        .set('User-Agent', testAuth.userAgent)
        .send({});

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed', message: 'URL and subject are required' });
    });
  });
});
