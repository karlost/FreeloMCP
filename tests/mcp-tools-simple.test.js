/**
 * Simple tests for MCP tools using ES modules
 */

// No need to import jest as we're not using it directly
import nock from 'nock';
import { createApiClient } from '../utils/apiClient.js';

// Test data for mocking
const TEST_DATA = {
  projectId: 'mockProjectId123',
  tasklistId: 'mockTasklistId456',
  taskId: 'mockTaskId789',
  subtaskId: 'mockSubtaskId101',
  commentId: 'mockCommentId112',
  labelId: 'mockLabelUuid131',
  userId: 'mockUserId141',
  fileUuid: 'mockFileUuid151'
};

// Mock environment variables for testing
process.env.FREELO_EMAIL = 'mock@example.com';
process.env.FREELO_API_KEY = 'mockApiKey123';
process.env.FREELO_USER_AGENT = 'freelo-mcp-test';

// Setup nock for API mocking
const API_BASE_URL = 'https://api.freelo.cz/v1';

// Helper function to mock API responses
function mockFreeloApi(method, path, statusCode, responseBody, requestBody = undefined) {
  const scope = nock(API_BASE_URL)
    .matchHeader('Authorization', function(val) {
      return val !== undefined; // Just check that Authorization header exists
    })
    .matchHeader('User-Agent', function(val) {
      return val !== undefined; // Just check that User-Agent header exists
    });

  const interceptor = scope[method.toLowerCase()](path, requestBody);
  return interceptor.reply(statusCode, responseBody);
}

