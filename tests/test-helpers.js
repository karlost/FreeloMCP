import nock from 'nock'; // Import nock library

/**
 * Helper functions and constants for testing MCP tools
 */
// Test data from real Freelo account
// Use mock data for testing instead of real IDs
export const TEST_DATA = {
  projectId: 'mockProjectId123',
  tasklistId: 'mockTasklistId456',
  taskId: 'mockTaskId789',
  subtaskId: 'mockSubtaskId101',
  commentId: 'mockCommentId112',
  labelId: 'mockLabelUuid131', // Use a mock UUID
  userId: 'mockUserId141',
  fileUuid: 'mockFileUuid151'
};

// Use mock environment variables for testing
export const TEST_ENV = {
  FREELO_EMAIL: 'mock@example.com',
  FREELO_API_KEY: 'mockApiKeyAbc123',
  FREELO_USER_AGENT: 'freelo-mcp-test-agent',
  FREELO_API_BASE_URL: 'https://api.freelo.cz/v1' // Define base URL for mocking
};

// --- Nock Setup ---

/**
 * Activate nock interceptors before each test.
 */
export function setupNock() {
  if (!nock.isActive()) {
    nock.activate();
  }
  // Prevent unintended real HTTP requests during tests
  nock.disableNetConnect();
  // Allow localhost connections (e.g., for the MCP server itself if needed)
  nock.enableNetConnect('127.0.0.1');
}

/**
 * Clean up nock interceptors and restore HTTP requests after each test.
 */
export function cleanupNock() {
  nock.cleanAll();
  nock.restore();
}

/**
 * Helper function to mock a Freelo API endpoint using nock.
 * @param {string} method - HTTP method (get, post, put, delete, etc.)
 * @param {string|RegExp} path - API endpoint path (e.g., '/projects' or /\/task\/\d+/)
 * @param {number} statusCode - Expected HTTP status code (e.g., 200, 404)
 * @param {object|string} responseBody - The mock response body
 * @param {object} [requestBody=undefined] - Optional request body for matching POST/PUT requests
 * @param {object} [options={}] - Optional nock options (e.g., { times: 2 })
 * @returns {nock.Scope} - The nock scope for further chaining if needed
 */
export function mockFreeloApi(method, path, statusCode, responseBody, requestBody = undefined, options = {}) {
  const scope = nock(TEST_ENV.FREELO_API_BASE_URL)
    .matchHeader('X-Freelo-Api-Key', TEST_ENV.FREELO_API_KEY) // Ensure API key header is matched
    .matchHeader('User-Agent', TEST_ENV.FREELO_USER_AGENT); // Ensure User-Agent header is matched

  const interceptor = scope[method.toLowerCase()](path, requestBody);

  // Apply options like 'times'
  if (options.times) {
    interceptor.times(options.times);
  }

  return interceptor.reply(statusCode, responseBody);
}

// --- End Nock Setup ---


/**
 * Set up environment variables for testing
 */
export function setupTestEnv() {
  // Set mock environment variables for testing purposes
  // Note: API calls should ideally be intercepted by nock,
  // making these less critical for authentication in tests.
  process.env.FREELO_EMAIL = TEST_ENV.FREELO_EMAIL;
  process.env.FREELO_API_KEY = TEST_ENV.FREELO_API_KEY;
  process.env.FREELO_USER_AGENT = TEST_ENV.FREELO_USER_AGENT;
}

/**
 * Clean up environment variables after testing
 */
export function cleanupTestEnv() {
  delete process.env.FREELO_EMAIL;
  delete process.env.FREELO_API_KEY;
  delete process.env.FREELO_USER_AGENT;
}

/**
 * Create a mock MCP server with tools from the real MCP server
 * @param {Object} tools - The tools from the real MCP server
 * @returns {Object} - The mock MCP server
 */
export function createMockMcpServer(tools) {
  return {
    tool: (name, schema, handler) => {
      tools[name] = { schema, handler };
    },
    getTools: () => tools
  };
}

/**
 * Check if a response is valid
 * @param {Object} response - The response to check
 * @returns {boolean} - Whether the response is valid
 */
export function isValidResponse(response) {
  return (
    response &&
    response.content &&
    Array.isArray(response.content) &&
    response.content.length > 0 &&
    response.content.every(item => item.type === 'text' && typeof item.text === 'string')
  );
}

/**
 * Check if a response is an error
 * @param {Object} response - The response to check
 * @returns {boolean} - Whether the response is an error
 */
export function isErrorResponse(response) {
  return response && response.isError === true;
}

/**
 * Get the data from a response
 * @param {Object} response - The response to get data from
 * @returns {Object} - The data from the response
 */
export function getResponseData(response) {
  if (!isValidResponse(response)) {
    throw new Error('Invalid response');
  }
  
  // The last item in the content array should be the JSON data
  const jsonText = response.content[response.content.length - 1].text;
  return JSON.parse(jsonText);
}

/**
 * Generate a random string
 * @param {number} length - The length of the string
 * @returns {string} - The random string
 */
export function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a date string in ISO format
 * @param {number} daysFromNow - The number of days from now
 * @returns {string} - The date string in ISO format
 */
export function dateString(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}