// Direct test of the MCP server
describe('MCP Tools Direct Test', () => {
  // Setup and cleanup for each test
  beforeAll(() => {
    // Enable nock and disable real HTTP requests
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterAll(() => {
    // Clean up nock and restore real HTTP requests
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(() => {
    // Clean up before each test
    nock.cleanAll();
  });

  afterEach(() => {
    // Ensure all mocks were used
    if (!nock.isDone()) {
      console.error('Not all nock interceptors were used!');
      nock.cleanAll();
    }
  });

  // Test get_projects tool
  test('get_projects should return projects', async () => {
    // Mock the API response
    const mockProjects = [
      { id: TEST_DATA.projectId, name: 'Mock Project 1' },
      { id: 'mockProject2', name: 'Mock Project 2' }
    ];
    mockFreeloApi('GET', '/projects', 200, mockProjects);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get('/projects');

    // Check the response
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0]).toHaveProperty('id', TEST_DATA.projectId);
    expect(response.data[0]).toHaveProperty('name', 'Mock Project 1');
  });

  // Test get_project_details tool
  test('get_project_details should return project details', async () => {
    // Mock the API response
    const mockProjectDetails = {
      id: TEST_DATA.projectId,
      name: 'Mock Project Details',
      description: 'This is a mock project',
      state_id: 1
    };
    mockFreeloApi('GET', `/project/${TEST_DATA.projectId}`, 200, mockProjectDetails);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/project/${TEST_DATA.projectId}`);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.projectId);
    expect(response.data).toHaveProperty('name', 'Mock Project Details');
    expect(response.data).toHaveProperty('description', 'This is a mock project');
  });

  // Test get_task_details tool
  test('get_task_details should return task details', async () => {
    // Mock the API response
    const mockTaskDetails = {
      id: TEST_DATA.taskId,
      name: 'Mock Task Details',
      description: 'This is a mock task',
      tasklist_id: TEST_DATA.tasklistId,
      project_id: TEST_DATA.projectId
    };
    mockFreeloApi('GET', `/task/${TEST_DATA.taskId}`, 200, mockTaskDetails);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/task/${TEST_DATA.taskId}`);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.taskId);
    expect(response.data).toHaveProperty('name', 'Mock Task Details');
    expect(response.data).toHaveProperty('tasklist_id', TEST_DATA.tasklistId);
  });

  // Test get_tasklist_details tool
  test('get_tasklist_details should return tasklist details', async () => {
    // Mock the API response
    const mockTasklistDetails = {
      id: TEST_DATA.tasklistId,
      name: 'Mock Tasklist Details',
      description: 'This is a mock tasklist',
      project_id: TEST_DATA.projectId
    };
    mockFreeloApi('GET', `/tasklist/${TEST_DATA.tasklistId}`, 200, mockTasklistDetails);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/tasklist/${TEST_DATA.tasklistId}`);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.tasklistId);
    expect(response.data).toHaveProperty('name', 'Mock Tasklist Details');
    expect(response.data).toHaveProperty('project_id', TEST_DATA.projectId);
  });

  // Test get_subtasks tool
  test('get_subtasks should return subtasks', async () => {
    // Mock the API response
    const mockSubtasks = [
      {
        id: TEST_DATA.subtaskId,
        name: 'Mock Subtask 1',
        task_id: TEST_DATA.taskId,
        labels: [{ uuid: TEST_DATA.labelId, name: 'Mock Label' }]
      },
      {
        id: 'mockSubtask2',
        name: 'Mock Subtask 2',
        task_id: TEST_DATA.taskId
      }
    ];
    mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/subtasks`, 200, mockSubtasks);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/task/${TEST_DATA.taskId}/subtasks`);

    // Check the response
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0]).toHaveProperty('id', TEST_DATA.subtaskId);
    expect(response.data[0]).toHaveProperty('name', 'Mock Subtask 1');
    expect(response.data[0].labels[0]).toHaveProperty('uuid', TEST_DATA.labelId);
  });

  // Test get_task_comments tool
  test('get_task_comments should return comments', async () => {
    // Mock the API response
    const mockComments = [
      {
        id: TEST_DATA.commentId,
        content: 'Mock Comment 1',
        task_id: TEST_DATA.taskId,
        user_id: TEST_DATA.userId,
        created_at: '2023-01-01T12:00:00Z'
      },
      {
        id: 'mockComment2',
        content: 'Mock Comment 2',
        task_id: TEST_DATA.taskId,
        user_id: TEST_DATA.userId,
        created_at: '2023-01-02T12:00:00Z'
      }
    ];
    mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/comments`, 200, mockComments);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/task/${TEST_DATA.taskId}/comments`);

    // Check the response
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0]).toHaveProperty('id', TEST_DATA.commentId);
    expect(response.data[0]).toHaveProperty('content', 'Mock Comment 1');
    expect(response.data[0]).toHaveProperty('task_id', TEST_DATA.taskId);
  });

  // Test get_task_labels tool
  test('get_task_labels should return labels', async () => {
    // Mock the API response
    const mockLabels = [
      {
        uuid: TEST_DATA.labelId,
        name: 'Mock Label 1',
        color: '#ff0000'
      },
      {
        uuid: 'mockLabel2',
        name: 'Mock Label 2',
        color: '#00ff00'
      }
    ];
    mockFreeloApi('GET', '/task-labels', 200, mockLabels);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get('/task-labels');

    // Check the response
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0]).toHaveProperty('uuid', TEST_DATA.labelId);
    expect(response.data[0]).toHaveProperty('name', 'Mock Label 1');
    expect(response.data[0]).toHaveProperty('color', '#ff0000');
  });

  // Test get_time_estimates tool
  test('get_time_estimates should return time estimates', async () => {
    // Mock the API response
    const mockTimeEstimates = {
      total: { hours: 5, minutes: 30 },
      users: [
        { user_id: TEST_DATA.userId, hours: 2, minutes: 0 },
        { user_id: 'mockUser2', hours: 3, minutes: 30 }
      ]
    };
    mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/time-estimates`, 200, mockTimeEstimates);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.get(`/task/${TEST_DATA.taskId}/time-estimates`);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('total');
    expect(response.data.total).toHaveProperty('hours', 5);
    expect(response.data.total).toHaveProperty('minutes', 30);
    expect(response.data).toHaveProperty('users');
    expect(response.data.users.length).toBe(2);
    expect(response.data.users[0]).toHaveProperty('user_id', TEST_DATA.userId);
  });

  // Test edit_task tool
  test('edit_task should edit a task', async () => {
    // Generate a random string for the task name
    const randomString = Math.random().toString(36).substring(7);

    // Create task data
    const taskData = {
      name: `Edited Test Task ${randomString}`,
      description: 'This is an edited test task'
    };

    // Mock the API response
    const mockEditedTask = {
      ...taskData,
      id: TEST_DATA.taskId,
      tasklist_id: TEST_DATA.tasklistId,
      project_id: TEST_DATA.projectId
    };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}`, 200, mockEditedTask, taskData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.post(`/task/${TEST_DATA.taskId}`, taskData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.taskId);
    expect(response.data).toHaveProperty('name', taskData.name);
    expect(response.data).toHaveProperty('description', taskData.description);
  });

  // Test edit_subtask tool
  test('edit_subtask should edit a subtask', async () => {
    // Generate a random string for the subtask name
    const randomString = Math.random().toString(36).substring(7);

    // Create subtask data
    const subtaskData = {
      name: `Edited Test Subtask ${randomString}`
    };

    // Mock the API response
    const mockEditedSubtask = {
      ...subtaskData,
      id: TEST_DATA.subtaskId,
      task_id: TEST_DATA.taskId
    };
    mockFreeloApi('POST', `/subtask/${TEST_DATA.subtaskId}`, 200, mockEditedSubtask, subtaskData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.post(`/subtask/${TEST_DATA.subtaskId}`, subtaskData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.subtaskId);
    expect(response.data).toHaveProperty('name', subtaskData.name);
    expect(response.data).toHaveProperty('task_id', TEST_DATA.taskId);
  });

  // Test edit_comment tool
  test('edit_comment should edit a comment', async () => {
    // Generate a random string for the comment content
    const randomString = Math.random().toString(36).substring(7);

    // Create comment data
    const commentData = {
      content: `Edited Test Comment ${randomString}`
    };

    // Mock the API response
    const mockEditedComment = {
      ...commentData,
      id: TEST_DATA.commentId,
      task_id: TEST_DATA.taskId,
      user_id: TEST_DATA.userId,
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-03T12:00:00Z'
    };
    mockFreeloApi('POST', `/comment/${TEST_DATA.commentId}`, 200, mockEditedComment, commentData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Call the API directly
    const response = await apiClient.post(`/comment/${TEST_DATA.commentId}`, commentData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', TEST_DATA.commentId);
    expect(response.data).toHaveProperty('content', commentData.content);
    expect(response.data).toHaveProperty('task_id', TEST_DATA.taskId);
  });

  // Test create_task and delete_task tools
  test('create_task and delete_task should work', async () => {
    // Generate a random string for the task name
    const randomString = Math.random().toString(36).substring(7);

    // Create task data
    const taskData = {
      name: `Test Task ${randomString}`,
      description: 'This is a test task created by automated tests',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Due in 7 days
    };

    // Mock the create task API response
    const mockCreatedTask = {
      ...taskData,
      id: 'mockCreatedTaskId123',
      tasklist_id: TEST_DATA.tasklistId,
      project_id: TEST_DATA.projectId
    };
    mockFreeloApi('POST', `/tasklist/${TEST_DATA.tasklistId}/task`, 200, mockCreatedTask, taskData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Create task
    const createResponse = await apiClient.post(`/tasklist/${TEST_DATA.tasklistId}/task`, taskData);

    // Check the response
    expect(createResponse.status).toBe(200);
    expect(createResponse.data).toHaveProperty('id', 'mockCreatedTaskId123');
    expect(createResponse.data).toHaveProperty('name', taskData.name);

    // Store the created task ID
    const createdTaskId = createResponse.data.id;

    // Mock the delete task API response
    const mockDeleteResponse = { status: 'success' };
    mockFreeloApi('DELETE', `/task/${createdTaskId}`, 200, mockDeleteResponse);

    // Delete task
    const deleteResponse = await apiClient.delete(`/task/${createdTaskId}`);

    // Check the response
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data).toHaveProperty('status', 'success');
  });

  // Test create_subtask and delete_subtask tools
  test('create_subtask and delete_subtask should work', async () => {
    // Generate a random string for the subtask name
    const randomString = Math.random().toString(36).substring(7);

    // Create subtask data
    const subtaskData = {
      name: `Test Subtask ${randomString}`,
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Due in 5 days
    };

    // Mock the create subtask API response
    const mockCreatedSubtask = {
      ...subtaskData,
      id: 'mockCreatedSubtaskId123',
      task_id: TEST_DATA.taskId
    };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/subtask`, 200, mockCreatedSubtask, subtaskData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Create subtask
    const createResponse = await apiClient.post(`/task/${TEST_DATA.taskId}/subtask`, subtaskData);

    // Check the response
    expect(createResponse.status).toBe(200);
    expect(createResponse.data).toHaveProperty('id', 'mockCreatedSubtaskId123');
    expect(createResponse.data).toHaveProperty('name', subtaskData.name);

    // Store the created subtask ID
    const createdSubtaskId = createResponse.data.id;

    // Mock the delete subtask API response
    const mockDeleteResponse = { status: 'success' };
    mockFreeloApi('DELETE', `/subtask/${createdSubtaskId}`, 200, mockDeleteResponse);

    // Delete subtask
    const deleteResponse = await apiClient.delete(`/subtask/${createdSubtaskId}`);

    // Check the response
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data).toHaveProperty('status', 'success');
  });

  // Test create_comment and delete_comment tools
  test('create_comment and delete_comment should work', async () => {
    // Generate a random string for the comment text
    const randomString = Math.random().toString(36).substring(7);

    // Create comment data
    const commentData = {
      text: `Test Comment ${randomString}`
    };

    // Mock the create comment API response
    const mockCreatedComment = {
      id: 'mockCreatedCommentId123',
      content: commentData.text,
      task_id: TEST_DATA.taskId,
      user_id: TEST_DATA.userId,
      created_at: '2023-01-01T12:00:00Z'
    };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/comments`, 200, mockCreatedComment, commentData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Create comment
    const createResponse = await apiClient.post(`/task/${TEST_DATA.taskId}/comments`, commentData);

    // Check the response
    expect(createResponse.status).toBe(200);
    expect(createResponse.data).toHaveProperty('id', 'mockCreatedCommentId123');
    expect(createResponse.data).toHaveProperty('content', commentData.text);

    // Store the created comment ID
    const createdCommentId = createResponse.data.id;

    // Mock the delete comment API response
    const mockDeleteResponse = { status: 'success' };
    mockFreeloApi('DELETE', `/comment/${createdCommentId}`, 200, mockDeleteResponse);

    // Delete comment
    const deleteResponse = await apiClient.delete(`/comment/${createdCommentId}`);

    // Check the response
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data).toHaveProperty('status', 'success');
  });

  // Test add_labels_to_task and remove_labels_from_task tools
  test('add_labels_to_task and remove_labels_from_task should work', async () => {
    // Create request data for adding labels
    const addLabelsData = {
      labels: [{ uuid: TEST_DATA.labelId }]
    };

    // Mock the add labels API response
    const mockAddLabelsResponse = { status: 'success' };
    mockFreeloApi('POST', `/task-labels/add-to-task/${TEST_DATA.taskId}`, 200, mockAddLabelsResponse, addLabelsData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Add label to task
    const addResponse = await apiClient.post(`/task-labels/add-to-task/${TEST_DATA.taskId}`, addLabelsData);

    // Check the response
    expect(addResponse.status).toBe(200);
    expect(addResponse.data).toHaveProperty('status', 'success');

    // Create request data for removing labels
    const removeLabelsData = {
      labels: [{ uuid: TEST_DATA.labelId }]
    };

    // Mock the remove labels API response
    const mockRemoveLabelsResponse = { status: 'success' };
    mockFreeloApi('POST', `/task-labels/remove-from-task/${TEST_DATA.taskId}`, 200, mockRemoveLabelsResponse, removeLabelsData);

    // Remove label from task
    const removeResponse = await apiClient.post(`/task-labels/remove-from-task/${TEST_DATA.taskId}`, removeLabelsData);

    // Check the response
    expect(removeResponse.status).toBe(200);
    expect(removeResponse.data).toHaveProperty('status', 'success');
  });

  // Test create_total_time_estimate tool
  test('create_total_time_estimate should work', async () => {
    // Create time estimate data
    const timeEstimateData = {
      hours: 2,
      minutes: 30
    };

    // Mock the create time estimate API response
    const mockTimeEstimateResponse = { status: 'success' };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/total-time-estimate`, 200, mockTimeEstimateResponse, timeEstimateData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Create time estimate
    const response = await apiClient.post(`/task/${TEST_DATA.taskId}/total-time-estimate`, timeEstimateData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
  });

  // Test create_user_time_estimate tool
  test('create_user_time_estimate should work', async () => {
    // Mock the project workers API response
    const mockWorkers = [
      { id: TEST_DATA.userId, fullname: 'Mock User 1', email: 'mock@example.com' },
      { id: 'mockUser2', fullname: 'Mock User 2', email: 'mock2@example.com' }
    ];
    mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/workers`, 200, mockWorkers);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Get project workers
    const workersResponse = await apiClient.get(`/project/${TEST_DATA.projectId}/workers`);
    expect(workersResponse.status).toBe(200);
    expect(Array.isArray(workersResponse.data)).toBe(true);
    expect(workersResponse.data.length).toBe(2);

    // Get the first worker's ID
    const userId = workersResponse.data[0].id;

    // Create user time estimate data
    const userTimeEstimateData = {
      user_id: userId,
      hours: 1,
      minutes: 45
    };

    // Mock the create user time estimate API response
    const mockUserTimeEstimateResponse = { status: 'success' };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/user-time-estimate`, 200, mockUserTimeEstimateResponse, userTimeEstimateData);

    // Create user time estimate
    const response = await apiClient.post(`/task/${TEST_DATA.taskId}/user-time-estimate`, userTimeEstimateData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
  });

  // Test finish_task and activate_task tools
  test('finish_task and activate_task should work', async () => {
    // Mock the finish task API response
    const mockFinishResponse = { status: 'success' };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/finish`, 200, mockFinishResponse);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Finish task
    const finishResponse = await apiClient.post(`/task/${TEST_DATA.taskId}/finish`);

    // Check the response
    expect(finishResponse.status).toBe(200);
    expect(finishResponse.data).toHaveProperty('status', 'success');

    // Mock the activate task API response
    const mockActivateResponse = { status: 'success' };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/activate`, 200, mockActivateResponse);

    // Activate task
    const activateResponse = await apiClient.post(`/task/${TEST_DATA.taskId}/activate`);

    // Check the response
    expect(activateResponse.status).toBe(200);
    expect(activateResponse.data).toHaveProperty('status', 'success');
  });

  // Test move_task tool
  test('move_task should work', async () => {
    // Mock the move task API response
    const mockMoveResponse = { status: 'success' };
    mockFreeloApi('POST', `/task/${TEST_DATA.taskId}/move/${TEST_DATA.tasklistId}`, 200, mockMoveResponse);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Move task
    const response = await apiClient.post(`/task/${TEST_DATA.taskId}/move/${TEST_DATA.tasklistId}`);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
  });

  // Test create_tasklist tool
  test('create_tasklist should work', async () => {
    // Generate a random string for the tasklist name
    const randomString = Math.random().toString(36).substring(7);

    // Create tasklist data
    const tasklistData = {
      name: `Test Tasklist ${randomString}`,
      project_id: TEST_DATA.projectId
    };

    // Mock the create tasklist API response
    const mockCreatedTasklist = {
      ...tasklistData,
      id: 'mockCreatedTasklistId123'
    };
    mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/tasklist`, 200, mockCreatedTasklist, tasklistData);

    // Create API client
    const auth = {
      email: process.env.FREELO_EMAIL,
      apiKey: process.env.FREELO_API_KEY,
      userAgent: process.env.FREELO_USER_AGENT
    };
    const apiClient = createApiClient(auth);

    // Create tasklist
    const response = await apiClient.post(`/project/${TEST_DATA.projectId}/tasklist`, tasklistData);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', 'mockCreatedTasklistId123');
    expect(response.data).toHaveProperty('name', tasklistData.name);
    expect(response.data).toHaveProperty('project_id', TEST_DATA.projectId);
  });
});
